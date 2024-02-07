/* c8 ignore start */
import { isMainThread, parentPort, workerData } from 'node:worker_threads'
import { type WorkerContext } from './models.js'
import { runWorker } from './worker.js'

if (isMainThread) {
  throw new Error('Do not run this file as main script.')
}

if (workerData.path.endsWith('.ts')) {
  await import('@swc-node/register/esm-register')
}

// Require the script to set tests
try {
  const module = await import(workerData.path)

  if (typeof module === 'function') {
    await module()
  } else if (typeof module.default === 'function') {
    await module.default()
  }

  // Run the worker
  runWorker(
    workerData as WorkerContext,
    value => {
      parentPort!.postMessage({ type: 'cronometro.result', payload: value })
    },
    (code: number) => process.exit(code)
  )
} catch (error) {
  process.nextTick(() => {
    throw error
  })
}
/* c8 ignore stop */
