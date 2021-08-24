/* eslint-disable @typescript-eslint/no-floating-promises */

import t from 'tap'
import { isMainThread } from 'worker_threads'
import { cronometro } from '../src'

type Test = typeof t

if (!isMainThread) {
  cronometro(undefined as any, () => false)
} else {
  t.test('Generic error handling', async (t: Test) => {
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

    t.notOk(results.single.success)
    t.type(results.single.error, Error)
    t.equal(results.single.error!.message, 'Cannot convert undefined or null to object')

    t.notOk(results.single.success)
    t.type(results.single.error, Error)
    t.equal(results.single.error!.message, 'Cannot convert undefined or null to object')
  })
}
