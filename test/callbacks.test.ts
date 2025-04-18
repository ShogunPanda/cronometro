import { deepStrictEqual, match, ok } from 'node:assert'
import { test } from 'node:test'
import { Worker, isMainThread, parentPort } from 'node:worker_threads'
import { cronometro, type Result, type TestFunction } from '../src/index.ts'

if (!isMainThread) {
  parentPort!.postMessage('another')

  cronometro(
    {
      single() {
        Buffer.alloc(10)
      },
      multiple() {
        throw new Error('INVALID')
      },
      missing: undefined as unknown as TestFunction,
      skipped: {
        test() {},
        skip: true
      }
    },
    () => false
  )
} else {
  test('Callbacks', async () => {
    await cronometro(
      {
        single() {
          Buffer.alloc(10)
        },
        multiple() {
          throw new Error('INVALID')
        },
        missing() {
          Buffer.alloc(10)
        },
        skipped: {
          test() {},
          skip: true
        }
      },
      {
        iterations: 10,
        print: false,
        onTestStart(name: string, data: any, worker: Worker) {
          match(name, /single|multiple|missing/)
          ok(data.index < 3)
          ok(worker instanceof Worker)
        },
        onTestEnd(name: string, result: Result, worker: Worker) {
          if (result.success) {
            deepStrictEqual(name, 'single')
            ok(result.size > 0)
          } else {
            deepStrictEqual(name, 'multiple')
            deepStrictEqual(result.error!.message, 'INVALID')
          }
          ok(worker instanceof Worker)
        },
        onTestError(name: string, error: Error, worker: Worker) {
          deepStrictEqual(name, 'missing')
          deepStrictEqual(error.message, "Cannot read properties of undefined (reading 'test')")
          ok(worker instanceof Worker)
        }
      }
    )
  })
}
