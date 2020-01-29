'use strict'

// @ts-ignore
import Histogram from 'native-hdr-histogram'
import { Callback, Context, Options, PrintOptions, Results, TestContext, Tests } from './models'
import { printResults } from './print'

type PromiseResolver<T> = (value: T) => void
type PromiseRejecter = (err: Error) => void

export * from './models'

const debug = (process.env.NODE_DEBUG || '').includes('cronometro')

function schedule(operation: () => void): void {
  process.nextTick(operation)
}

function runIteration(context: TestContext): void {
  function trackResults(error?: Error | null): void {
    // Handle error
    if (error) {
      context.results[context.current.name] = { success: false, error }
      schedule(() => processQueue(context))
      return
    }

    const { histogram } = context.current

    if (histogram.record(Number(process.hrtime.bigint() - start))) {
      context.current.records++
    }

    if (context.errorThreshold > 0) {
      const completedPercentage = Math.floor((1 - context.current.remaining / context.iterations) * 10000)

      // Check if abort the test earlier. It is checked every 5% after 10% of the iterations
      if (completedPercentage > 1000 && completedPercentage % 500 === 0) {
        const standardErrorPercentage = histogram.stddev() / Math.sqrt(context.current.records) / histogram.mean()

        if (standardErrorPercentage < context.errorThreshold) {
          context.current.remaining = 0
        }
      }
    }

    if (context.current.remaining === 0) {
      context.results[context.current.name] = {
        success: true,
        size: context.current.records,
        min: histogram.min(),
        max: histogram.min(),
        mean: histogram.mean(),
        stddev: histogram.stddev(),
        percentiles: histogram
          .percentiles()
          .reduce((accu: { [key: string]: number }, { percentile, value }: { percentile: number; value: number }) => {
            accu[percentile] = value
            return accu
          }, {}),
        standardError: histogram.stddev() / Math.sqrt(context.current.records)
      }

      schedule(() => processQueue(context))
      return
    }

    context.current.remaining--
    schedule(() => runIteration(context))
  }

  if (debug) {
    console.debug(`cronometro: Executing test ${context.current.name}, ${context.current.remaining} iterations to go`)
  }

  const start = process.hrtime.bigint()

  try {
    // Execute the function and get the response time - Handle also promises
    const callResult = context.current.test(trackResults)

    if (callResult && typeof callResult.then === 'function') {
      callResult.then(() => trackResults(null), trackResults)
    } else if (context.current.test.length === 0) {
      trackResults(null)
    }
  } catch (error) {
    context.results[context.current.name] = { success: false, error }
    schedule(() => processQueue(context))
  }
}

function processQueue(context: Context): void {
  // Get the next test to run
  const next = context.queue.shift()

  if (!next) {
    return context.callback(null, context.results)
  }

  const testContext = context as TestContext
  testContext.current = {
    name: next[0],
    test: next[1],
    remaining: context.iterations - 1,
    records: 0,
    histogram: new Histogram(1, 1e9, 5)
  }

  schedule(() => runIteration(testContext))
}

export function cronometro(
  tests: Tests,
  options: Options | Callback,
  callback?: Callback
): Promise<Results> | undefined {
  let promise: Promise<Results> | undefined
  let promiseResolve: PromiseResolver<Results>
  let promiseReject: PromiseRejecter

  if (typeof options === 'function') {
    callback = options
    options = {} as Options
  }

  if (!callback) {
    promise = new Promise<Results>((resolve: PromiseResolver<Results>, reject: PromiseRejecter) => {
      promiseResolve = resolve
      promiseReject = reject
    })

    callback = function(err?: Error | null, results?: Results): void {
      if (err) {
        return promiseReject(err)
      }

      return promiseResolve(results!)
    }
  }

  // Parse and validate options
  const { iterations, errorThreshold, print } = { iterations: 1e4, errorThreshold: 1, print: true, ...options }

  // tslint:disable-next-line strict-type-predicates
  if (typeof iterations !== 'number' || iterations < 1) {
    callback(new Error('The iterations option must be a positive number.'))
    return promise
  }

  // tslint:disable-next-line strict-type-predicates
  if (typeof errorThreshold !== 'number' || errorThreshold < 0 || errorThreshold > 100) {
    callback(new Error('The errorThreshold option must be a number between 0 and 100.'))
    return promise
  }

  // Process all tests
  const context: Context = {
    queue: Object.entries(tests), // Convert tests to a easier to process [name, func] list,
    results: {},
    iterations,
    errorThreshold: errorThreshold / 100,
    callback(error?: Error | null, results?: Results): void {
      if (error) {
        callback!(error)
        return
      }

      if (print) {
        const { colors, compare, compareMode }: PrintOptions = {
          colors: true,
          compare: false,
          compareMode: 'base',
          ...(print === true ? ({} as PrintOptions) : print)
        }

        printResults(results!, colors, compare, compareMode)
      }

      callback!(null, results!)
    }
  }

  schedule(() => processQueue(context))

  return promise
}

module.exports = cronometro
Object.assign(module.exports, exports)
