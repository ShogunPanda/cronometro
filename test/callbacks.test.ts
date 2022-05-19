/* eslint-disable @typescript-eslint/no-floating-promises */

import { isMainThread, Worker } from 'node:worker_threads'
import t from 'tap'
import { cronometro, Result, TestFunction } from '../src/index.js'

if (!isMainThread) {
  cronometro(
    {
      single() {
        Buffer.alloc(10)
      },
      multiple() {
        throw new Error('INVALID')
      },
      missing: undefined as unknown as TestFunction
    },
    () => false
  )
} else {
  t.test('Callbacks', async t => {
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
        }
      },
      {
        iterations: 10,
        print: false,
        onTestStart(name: string, data: any, worker: Worker) {
          t.match(name, /single|multiple|missing/)
          t.ok(data.index < 3)
          t.ok(worker instanceof Worker)
        },
        onTestEnd(name: string, result: Result, worker: Worker) {
          if (result.success) {
            t.same(name, 'single')
            t.ok(result.size > 0)
          } else {
            t.same(name, 'multiple')
            t.same(result.error!.message, 'INVALID')
          }
          t.ok(worker instanceof Worker)
        },
        onTestError(name: string, error: Error, worker: Worker) {
          t.same(name, 'missing')
          t.same(error.message, "Cannot read properties of undefined (reading 'test')")
          t.ok(worker instanceof Worker)
        }
      }
    )
  })
}
