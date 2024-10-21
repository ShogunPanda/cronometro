import { deepStrictEqual, ifError, ok, rejects } from 'node:assert'
import { test } from 'node:test'
import { isMainThread } from 'node:worker_threads'
import { cronometro, percentiles } from '../src/index.js'

if (!isMainThread) {
  cronometro(
    {
      single() {
        Buffer.alloc(10)
      },
      multiple() {
        throw new Error('FAILED')
      }
    },
    () => false
  )
} else {
  test('Errored tests handling', async () => {
    const results = await cronometro(
      {
        single() {
          Buffer.alloc(10)
        },
        multiple() {
          throw new Error('FAILED')
        }
      },
      { iterations: 10, print: false }
    )

    deepStrictEqual(Object.keys(results), ['single', 'multiple'])

    ok(results.single.success)
    ifError(results.single.error)
    deepStrictEqual(results.single.size, 10)
    deepStrictEqual(typeof results.single.min, 'number')
    deepStrictEqual(typeof results.single.max, 'number')
    deepStrictEqual(typeof results.single.mean, 'number')
    deepStrictEqual(typeof results.single.stddev, 'number')
    deepStrictEqual(typeof results.single.standardError, 'number')

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

  test('Runner cannot be run in main thread', async () => {
    await rejects(import('../src/runner.js'), { message: 'Do not run this file as main script.' })
  })

  test('Runner reports setup errors', async () => {
    const results = await cronometro(
      {
        notDefined() {
          Buffer.alloc(10)
        }
      },
      { iterations: 10, print: false }
    )

    deepStrictEqual(Object.keys(results), ['notDefined'])
  })
}
