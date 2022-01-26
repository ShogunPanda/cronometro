import { isMainThread, parentPort, workerData } from 'worker_threads'
import { runWorker } from './worker'

if (isMainThread) {
  throw new Error('Do not run this file as main script.')
}

// Register ts-node for TypeScript inclusion
let chain: Promise<void> = Promise.resolve()

/* c8 ignore start */
if (workerData.path.endsWith('.ts')) {
  const instance = Symbol.for('ts-node.register.instance')

  if (!(instance in process)) {
    chain = import('ts-node').then(({ register }) => {
      register({ project: process.env.TS_NODE_PROJECT })
    })
  }
}

// Require the script to set tests
chain
  .then(() => {
    return import(workerData.path)
  })
  .then(module => {
    if (typeof module === 'function') {
      return module()
    } else if (typeof module.default === 'function') {
      return module.default()
    }
  })
  .then(() => {
    // Run the worker
    runWorker(workerData, value => parentPort!.postMessage(value), process.exit)
  })
  .catch(e => {
    process.nextTick(() => {
      throw e
    })
  })
/* c8 ignore stop */
