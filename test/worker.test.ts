import { deepStrictEqual, ifError, ok } from 'node:assert'
import { test } from 'node:test'
import { percentiles, type AsyncTest, type Result } from '../src/index.js'
import { runWorker } from '../src/worker.js'

test('Worker execution - Handle sync functions that succeed', (t, done) => {
  let mainCalls = 0
  const notifier = t.mock.fn()

  function main(): void {
    mainCalls++
  }

  runWorker(
    {
      path: 'fs',
      tests: [['main', main]],
      index: 0,
      iterations: 10_000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    code => {
      deepStrictEqual(code, 0)
      ok(mainCalls > 0)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(result.success)
      ifError(result.error)
      deepStrictEqual(result.size, 1000)
      ok(typeof result.min, 'number')
      ok(typeof result.max, 'number')
      ok(typeof result.mean, 'number')
      ok(typeof result.stddev, 'number')
      ok(typeof result.standardError, 'number')

      for (const percentile of percentiles) {
        ok(typeof result.percentiles[percentile.toString()], 'number')
      }

      done()
    }
  )
})

test('Worker execution - Handle sync functions that throw errors', (t, done) => {
  let mainCalls = 0
  const notifier = t.mock.fn()

  /* eslint-disable-next-line @typescript-eslint/require-await */
  async function main(): Promise<void> {
    mainCalls++
    throw new Error('FAILED')
  }

  runWorker(
    {
      path: 'fs',
      tests: [['main', main]],
      index: 0,
      iterations: 5,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    code => {
      deepStrictEqual(code, 1)
      ok(mainCalls > 0)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(!result.success)
      ok(result.error instanceof Error)
      deepStrictEqual(result.error.message, 'FAILED')
      deepStrictEqual(result.size, 0)
      deepStrictEqual(result.min, 0)
      deepStrictEqual(result.max, 0)
      deepStrictEqual(result.mean, 0)
      deepStrictEqual(result.stddev, 0)
      deepStrictEqual(result.standardError, 0)
      deepStrictEqual(result.percentiles, {})

      done()
    }
  )
})

test('Worker execution - Handle callback functions that succeed', (t, done) => {
  let mainCalls = 0
  const notifier = t.mock.fn()

  function main(cb: (err?: Error) => void): void {
    mainCalls++
    cb()
  }

  runWorker(
    {
      path: 'fs',
      tests: [['main', main as AsyncTest]],

      index: 0,
      iterations: 10_000,
      warmup: false,
      errorThreshold: 1e-9
    },
    notifier,
    code => {
      deepStrictEqual(code, 0)
      ok(mainCalls > 0)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(result.success)
      ifError(result.error)
      deepStrictEqual(result.size, 10_000)
      ok(typeof result.min, 'number')
      ok(typeof result.max, 'number')
      ok(typeof result.mean, 'number')
      ok(typeof result.stddev, 'number')
      ok(typeof result.standardError, 'number')

      for (const percentile of percentiles) {
        ok(typeof result.percentiles[percentile.toString()], 'number')
      }

      done()
    }
  )
})

test('Worker execution - Handle callback functions that throw errors', (t, done) => {
  let mainCalls = 0
  const notifier = t.mock.fn()

  function main(cb: (err?: Error) => void): void {
    mainCalls++
    cb(new Error('FAILED'))
  }

  runWorker(
    {
      path: 'fs',
      tests: [['main', main as AsyncTest]],

      index: 0,
      iterations: 5,
      warmup: false,
      errorThreshold: 0
    },
    notifier,
    code => {
      deepStrictEqual(code, 1)
      ok(mainCalls > 0)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(!result.success)
      ok(result.error instanceof Error)
      deepStrictEqual(result.error.message, 'FAILED')
      deepStrictEqual(result.size, 0)
      deepStrictEqual(result.min, 0)
      deepStrictEqual(result.max, 0)
      deepStrictEqual(result.mean, 0)
      deepStrictEqual(result.stddev, 0)
      deepStrictEqual(result.standardError, 0)
      deepStrictEqual(result.percentiles, {})

      done()
    }
  )
})

test('Worker execution - Handle promise functions that resolve', (t, done) => {
  let mainCalls = 0
  const notifier = t.mock.fn()

  /* eslint-disable-next-line @typescript-eslint/require-await */
  async function main(): Promise<void> {
    mainCalls++
  }

  runWorker(
    {
      path: 'fs',
      tests: [['main', main]],

      index: 0,
      iterations: 5,
      warmup: false,
      errorThreshold: 0
    },
    notifier,
    code => {
      deepStrictEqual(code, 0)
      ok(mainCalls > 0)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(result.success)
      ifError(result.error)
      deepStrictEqual(result.size, 5)
      ok(typeof result.min, 'number')
      ok(typeof result.max, 'number')
      ok(typeof result.mean, 'number')
      ok(typeof result.stddev, 'number')
      ok(typeof result.standardError, 'number')

      for (const percentile of percentiles) {
        ok(typeof result.percentiles[percentile.toString()], 'number')
      }

      done()
    }
  )
})

test('Worker execution - Handle promise functions that reject', (t, done) => {
  let mainCalls = 0
  const notifier = t.mock.fn()

  /* eslint-disable-next-line @typescript-eslint/require-await */
  async function main(): Promise<void> {
    mainCalls++
    throw new Error('FAILED')
  }

  runWorker(
    {
      path: 'fs',
      tests: [['main', main]],

      index: 0,
      iterations: 5,
      warmup: false,
      errorThreshold: 0
    },
    notifier,
    code => {
      deepStrictEqual(code, 1)
      ok(mainCalls > 0)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(!result.success)
      ok(result.error instanceof Error)
      deepStrictEqual(result.error.message, 'FAILED')
      deepStrictEqual(result.size, 0)
      deepStrictEqual(result.min, 0)
      deepStrictEqual(result.max, 0)
      deepStrictEqual(result.mean, 0)
      deepStrictEqual(result.stddev, 0)
      deepStrictEqual(result.standardError, 0)
      deepStrictEqual(result.percentiles, {})

      done()
    }
  )
})

test('Worker execution - Handle warmup mode enabled', (t, done) => {
  let mainCalls = 0
  const notifier = t.mock.fn()

  function main(): void {
    mainCalls++
  }

  runWorker(
    {
      path: 'fs',
      tests: [['main', main]],

      index: 0,
      iterations: 5,
      warmup: true,
      errorThreshold: 0
    },
    notifier,
    code => {
      deepStrictEqual(code, 0)
      deepStrictEqual(mainCalls, 10)
      deepStrictEqual(notifier.mock.callCount(), 1)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(result.success)
      ifError(result.error)
      deepStrictEqual(result.size, 5)
      ok(typeof result.min, 'number')
      ok(typeof result.max, 'number')
      ok(typeof result.mean, 'number')
      ok(typeof result.stddev, 'number')
      ok(typeof result.standardError, 'number')

      for (const percentile of percentiles) {
        ok(typeof result.percentiles[percentile.toString()], 'number')
      }

      done()
    }
  )
})

test('Worker execution - Handle warmup mode disabled', (t, done) => {
  let mainCalls = 0
  const notifier = t.mock.fn()

  function main(): void {
    mainCalls++
  }

  runWorker(
    {
      path: 'fs',
      tests: [['main', main]],

      index: 0,
      iterations: 5,
      warmup: false,
      errorThreshold: 0
    },
    notifier,
    code => {
      deepStrictEqual(code, 0)
      deepStrictEqual(mainCalls, 5)
      deepStrictEqual(notifier.mock.callCount(), 1)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(result.success)
      ifError(result.error)
      deepStrictEqual(result.size, 5)
      ok(typeof result.min, 'number')
      ok(typeof result.max, 'number')
      ok(typeof result.mean, 'number')
      ok(typeof result.stddev, 'number')
      ok(typeof result.standardError, 'number')

      for (const percentile of percentiles) {
        ok(typeof result.percentiles[percentile.toString()], 'number')
      }

      done()
    }
  )
})

test('Worker setup - Handle callback before functions', (t, done) => {
  let mainCalls = 0
  let setupCalls = 0
  const notifier = t.mock.fn()

  function main(): void {
    mainCalls++
  }

  runWorker(
    {
      path: 'fs',
      tests: [
        [
          'main',
          {
            test: main,
            before(cb: (err?: Error | null) => void): void {
              setupCalls++
              cb()
            }
          }
        ]
      ],
      index: 0,
      iterations: 10_000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    code => {
      deepStrictEqual(code, 0)
      deepStrictEqual(setupCalls, 1)
      ok(mainCalls > 0)
      deepStrictEqual(notifier.mock.callCount(), 1)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(result.success)
      ifError(result.error)
      deepStrictEqual(result.size, 1000)
      ok(typeof result.min, 'number')
      ok(typeof result.max, 'number')
      ok(typeof result.mean, 'number')
      ok(typeof result.stddev, 'number')
      ok(typeof result.standardError, 'number')

      for (const percentile of percentiles) {
        ok(typeof result.percentiles[percentile.toString()], 'number')
      }

      done()
    }
  )
})

test('Worker setup - Handle callback before functions that throw errors', (t, done) => {
  let mainCalls = 0
  const notifier = t.mock.fn()

  function main(): void {
    mainCalls++
  }

  runWorker(
    {
      path: 'fs',
      tests: [
        [
          'main',
          {
            test: main,
            before(cb: (err?: Error | null) => void): void {
              cb(new Error('FAILED'))
            }
          }
        ]
      ],
      index: 0,
      iterations: 10_000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    code => {
      deepStrictEqual(code, 1)
      ok(!mainCalls)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(!result.success)
      ok(result.error instanceof Error)
      deepStrictEqual(result.error.message, 'FAILED')
      deepStrictEqual(result.size, 0)
      deepStrictEqual(result.min, 0)
      deepStrictEqual(result.max, 0)
      deepStrictEqual(result.mean, 0)
      deepStrictEqual(result.stddev, 0)
      deepStrictEqual(result.standardError, 0)
      deepStrictEqual(result.percentiles, {})

      done()
    }
  )
})

test('Worker setup - Handle promise before functions that resolve', (t, done) => {
  let mainCalls = 0
  let setupCalls = 0
  const notifier = t.mock.fn()

  function main(): void {
    mainCalls++
  }

  runWorker(
    {
      path: 'fs',
      tests: [
        [
          'main',
          {
            test: main,
            before() {
              setupCalls++
              return Promise.resolve()
            }
          }
        ]
      ],
      index: 0,
      iterations: 10_000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    code => {
      deepStrictEqual(code, 0)
      deepStrictEqual(setupCalls, 1)
      ok(mainCalls > 0)
      deepStrictEqual(notifier.mock.callCount(), 1)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(result.success)
      ifError(result.error)
      deepStrictEqual(result.size, 1000)
      ok(typeof result.min, 'number')
      ok(typeof result.max, 'number')
      ok(typeof result.mean, 'number')
      ok(typeof result.stddev, 'number')
      ok(typeof result.standardError, 'number')

      for (const percentile of percentiles) {
        ok(typeof result.percentiles[percentile.toString()], 'number')
      }

      done()
    }
  )
})

test('Worker setup - Handle promise before functions that reject', (t, done) => {
  let mainCalls = 0
  const notifier = t.mock.fn()

  function main(): void {
    mainCalls++
  }

  runWorker(
    {
      path: 'fs',
      tests: [
        [
          'main',
          {
            test: main,
            before() {
              return Promise.reject(new Error('FAILED'))
            }
          }
        ]
      ],
      index: 0,
      iterations: 10_000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    code => {
      deepStrictEqual(code, 1)
      ok(!mainCalls)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(!result.success)
      ok(result.error instanceof Error)
      deepStrictEqual(result.error.message, 'FAILED')
      deepStrictEqual(result.size, 0)
      deepStrictEqual(result.min, 0)
      deepStrictEqual(result.max, 0)
      deepStrictEqual(result.mean, 0)
      deepStrictEqual(result.stddev, 0)
      deepStrictEqual(result.standardError, 0)
      deepStrictEqual(result.percentiles, {})

      done()
    }
  )
})

test('Worker setup - Handle callback after functions', (t, done) => {
  let mainCalls = 0
  let setupCalls = 0
  const notifier = t.mock.fn()

  function main(): void {
    mainCalls++
  }

  runWorker(
    {
      path: 'fs',
      tests: [
        [
          'main',
          {
            test: main,
            after(cb: (err?: Error | null) => void): void {
              setupCalls++
              cb()
            }
          }
        ]
      ],
      index: 0,
      iterations: 10_000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    code => {
      deepStrictEqual(code, 0)
      deepStrictEqual(setupCalls, 1)
      ok(mainCalls > 0)
      deepStrictEqual(notifier.mock.callCount(), 1)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(result.success)
      ifError(result.error)
      deepStrictEqual(result.size, 1000)
      ok(typeof result.min, 'number')
      ok(typeof result.max, 'number')
      ok(typeof result.mean, 'number')
      ok(typeof result.stddev, 'number')
      ok(typeof result.standardError, 'number')

      for (const percentile of percentiles) {
        ok(typeof result.percentiles[percentile.toString()], 'number')
      }

      done()
    }
  )
})

test('Worker setup - Handle callback after functions that throw errors', (t, done) => {
  let mainCalls = 0
  const notifier = t.mock.fn()

  function main(): void {
    mainCalls++
  }

  runWorker(
    {
      path: 'fs',
      tests: [
        [
          'main',
          {
            test: main,
            after(cb: (err?: Error | null) => void): void {
              cb(new Error('FAILED'))
            }
          }
        ]
      ],
      index: 0,
      iterations: 10_000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    code => {
      deepStrictEqual(code, 1)
      ok(mainCalls > 0)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(!result.success)
      ok(result.error instanceof Error)
      deepStrictEqual(result.error.message, 'FAILED')
      deepStrictEqual(result.size, 0)
      deepStrictEqual(result.min, 0)
      deepStrictEqual(result.max, 0)
      deepStrictEqual(result.mean, 0)
      deepStrictEqual(result.stddev, 0)
      deepStrictEqual(result.standardError, 0)
      deepStrictEqual(result.percentiles, {})

      done()
    }
  )
})

test('Worker setup - Handle promise after functions that resolve', (t, done) => {
  let mainCalls = 0
  let setupCalls = 0
  const notifier = t.mock.fn()

  function main(): void {
    mainCalls++
  }

  runWorker(
    {
      path: 'fs',
      tests: [
        [
          'main',
          {
            test: main,
            after() {
              setupCalls++
              return Promise.resolve()
            }
          }
        ]
      ],
      index: 0,
      iterations: 10_000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    code => {
      deepStrictEqual(code, 0)
      deepStrictEqual(setupCalls, 1)
      ok(mainCalls > 0)
      deepStrictEqual(notifier.mock.callCount(), 1)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(result.success)
      ifError(result.error)
      deepStrictEqual(result.size, 1000)
      ok(typeof result.min, 'number')
      ok(typeof result.max, 'number')
      ok(typeof result.mean, 'number')
      ok(typeof result.stddev, 'number')
      ok(typeof result.standardError, 'number')

      for (const percentile of percentiles) {
        ok(typeof result.percentiles[percentile.toString()], 'number')
      }

      done()
    }
  )
})

test('Worker setup - Handle promise after functions that reject', (t, done) => {
  let mainCalls = 0
  const notifier = t.mock.fn()

  function main(): void {
    mainCalls++
  }

  runWorker(
    {
      path: 'fs',
      tests: [
        [
          'main',
          {
            test: main,
            after() {
              return Promise.reject(new Error('FAILED'))
            }
          }
        ]
      ],
      index: 0,
      iterations: 10_000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    code => {
      deepStrictEqual(code, 1)
      ok(mainCalls > 0)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(!result.success)
      ok(result.error instanceof Error)
      deepStrictEqual(result.error.message, 'FAILED')
      deepStrictEqual(result.size, 0)
      deepStrictEqual(result.min, 0)
      deepStrictEqual(result.max, 0)
      deepStrictEqual(result.mean, 0)
      deepStrictEqual(result.stddev, 0)
      deepStrictEqual(result.standardError, 0)
      deepStrictEqual(result.percentiles, {})

      done()
    }
  )
})

test('Worker execution - Handle empty tests', (t, done) => {
  const notifier = t.mock.fn()

  runWorker(
    {
      path: 'fs',
      tests: [['main', {}]],
      index: 0,
      iterations: 10_000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    code => {
      deepStrictEqual(code, 0)

      const result = notifier.mock.calls[0].arguments[0] as Result

      ok(result.success)
      ifError(result.error)
      deepStrictEqual(result.size, 1000)
      ok(typeof result.min, 'number')
      ok(typeof result.max, 'number')
      ok(typeof result.mean, 'number')
      ok(typeof result.stddev, 'number')
      ok(typeof result.standardError, 'number')

      for (const percentile of percentiles) {
        ok(typeof result.percentiles[percentile.toString()], 'number')
      }

      done()
    }
  )
})
