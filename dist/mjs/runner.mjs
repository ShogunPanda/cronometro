import { isMainThread, parentPort, workerData } from 'worker_threads';
import { runWorker } from "./worker.mjs";
if (isMainThread) {
    throw new Error('Do not run this file as main script.');
}
// Register ts-node for TypeScript inclusion
let chain = Promise.resolve();
if (workerData.path.endsWith('.ts')) {
    const instance = Symbol.for('ts-node.register.instance');
    if (!(instance in process)) {
        chain =
            // @ts-expect-error
            import('ts-node').then(({ register }) => {
                register({ project: process.env.TS_NODE_PROJECT });
            });
    }
}
// Require the script to set tests
chain
    .then(() => {
    return import(workerData.path);
})
    .then(() => {
    // Run the worker
    runWorker(workerData, (value) => parentPort.postMessage(value), process.exit);
})
    .catch((e) => {
    process.nextTick(() => {
        throw e;
    });
});
