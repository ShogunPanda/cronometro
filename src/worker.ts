import { build as buildHistogram } from 'hdr-histogram-js'
import { Percentiles, percentiles, Result, TestContext, WorkerContext } from './models'
import { log } from './print'

/* istanbul ignore next */
function noOp(): void {
  // No-op
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
      const standardErrorPercentage = histogram.getStdDeviation() / Math.sqrt(executed) / histogram.getMean()

      if (standardErrorPercentage < errorThreshold) {
        stop = true
      }
    }
  }

  // If the test is over
  if (stop || executed > total) {
    const stdDev = histogram.getStdDeviation()

    return context.callback({
      success: true,
      size: executed,
      min: histogram.minNonZeroValue,
      max: histogram.maxValue,
      mean: histogram.getMean(),
      stddev: stdDev,
      percentiles: percentiles.reduce((accu: Percentiles, percentile: number) => {
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
  log(`Executing test ${context.name}, ${context.total - context.executed} iterations to go`)

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
    /* istanbul ignore else */
    if (context.test.length === 0) {
      return context.handler(e)
    }

    /* istanbul ignore next */
    throw e
  }
}

export function runWorker(context: WorkerContext, notifier: (value: any) => void, cb: (code: number) => void): void {
  const { warmup, tests, index, iterations, errorThreshold } = context

  // Require the original file to build tests
  const [name, test] = tests[index]

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

      notifier(result)
      // eslint-disable-next-line standard/no-callback-literal
      cb(result.success ? 0 : 1)
    }
  }

  // Bind the handler to the context
  testContext.handler = handleTestIteration.bind(null, testContext)

  // Schedule the first run
  process.nextTick(() => runTestIteration(testContext))
}
