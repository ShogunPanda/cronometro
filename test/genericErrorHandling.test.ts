/* eslint-disable @typescript-eslint/no-floating-promises */

import { isMainThread } from 'node:worker_threads'
import t from 'tap'
import { cronometro, type Tests } from '../src/index.js'

if (!isMainThread) {
  cronometro(undefined as unknown as Tests, () => false)
} else {
  t.test('Generic error handling', async t => {
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
