"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const worker_1 = require("./worker");
if (worker_threads_1.isMainThread) {
    throw new Error('Do not run this file as main script.');
}
// Register ts-node for TypeScript inclusion
if (worker_threads_1.workerData.path.endsWith('.ts')) {
    const instance = Symbol.for('ts-node.register.instance');
    if (!(instance in process)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('ts-node').register({ project: process.env.TS_NODE_PROJECT });
    }
}
// Require the script to set tests
require(worker_threads_1.workerData.path);
// Run the worker
worker_1.runWorker(worker_threads_1.workerData, (value) => worker_threads_1.parentPort.postMessage(value), process.exit);
