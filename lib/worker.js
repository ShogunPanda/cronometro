"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hdr_histogram_js_1 = require("hdr-histogram-js");
const models_1 = require("./models");
const print_1 = require("./print");
/* istanbul ignore next */
function noOp() {
    // No-op
}
function handleTestIteration(context, error) {
    // Grab duration even in case of error to make sure we don't add any overhead to the benchmark
    const duration = Number(process.hrtime.bigint() - context.start);
    // Handle error
    if (error) {
        // Notify the caller we failed
        context.notifier({
            success: false,
            error,
            size: 0,
            min: 0,
            max: 0,
            mean: 0,
            stddev: 0,
            percentiles: {},
            standardError: 0
        });
        return context.callback(1);
    }
    // Get some parameters
    const { histogram, total, errorThreshold } = context;
    // Track results
    histogram.recordValue(duration);
    context.executed++;
    // Check if stop earlier if we are below the error threshold
    const executed = context.executed;
    let stop = false;
    if (errorThreshold > 0) {
        const completedPercentage = Math.floor((1 - executed / total) * 10000);
        // Check if abort the test earlier. It is checked every 5% after 10% of the iterations
        if (completedPercentage > 1000 && completedPercentage % 500 === 0) {
            const standardErrorPercentage = histogram.getStdDeviation() / Math.sqrt(executed) / histogram.getMean();
            if (standardErrorPercentage < errorThreshold) {
                stop = true;
            }
        }
    }
    // If the test is over
    if (stop || executed > total) {
        const stdDev = histogram.getStdDeviation();
        // Notify the caller the results
        context.notifier({
            success: true,
            size: executed,
            min: histogram.minNonZeroValue,
            max: histogram.maxValue,
            mean: histogram.getMean(),
            stddev: stdDev,
            percentiles: models_1.percentiles.reduce((accu, percentile) => {
                accu[percentile] = histogram.getValueAtPercentile(percentile);
                return accu;
            }, {}),
            standardError: stdDev / Math.sqrt(executed)
        });
        return context.callback(0);
    }
    // Schedule next iteration
    process.nextTick(() => runTestIteration(context));
}
function runTestIteration(context) {
    print_1.log(`Executing test ${context.name}, ${context.total - context.executed} iterations to go`);
    // Execute the function and get the response time - Handle also promises
    try {
        context.start = process.hrtime.bigint();
        const callResult = context.test(context.handler);
        // It is a promise, handle it accordingly
        if (callResult && typeof callResult.then === 'function') {
            callResult.then(() => context.handler(null), context.handler);
        }
        else if (context.test.length === 0) {
            // The function is not a promise and has no arguments, so it's sync
            context.handler(null);
        }
    }
    catch (e) {
        // If a error was thrown, only handle if the original function length is 0, which means it's a sync error, otherwise propagate
        /* istanbul ignore else */
        if (context.test.length === 0) {
            return context.handler(e);
        }
        /* istanbul ignore next */
        throw e;
    }
}
function runWorker(context, notifier, callback) {
    const { tests, index, iterations, errorThreshold } = context;
    // Require the original file to build tests
    const [name, test] = tests[index];
    // Prepare the context
    const testContext = {
        name,
        test,
        errorThreshold,
        total: iterations - 1,
        executed: 0,
        histogram: hdr_histogram_js_1.build({
            lowestDiscernibleValue: 1,
            highestTrackableValue: 1e9,
            numberOfSignificantValueDigits: 5
        }),
        start: BigInt(0),
        handler: noOp,
        notifier,
        callback
    };
    // Bind the handler to the context
    testContext.handler = handleTestIteration.bind(null, testContext);
    // Schedule the first run
    process.nextTick(() => runTestIteration(testContext));
}
exports.runWorker = runWorker;
