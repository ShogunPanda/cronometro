"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const worker_1 = require("./worker");
if (worker_threads_1.isMainThread) {
    throw new Error('Do not run this file as main script.');
}
// Register ts-node for TypeScript inclusion
let chain = Promise.resolve();
if (worker_threads_1.workerData.path.endsWith('.ts')) {
    const instance = Symbol.for('ts-node.register.instance');
    if (!(instance in process)) {
        chain =
            // @ts-expect-error
            Promise.resolve().then(() => __importStar(require('ts-node'))).then(({ register }) => {
                register({ project: process.env.TS_NODE_PROJECT });
            });
    }
}
// Require the script to set tests
chain
    .then(() => {
    return Promise.resolve().then(() => __importStar(require(worker_threads_1.workerData.path)));
})
    .then(() => {
    // Run the worker
    worker_1.runWorker(worker_threads_1.workerData, (value) => worker_threads_1.parentPort.postMessage(value), process.exit);
})
    .catch((e) => {
    process.nextTick(() => {
        throw e;
    });
});
