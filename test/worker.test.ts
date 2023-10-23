/* eslint-disable @typescript-eslint/no-floating-promises */
import t from 'tap'
import { percentiles, type AsyncTest, type Result } from '../src/index.js'
import { runWorker } from '../src/worker.js'

t.test('Worker execution - Handle sync functions that succeed', t => {
  let mainCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 0)
      t.ok(mainCalls > 0)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.ok(result.success)
      t.type(result.error, 'undefined')
      t.equal(result.size, 1000)
      t.type(result.min, 'number')
      t.type(result.max, 'number')
      t.type(result.mean, 'number')
      t.type(result.stddev, 'number')
      t.type(result.standardError, 'number')

      for (const percentile of percentiles) {
        t.type(result.percentiles[percentile.toString()], 'number')
      }

      t.end()
    }
  )
})

t.test('Worker execution - Handle sync functions that throw errors', t => {
  let mainCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 1)
      t.ok(mainCalls > 0)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.notOk(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictSame(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker execution - Handle callback functions that succeed', t => {
  let mainCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 0)
      t.ok(mainCalls > 0)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.ok(result.success)
      t.type(result.error, 'undefined')
      t.equal(result.size, 10_000)
      t.type(result.min, 'number')
      t.type(result.max, 'number')
      t.type(result.mean, 'number')
      t.type(result.stddev, 'number')
      t.type(result.standardError, 'number')

      for (const percentile of percentiles) {
        t.type(result.percentiles[percentile.toString()], 'number')
      }

      t.end()
    }
  )
})

t.test('Worker execution - Handle callback functions that throw errors', t => {
  let mainCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 1)
      t.ok(mainCalls > 0)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.notOk(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictSame(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker execution - Handle promise functions that resolve', t => {
  let mainCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 0)
      t.ok(mainCalls > 0)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.ok(result.success)
      t.type(result.error, 'undefined')
      t.equal(result.size, 5)
      t.type(result.min, 'number')
      t.type(result.max, 'number')
      t.type(result.mean, 'number')
      t.type(result.stddev, 'number')
      t.type(result.standardError, 'number')

      for (const percentile of percentiles) {
        t.type(result.percentiles[percentile.toString()], 'number')
      }

      t.end()
    }
  )
})

t.test('Worker execution - Handle promise functions that reject', t => {
  let mainCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 1)
      t.ok(mainCalls > 0)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.notOk(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictSame(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker execution - Handle warmup mode enabled', t => {
  let mainCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 0)
      t.equal(mainCalls, 10)
      t.equal(notifier.calls.length, 1)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.ok(result.success)
      t.type(result.error, 'undefined')
      t.equal(result.size, 5)
      t.type(result.min, 'number')
      t.type(result.max, 'number')
      t.type(result.mean, 'number')
      t.type(result.stddev, 'number')
      t.type(result.standardError, 'number')

      for (const percentile of percentiles) {
        t.type(result.percentiles[percentile.toString()], 'number')
      }

      t.end()
    }
  )
})

t.test('Worker execution - Handle warmup mode disabled', t => {
  let mainCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 0)
      t.equal(mainCalls, 5)
      t.equal(notifier.calls.length, 1)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.ok(result.success)
      t.type(result.error, 'undefined')
      t.equal(result.size, 5)
      t.type(result.min, 'number')
      t.type(result.max, 'number')
      t.type(result.mean, 'number')
      t.type(result.stddev, 'number')
      t.type(result.standardError, 'number')

      for (const percentile of percentiles) {
        t.type(result.percentiles[percentile.toString()], 'number')
      }

      t.end()
    }
  )
})

t.test('Worker setup - Handle callback before functions', t => {
  let mainCalls = 0
  let setupCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 0)
      t.equal(setupCalls, 1)
      t.ok(mainCalls > 0)
      t.equal(notifier.calls.length, 1)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.ok(result.success)
      t.type(result.error, 'undefined')
      t.equal(result.size, 1000)
      t.type(result.min, 'number')
      t.type(result.max, 'number')
      t.type(result.mean, 'number')
      t.type(result.stddev, 'number')
      t.type(result.standardError, 'number')

      for (const percentile of percentiles) {
        t.type(result.percentiles[percentile.toString()], 'number')
      }

      t.end()
    }
  )
})

t.test('Worker setup - Handle callback before functions that throw errors', t => {
  let mainCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 1)
      t.notOk(mainCalls)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.notOk(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictSame(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker setup - Handle promise before functions that resolve', t => {
  let mainCalls = 0
  let setupCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 0)
      t.equal(setupCalls, 1)
      t.ok(mainCalls > 0)
      t.equal(notifier.calls.length, 1)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.ok(result.success)
      t.type(result.error, 'undefined')
      t.equal(result.size, 1000)
      t.type(result.min, 'number')
      t.type(result.max, 'number')
      t.type(result.mean, 'number')
      t.type(result.stddev, 'number')
      t.type(result.standardError, 'number')

      for (const percentile of percentiles) {
        t.type(result.percentiles[percentile.toString()], 'number')
      }

      t.end()
    }
  )
})

t.test('Worker setup - Handle promise before functions that reject', t => {
  let mainCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 1)
      t.notOk(mainCalls)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.notOk(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictSame(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker setup - Handle callback after functions', t => {
  let mainCalls = 0
  let setupCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 0)
      t.equal(setupCalls, 1)
      t.ok(mainCalls > 0)
      t.equal(notifier.calls.length, 1)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.ok(result.success)
      t.type(result.error, 'undefined')
      t.equal(result.size, 1000)
      t.type(result.min, 'number')
      t.type(result.max, 'number')
      t.type(result.mean, 'number')
      t.type(result.stddev, 'number')
      t.type(result.standardError, 'number')

      for (const percentile of percentiles) {
        t.type(result.percentiles[percentile.toString()], 'number')
      }

      t.end()
    }
  )
})

t.test('Worker setup - Handle callback after functions that throw errors', t => {
  let mainCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 1)
      t.ok(mainCalls > 0)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.notOk(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictSame(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker setup - Handle promise after functions that resolve', t => {
  let mainCalls = 0
  let setupCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 0)
      t.equal(setupCalls, 1)
      t.ok(mainCalls > 0)
      t.equal(notifier.calls.length, 1)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.ok(result.success)
      t.type(result.error, 'undefined')
      t.equal(result.size, 1000)
      t.type(result.min, 'number')
      t.type(result.max, 'number')
      t.type(result.mean, 'number')
      t.type(result.stddev, 'number')
      t.type(result.standardError, 'number')

      for (const percentile of percentiles) {
        t.type(result.percentiles[percentile.toString()], 'number')
      }

      t.end()
    }
  )
})

t.test('Worker setup - Handle promise after functions that reject', t => {
  let mainCalls = 0
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 1)
      t.ok(mainCalls > 0)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.notOk(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictSame(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker execution - Handle empty tests', t => {
  const notifier = t.captureFn(() => {})

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
      t.equal(code, 0)

      const result = notifier.calls[0].args[0 as number]! as Result

      t.ok(result.success)
      t.type(result.error, 'undefined')
      t.equal(result.size, 1000)
      t.type(result.min, 'number')
      t.type(result.max, 'number')
      t.type(result.mean, 'number')
      t.type(result.stddev, 'number')
      t.type(result.standardError, 'number')

      for (const percentile of percentiles) {
        t.type(result.percentiles[percentile.toString()], 'number')
      }

      t.end()
    }
  )
})
