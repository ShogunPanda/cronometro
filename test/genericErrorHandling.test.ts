import { deepStrictEqual, ok } from 'node:assert'
import { test } from 'node:test'
import { isMainThread } from 'node:worker_threads'
import { cronometro, type Tests } from '../src/index.ts'

if (!isMainThread) {
  cronometro(undefined as unknown as Tests, () => false)
} else {
  await test('Generic error handling', async () => {
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

    ok(!results.single.success)
    ok(results.single.error instanceof Error)
    deepStrictEqual(results.single.error.message, 'Cannot convert undefined or null to object')

    ok(!results.single.success)
    ok(results.single.error instanceof Error)
    deepStrictEqual(results.single.error.message, 'Cannot convert undefined or null to object')
  })
}
