// @ts-ignore
import t from 'tap'
import { isMainThread } from 'worker_threads'
import { cronometro, percentiles } from '../src'

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
  t.test('Collecting results', async (t: any) => {
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

    t.strictDeepEqual(Object.keys(results), ['single', 'multiple'])

    for (const entry of Object.values(results)) {
      t.true(entry.success)
      t.type(entry.error, 'undefined')
      t.equal(entry.size, 10)
      t.type(entry.min, 'number')
      t.type(entry.max, 'number')
      t.type(entry.mean, 'number')
      t.type(entry.stddev, 'number')
      t.type(entry.standardError, 'number')

      for (const percentile of percentiles) {
        t.type(entry.percentiles[percentile.toString()], 'number')
      }
    }
  })
}
