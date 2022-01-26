import { build as buildHistogram } from 'hdr-histogram-js'
import { Percentiles, percentiles, Result, SetupFunction, TestContext, TestFunction, WorkerContext } from './models'

function noOp(): void {
  // No-op
}

function noSetup(cb: (err?: Error | null) => void): void {
  cb()
}

function handleTestIteration(context: TestContext, error?: Error | null): void {
  // Grab duration even in case of error to make sure we don't add any overhead to the benchmark
  const duration = Number(process.hrtime.bigint() - context.start)

  // Handle error
  if (error) {
    return context.callback({
      success: false,
      error,
      size: 0,
      min: 0,
      max: 0,
      mean: 0,
      stddev: 0,
      percentiles: {},
      standardError: 0
    })
  }

  // Get some parameters
  const { histogram, total, errorThreshold } = context

  // Track results
  histogram.recordValue(duration)
  context.executed++

  // Check if stop earlier if we are below the error threshold
  const executed = context.executed
  let stop = false

  if (errorThreshold > 0) {
    const completedPercentage = Math.floor((executed / total) * 10000)

    // Check if abort the test earlier. It is checked every 5% after 10% of the iterations
    if (completedPercentage >= 1000 && completedPercentage % 500 === 0) {
      const standardErrorPercentage = histogram.stdDeviation / Math.sqrt(executed) / histogram.mean

      if (standardErrorPercentage < errorThreshold) {
        stop = true
      }
    }
  }

  // If the test is over
  if (stop || executed > total) {
    const stdDev = histogram.stdDeviation

    return context.callback({
      success: true,
      size: executed,
      min: histogram.minNonZeroValue,
      max: histogram.maxValue,
      mean: histogram.mean,
      stddev: stdDev,
      percentiles: percentiles.reduce((accu: Percentiles, percentile) => {
        accu[percentile] = histogram.getValueAtPercentile(percentile)
        return accu
      }, {}),
      standardError: stdDev / Math.sqrt(executed)
    })
  }

  // Schedule next iteration
  process.nextTick(() => runTestIteration(context))
}

function runTestIteration(context: TestContext): void {
  // Execute the function and get the response time - Handle also promises
  try {
    context.start = process.hrtime.bigint()
    const callResult = context.test(context.handler)

    // It is a promise, handle it accordingly
    if (callResult && typeof callResult.then === 'function') {
      callResult.then(() => context.handler(null), context.handler)
    } else if (context.test.length === 0) {
      // The function is not a promise and has no arguments, so it's sync
      context.handler(null)
    }
  } catch (e) {
    // If a error was thrown, only handle if the original function length is 0, which means it's a sync error, otherwise propagate
    if (context.test.length === 0) {
      return context.handler(e)
    }

    throw e
  }
}

function beforeCallback(testContext: TestContext, err?: Error | null): void {
  if (err) {
    return testContext.callback({
      success: false,
      error: err,
      size: 0,
      min: 0,
      max: 0,
      mean: 0,
      stddev: 0,
      percentiles: {},
      standardError: 0
    })
  }

  // Schedule the first run
  return process.nextTick(() => runTestIteration(testContext))
}

function afterCallback(
  result: Result,
  notifier: (value: any) => void,
  cb: (code: number) => void,
  err?: Error | null
): void {
  let notifierCode = result.success ? 0 : 1

  if (err) {
    notifier({
      success: false,
      error: err,
      size: 0,
      min: 0,
      max: 0,
      mean: 0,
      stddev: 0,
      percentiles: {},
      standardError: 0
    })

    notifierCode = 1
  } else {
    notifier(result)
  }

  cb(notifierCode)
}

export function runWorker(context: WorkerContext, notifier: (value: any) => void, cb: (code: number) => void): void {
  const { warmup, tests, index, iterations, errorThreshold } = context

  // Require the original file to build tests
  const [name, testDefinition] = tests[index]

  // Prepare the test
  let test: TestFunction = noOp
  let before: SetupFunction = noSetup
  let after: SetupFunction = noSetup

  if (typeof testDefinition === 'function') {
    test = testDefinition
  } else {
    if (typeof testDefinition.test === 'function') {
      test = testDefinition.test
    }

    if (typeof testDefinition.before === 'function') {
      before = testDefinition.before
    }

    if (typeof testDefinition.after === 'function') {
      after = testDefinition.after
    }
  }

  // Prepare the context
  const testContext: TestContext = {
    name,
    test,
    errorThreshold,
    total: iterations - 1,
    executed: 0,
    histogram: buildHistogram({
      lowestDiscernibleValue: 1,
      highestTrackableValue: 1e9,
      numberOfSignificantValueDigits: 5
    }),
    start: BigInt(0),
    handler: noOp,
    notifier,
    callback(result: Result): void {
      if (warmup) {
        context.warmup = false
        return runWorker(context, notifier, cb)
      }

      const callback = afterCallback.bind(null, result, notifier, cb)
      const afterResponse = after(callback)

      if (afterResponse && typeof afterResponse.then === 'function') {
        afterResponse.then(callback, callback)
      }
    }
  }

  // Bind the handler to the context
  testContext.handler = handleTestIteration.bind(null, testContext)

  // Run the test setup, then start the test
  const callback = beforeCallback.bind(null, testContext)
  const beforeResponse = before(callback)

  if (beforeResponse && typeof beforeResponse.then === 'function') {
    beforeResponse.then(callback, callback)
  }
}
