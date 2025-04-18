import { pathToFileURL } from 'node:url'
import { isMainThread, Worker, workerData } from 'node:worker_threads'
import {
  defaultOptions,
  runnerPath,
  type Callback,
  type Context,
  type Options,
  type PrintOptions,
  type Result,
  type Results,
  type Tests
} from './models.ts'
import { printResults } from './print.ts'

type PromiseResolver<T> = (value: T) => void
type PromiseRejecter = (err: Error) => void

export * from './models.ts'
export { printResults } from './print.ts'
export * from './tracker.ts'

function scheduleNextTest(context: Context): void {
  // We still have work to do
  if (context.current < context.tests.length) {
    process.nextTick(() => {
      run(context)
    })
    return
  }

  if (context.print) {
    const { colors, compare, compareMode }: PrintOptions = {
      colors: true,
      compare: false,
      compareMode: 'base',
      ...(context.print === true ? {} : context.print)
    }

    printResults(context.results, colors, compare, compareMode)
  }

  context.callback(null, context.results)
}

function run(context: Context): void {
  const name = context.tests[context.current][0]
  const workerData = {
    path: pathToFileURL(process.argv[1]).toString(),
    index: context.current,
    iterations: context.iterations,
    warmup: context.warmup,
    errorThreshold: context.errorThreshold
  }

  /* c8 ignore next 5 */
  let nodeOptions = process.env.NODE_OPTIONS ?? ''
  const nodeMajor = Number(process.versions.node.split('.')[0])
  if (nodeMajor < 23) {
    nodeOptions += ' --experimental-strip-types '
  }

  const worker = new Worker(runnerPath, {
    workerData,
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions
    }
  })

  if (context.onTestStart) {
    context.onTestStart(name, workerData, worker)
  }

  worker.on('error', error => {
    context.results[name] = {
      success: false,
      error,
      size: 0,
      min: 0,
      max: 0,
      mean: 0,
      stddev: 0,
      percentiles: {},
      standardError: 0
    }

    context.current++

    if (context.onTestError) {
      context.onTestError(name, error, worker)
    }

    scheduleNextTest(context)
  })

  worker.on('message', message => {
    if (message.type !== 'cronometro.result') {
      return
    }

    const result = message.payload

    context.results[name] = result
    context.current++

    if (context.onTestEnd) {
      context.onTestEnd(name, result as Result, worker)
    }

    scheduleNextTest(context)
  })
}

export function cronometro(tests: Tests): Promise<Results> | void
export function cronometro(tests: Tests, options: Partial<Options>): Promise<Results>
export function cronometro(tests: Tests, options: Partial<Options>, cb: Callback): undefined
export function cronometro(tests: Tests, options: Callback): void
export function cronometro(
  tests: Tests,
  options?: Partial<Options> | Callback,
  cb?: Callback
): Promise<Results> | void {
  if (!isMainThread) {
    workerData.tests = Object.entries(tests).filter(test => test[1]?.skip !== true)
    return
  }

  let promise: Promise<Results> | undefined
  let promiseResolve: PromiseResolver<Results>
  let promiseReject: PromiseRejecter

  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  let callback = cb as (err: Error | null, results?: Results) => void

  if (!callback) {
    promise = new Promise<Results>((resolve, reject) => {
      promiseResolve = resolve
      promiseReject = reject
    })

    callback = function (err: Error | null, results?: Results): void {
      if (err) {
        promiseReject(err)
        return
      }

      promiseResolve(results!)
    }
  }

  // Parse and validate options
  const { iterations, errorThreshold, print, warmup, onTestStart, onTestEnd, onTestError } = {
    ...defaultOptions,
    ...options
  }

  if (typeof iterations !== 'number' || iterations < 1) {
    callback(new Error('The iterations option must be a positive number.'))
    return promise
  }

  if (typeof errorThreshold !== 'number' || errorThreshold < 0 || errorThreshold > 100) {
    callback(new Error('The errorThreshold option must be a number between 0 and 100.'))
    return promise
  }

  if (onTestStart && typeof onTestStart !== 'function') {
    callback(new Error('The onTestStart option must be a function.'))
    return promise
  }

  if (onTestEnd && typeof onTestEnd !== 'function') {
    callback(new Error('The onTestEnd option must be a function.'))
    return promise
  }

  if (onTestError && typeof onTestError !== 'function') {
    callback(new Error('The onTestError option must be a function.'))
    return promise
  }

  // Prepare the test
  const context: Context = {
    warmup,
    iterations,
    errorThreshold: errorThreshold / 100,
    print,
    tests: Object.entries(tests).filter(test => test[1]?.skip !== true), // Convert tests to a easier to process [name, func] list,
    results: {},
    current: 0,
    callback,
    onTestStart,
    onTestEnd,
    onTestError
  }

  process.nextTick(() => {
    run(context)
  })
  return promise
}

export default cronometro
