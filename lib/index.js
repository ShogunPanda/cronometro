'use strict';
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const worker_threads_1 = require("worker_threads");
const models_1 = require("./models");
const print_1 = require("./print");
__export(require("./models"));
function scheduleNextTest(context) {
    // We still have work to do
    if (context.current < context.tests.length) {
        return process.nextTick(() => run(context));
    }
    if (context.print) {
        const { colors, compare, compareMode } = {
            colors: true,
            compare: false,
            compareMode: 'base',
            ...(context.print === true ? {} : context.print)
        };
        print_1.printResults(context.results, colors, compare, compareMode);
    }
    context.callback(null, context.results);
}
function run(context) {
    const name = context.tests[context.current][0];
    const worker = new worker_threads_1.Worker(path_1.join(__dirname, '../lib/runner.js'), {
        workerData: {
            path: process.argv[1],
            index: context.current,
            iterations: context.iterations,
            warmup: context.warmup,
            errorThreshold: context.errorThreshold
        }
    });
    worker.on('error', (error) => {
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
        };
        context.current++;
        scheduleNextTest(context);
    });
    worker.on('message', (result) => {
        context.results[name] = result;
        context.current++;
        scheduleNextTest(context);
    });
}
function cronometro(tests, options, cb) {
    /* istanbul ignore next */
    if (!worker_threads_1.isMainThread) {
        worker_threads_1.workerData.tests = Object.entries(tests);
        return;
    }
    let promise;
    let promiseResolve;
    let promiseReject;
    if (typeof options === 'function') {
        cb = options;
        options = {};
    }
    let callback = cb;
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
    const { iterations, errorThreshold, print, warmup } = { ...models_1.defaultOptions, ...options };
    // tslint:disable-next-line strict-type-predicates
    if (typeof iterations !== 'number' || iterations < 1) {
        callback(new Error('The iterations option must be a positive number.'));
        return promise;
    }
    // tslint:disable-next-line strict-type-predicates
    if (typeof errorThreshold !== 'number' || errorThreshold < 0 || errorThreshold > 100) {
        callback(new Error('The errorThreshold option must be a number between 0 and 100.'));
        return promise;
    }
    // Prepare the test
    const context = {
        warmup,
        iterations,
        errorThreshold: errorThreshold / 100,
        print,
        tests: Object.entries(tests),
        results: {},
        current: 0,
        callback
    };
    process.nextTick(() => run(context));
    return promise;
}
exports.cronometro = cronometro;
module.exports = cronometro;
Object.assign(module.exports, exports);
