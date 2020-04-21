import { isMainThread, parentPort, workerData } from 'worker_threads'
import { runWorker } from './worker'

if (isMainThread) {
  throw new Error('Do not run this file as main script.')
}

// Register ts-node for TypeScript inclusion
if (workerData.path.endsWith('.ts')) {
  const instance = Symbol.for('ts-node.register.instance')

  if (!(instance in process)) {
    require('ts-node').register({ project: process.env.TS_NODE_PROJECT })
  }
}

// Require the script to set tests
require(workerData.path)

// Run the worker
runWorker(workerData, (value: any) => parentPort!.postMessage(value), process.exit)
