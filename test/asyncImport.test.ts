import { deepStrictEqual, ifError, ok } from 'node:assert'
import { test } from 'node:test'
import { isMainThread } from 'node:worker_threads'
import { cronometro, percentiles } from '../src/index.js'

await new Promise(resolve => setTimeout(resolve, 100))

if (!isMainThread) {
  cronometro(
    {
      single() {
        Buffer.alloc(10)
      },
      multiple() {
        Buffer.alloc(10)
        Buffer.alloc(20)
      }
    },
    () => false
  )
} else {
  await test('Collecting results', async () => {
    const results = await cronometro(
      {
        single() {
          Buffer.alloc(10)
        },
        multiple() {
          Buffer.alloc(10)
          Buffer.alloc(20)
        }
      },
      { iterations: 10, print: false }
    )

    deepStrictEqual(Object.keys(results), ['single', 'multiple'])

    for (const entry of Object.values(results)) {
      ok(entry.success)
      ifError(entry.error)
      deepStrictEqual(entry.size, 10)
      deepStrictEqual(typeof entry.min, 'number')
      deepStrictEqual(typeof entry.max, 'number')
      deepStrictEqual(typeof entry.mean, 'number')
      deepStrictEqual(typeof entry.stddev, 'number')
      deepStrictEqual(typeof entry.standardError, 'number')

      for (const percentile of percentiles) {
        ok(typeof entry.percentiles[percentile.toString()], 'number')
      }
    }
  })
}
