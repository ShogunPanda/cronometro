import { deepStrictEqual, ifError, ok } from 'node:assert'
import { test } from 'node:test'
import { isMainThread } from 'node:worker_threads'
import { cronometro, type SetupFunctionCallback } from '../src/index.ts'

if (!isMainThread) {
  cronometro(
    {
      first: {
        before(cb: SetupFunctionCallback) {
          cb()
        },
        test() {
          Buffer.alloc(20)
        },
        after(cb: SetupFunctionCallback) {
          cb()
        }
      },
      second: {
        // eslint-disable-next-line @typescript-eslint/require-await
        async before() {
          throw new Error('FAILED ON BEFORE')
        },
        test() {
          Buffer.alloc(20)
        }
      },
      third: {
        test() {
          Buffer.alloc(20)
        },
        after(cb: SetupFunctionCallback) {
          cb(new Error('FAILED ON AFTER'))
        }
      }
    },
    () => false
  )
} else {
  test('Lifecycle Callbacks', async () => {
    const results = await cronometro(
      {
        first: {
          before(cb: SetupFunctionCallback) {
            cb()
          },
          test() {
            Buffer.alloc(20)
          },
          after(cb: SetupFunctionCallback) {
            cb()
          }
        },
        second: {
          // eslint-disable-next-line @typescript-eslint/require-await
          async before() {
            throw new Error('FAILED ON BEFORE')
          },
          test() {
            Buffer.alloc(20)
          }
        },
        third: {
          test() {
            Buffer.alloc(20)
          },
          after(cb: SetupFunctionCallback) {
            cb(new Error('FAILED ON AFTER'))
          }
        }
      },
      {
        iterations: 10,
        print: false
      }
    )

    ifError(results.first.error)
    ok(results.second.error instanceof Error)
    deepStrictEqual(results.second.error.message, 'FAILED ON BEFORE')

    ok(results.third.error instanceof Error)
    deepStrictEqual(results.third.error.message, 'FAILED ON AFTER')
  })
}
