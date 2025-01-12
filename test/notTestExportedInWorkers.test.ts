import { deepStrictEqual, ok } from 'node:assert'
import { test } from 'node:test'
import { isMainThread } from 'node:worker_threads'
import { cronometro } from '../src/index.js'

if (isMainThread) {
  test('Errors are properly handled when no tests are exported in the worker threads', async () => {
    const results = await cronometro(
      {
        single() {},
        multiple() {}
      },
      { iterations: 10, print: false }
    )

    ok(!results.single.success)
    ok(results.single.error instanceof Error)
    deepStrictEqual(results.single.error.message, 'No test code exported from the worker thread')
    deepStrictEqual(results.single.size, 0)
    deepStrictEqual(results.single.min, 0)
    deepStrictEqual(results.single.max, 0)
    deepStrictEqual(results.single.mean, 0)
    deepStrictEqual(results.single.stddev, 0)
    deepStrictEqual(results.single.standardError, 0)
    deepStrictEqual(results.single.percentiles, {})

    ok(!results.multiple.success)
    ok(results.multiple.error instanceof Error)
    deepStrictEqual(results.multiple.error.message, 'No test code exported from the worker thread')
    deepStrictEqual(results.multiple.size, 0)
    deepStrictEqual(results.multiple.min, 0)
    deepStrictEqual(results.multiple.max, 0)
    deepStrictEqual(results.multiple.mean, 0)
    deepStrictEqual(results.multiple.stddev, 0)
    deepStrictEqual(results.multiple.standardError, 0)
    deepStrictEqual(results.multiple.percentiles, {})
  })
}
