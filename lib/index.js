'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const native_hdr_histogram_1 = __importDefault(require("native-hdr-histogram"));
const print_1 = require("./print");
function runIteration(context) {
    function trackResults(error) {
        // Handle error
        if (error) {
            context.results[context.current.name] = { success: false, error };
            processQueue(context);
            return;
        }
        const { histogram } = context.current;
        if (histogram.record(Number(process.hrtime.bigint() - start))) {
            context.current.records++;
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
                    .reduce((accu, { percentile, value }) => {
                    accu[percentile] = value;
                    return accu;
                }, {}),
                standardError: histogram.stddev() / Math.sqrt(context.current.records)
            };
            processQueue(context);
            return;
        }
        context.current.remaining--;
        process.nextTick(() => runIteration(context));
    }
    const start = process.hrtime.bigint();
    try {
        // Execute the function and get the response time - Handle also promises
        const callResult = context.current.test(trackResults);
        if (callResult && typeof callResult.then === 'function') {
            callResult.then(() => trackResults(null), trackResults);
        }
        else if (context.current.test.length === 0) {
            trackResults(null);
        }
    }
    catch (error) {
        context.results[context.current.name] = { success: false, error };
        processQueue(context);
    }
}
function processQueue(context) {
    // Get the next test to run
    const next = context.queue.shift();
    if (!next) {
        return context.callback(null, context.results);
    }
    const testContext = context;
    testContext.current = {
        name: next[0],
        test: next[1],
        remaining: context.iterations,
        records: 0,
        histogram: new native_hdr_histogram_1.default(1, 1e9, 5)
    };
    process.nextTick(() => runIteration(testContext));
}
function benchie(tests, options, callback) {
    let promise;
    let promiseResolve;
    let promiseReject;
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    if (!callback) {
        promise = new Promise((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        });
        callback = function (err, results) {
            if (err) {
                return promiseReject(err);
            }
            return promiseResolve(results);
        };
    }
    // Parse and validate options
    const { iterations, print } = { iterations: 1e4, print: true, ...options };
    // tslint:disable-next-line strict-type-predicates
    if (typeof iterations !== 'number' || iterations < 1) {
        callback(new Error('The iterations option must be a positive number.'));
        return promise;
    }
    // Process all tests
    const context = {
        queue: Object.entries(tests),
        results: {},
        iterations,
        callback(error, results) {
            if (error) {
                callback(error);
                return;
            }
            if (print) {
                const { colors, compare, compareMode } = {
                    colors: true,
                    compare: false,
                    compareMode: 'base',
                    ...(print === true ? {} : print)
                };
                print_1.printResults(results, colors, compare, compareMode);
            }
            callback(null, results);
        }
    };
    processQueue(context);
    return promise;
}
exports.benchie = benchie;
module.exports = benchie;
Object.assign(module.exports, exports);
