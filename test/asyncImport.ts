/* eslint-disable @typescript-eslint/no-floating-promises */

import t from 'tap'
import { isMainThread } from 'worker_threads'
import { cronometro, percentiles } from '../src'

type Test = typeof t

async function main(): Promise<void> {
  await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 100))

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
    t.only('Collecting results', async (t: Test) => {
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

      t.strictSame(Object.keys(results), ['single', 'multiple'])

      for (const entry of Object.values(results)) {
        t.ok(entry.success)
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
}

main()

export default main