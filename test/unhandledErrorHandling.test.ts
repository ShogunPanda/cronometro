/* eslint-disable @typescript-eslint/no-floating-promises */

import t from 'tap'
import { isMainThread } from 'worker_threads'
import { Callback, cronometro, percentiles } from '../src'

type Test = typeof t

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
  t.setTimeout(120000)

  t.test('Unhandled errored tests handling', async (t: Test) => {
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

    t.strictDeepEqual(Object.keys(results), ['single', 'multiple'])

    t.true(results.single.success)
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

    t.false(results.multiple.success)
    t.type(results.multiple.error, Error)
    t.equal(results.multiple.error!.message, 'FAILED')
    t.equal(results.multiple.size, 0)
    t.equal(results.multiple.min, 0)
    t.equal(results.multiple.max, 0)
    t.equal(results.multiple.mean, 0)
    t.equal(results.multiple.stddev, 0)
    t.equal(results.multiple.standardError, 0)
    t.strictDeepEqual(results.multiple.percentiles, {})
  })
}
