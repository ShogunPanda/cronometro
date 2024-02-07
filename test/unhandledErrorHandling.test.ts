import { deepStrictEqual, ifError, ok } from 'node:assert'
import { test } from 'node:test'
import { isMainThread } from 'node:worker_threads'
import { cronometro, percentiles, type Callback } from '../src/index.js'

if (!isMainThread) {
  cronometro(
    {
      single() {
        Buffer.alloc(10)
      },
      multiple(_done: Callback) {
        Buffer.alloc(10)

        if (process.argv.length > 0) {
          throw new Error('FAILED')
        }
      }
    },
    () => false
  )
} else {
  await test('Unhandled errored tests handling', async () => {
    const results = await cronometro(
      {
        single() {
          Buffer.alloc(10)
        },
        multiple(_done: Callback) {
          Buffer.alloc(10)

          if (process.argv.length > 0) {
            throw new Error('FAILED')
          }
        }
      },
      { iterations: 10, print: false }
    )

    deepStrictEqual(Object.keys(results), ['single', 'multiple'])

    ok(results.single.success)
    ifError(results.single.error, 'undefined')
    deepStrictEqual(results.single.size, 10)
    ok(typeof results.single.min, 'number')
    ok(typeof results.single.max, 'number')
    ok(typeof results.single.mean, 'number')
    ok(typeof results.single.stddev, 'number')
    ok(typeof results.single.standardError, 'number')

    for (const percentile of percentiles) {
      ok(typeof results.single.percentiles[percentile.toString()], 'number')
    }

    ok(!results.multiple.success)
    ok(results.multiple.error instanceof Error)
    deepStrictEqual(results.multiple.error.message, 'FAILED')
    deepStrictEqual(results.multiple.size, 0)
    deepStrictEqual(results.multiple.min, 0)
    deepStrictEqual(results.multiple.max, 0)
    deepStrictEqual(results.multiple.mean, 0)
    deepStrictEqual(results.multiple.stddev, 0)
    deepStrictEqual(results.multiple.standardError, 0)
    deepStrictEqual(results.multiple.percentiles, {})
  })
}
