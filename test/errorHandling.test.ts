/* eslint-disable @typescript-eslint/no-floating-promises */

import { isMainThread } from 'node:worker_threads'
import t from 'tap'
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
  t.test('Errored tests handling', async t => {
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

    t.strictSame(Object.keys(results), ['single', 'multiple'])

    t.ok(results.single.success)
    t.type(results.single.error, 'undefined')
    t.equal(results.single.size, 10)
    t.type(results.single.min, 'number')
    t.type(results.single.max, 'number')
    t.type(results.single.mean, 'number')
    t.type(results.single.stddev, 'number')
    t.type(results.single.standardError, 'number')

    for (const percentile of percentiles) {
      t.type(results.single.percentiles[percentile.toString()], 'number')
    }

    t.notOk(results.multiple.success)
    t.type(results.multiple.error, Error)
    t.equal(results.multiple.error!.message, 'FAILED')
    t.equal(results.multiple.size, 0)
    t.equal(results.multiple.min, 0)
    t.equal(results.multiple.max, 0)
    t.equal(results.multiple.mean, 0)
    t.equal(results.multiple.stddev, 0)
    t.equal(results.multiple.standardError, 0)
    t.strictSame(results.multiple.percentiles, {})
  })

  t.test('Runner cannot be run in main thread', async t => {
    await t.rejects(import('../src/runner.js'), { message: 'Do not run this file as main script.' })
  })

  t.test('Runner reports setup errors', async t => {
    const results = await cronometro(
      {
        notDefined() {
          Buffer.alloc(10)
        }
      },
      { iterations: 10, print: false }
    )

    t.strictSame(Object.keys(results), ['notDefined'])
  })
}
