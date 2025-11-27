/* c8 ignore start */
import type { WorkerContext } from './models.ts'
import { isMainThread, parentPort, workerData } from 'node:worker_threads'
import { runWorker } from './worker.ts'

if (isMainThread) {
  throw new Error('Do not run this file as main script.')
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
