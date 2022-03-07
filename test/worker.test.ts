/* eslint-disable @typescript-eslint/no-floating-promises */
import sinon from 'sinon'
import t from 'tap'
import { percentiles, Test } from '../src/index.js'
import { runWorker } from '../src/worker.js'

const { spy, stub } = sinon

t.test('Worker execution - Handle sync functions that succeed', t => {
  const main = stub()
  const notifier = spy()

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
      t.ok(main.called)

      const result = notifier.getCall(0).args[0]

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
  const main = stub().throws(new Error('FAILED'))
  const notifier = spy()

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
      t.ok(main.called)

      const result = notifier.getCall(0).args[0]

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
  // eslint-disable-next-line unicorn/consistent-function-scoping
  function main(cb: (err?: Error) => void): void {
    cb()
  }

  const mainSpy = spy(main)
  const notifier = spy()

  runWorker(
    {
      path: 'fs',
      tests: [['main', mainSpy as Test]],

      index: 0,
      iterations: 10_000,
      warmup: false,
      errorThreshold: 1e-9
    },
    notifier,
    code => {
      t.equal(code, 0)
      t.ok(mainSpy.called)

      const result = notifier.getCall(0).args[0]

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
  // eslint-disable-next-line unicorn/consistent-function-scoping
  function main(cb: (err?: Error) => void): void {
    cb(new Error('FAILED'))
  }

  const mainSpy = spy(main)
  const notifier = spy()

  runWorker(
    {
      path: 'fs',
      tests: [['main', mainSpy as Test]],

      index: 0,
      iterations: 5,
      warmup: false,
      errorThreshold: 0
    },
    notifier,
    code => {
      t.equal(code, 1)
      t.ok(mainSpy.called)

      const result = notifier.getCall(0).args[0]

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
  const main = stub().resolves()
  const notifier = spy()

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
      t.ok(main.called)

      const result = notifier.getCall(0).args[0]

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
  const main = stub().rejects(new Error('FAILED'))
  const notifier = spy()

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
      t.ok(main.called)

      const result = notifier.getCall(0).args[0]

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
  const main = stub()
  const notifier = spy()

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
      t.equal(main.callCount, 10)
      t.equal(notifier.callCount, 1)

      const result = notifier.getCall(0).args[0]

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
  const main = stub()
  const notifier = spy()

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
      t.equal(main.callCount, 5)
      t.equal(notifier.callCount, 1)

      const result = notifier.getCall(0).args[0]

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
  const main = stub()
  const setup = spy()
  const notifier = spy()

  runWorker(
    {
      path: 'fs',
      tests: [
        [
          'main',
          {
            test: main,
            before(cb: (err?: Error | null) => void): void {
              setup()
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
      t.equal(setup.callCount, 1)
      t.ok(main.called)
      t.equal(notifier.callCount, 1)

      const result = notifier.getCall(0).args[0]

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
  const main = stub()
  const notifier = spy()

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
      t.notOk(main.called)

      const result = notifier.getCall(0).args[0]

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
  const main = stub()
  const setup = spy()
  const notifier = spy()

  runWorker(
    {
      path: 'fs',
      tests: [
        [
          'main',
          {
            test: main,
            before() {
              setup()
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
      t.equal(setup.callCount, 1)
      t.ok(main.called)
      t.equal(notifier.callCount, 1)

      const result = notifier.getCall(0).args[0]

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
  const main = stub()
  const notifier = spy()

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
      t.notOk(main.called)

      const result = notifier.getCall(0).args[0]

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
  const main = stub()
  const setup = spy()
  const notifier = spy()

  runWorker(
    {
      path: 'fs',
      tests: [
        [
          'main',
          {
            test: main,
            after(cb: (err?: Error | null) => void): void {
              setup()
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
      t.equal(setup.callCount, 1)
      t.ok(main.called)
      t.equal(notifier.callCount, 1)

      const result = notifier.getCall(0).args[0]

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
  const main = stub()
  const notifier = spy()

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
      t.ok(main.called)

      const result = notifier.getCall(0).args[0]

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
  const main = stub()
  const setup = spy()
  const notifier = spy()

  runWorker(
    {
      path: 'fs',
      tests: [
        [
          'main',
          {
            test: main,
            after() {
              setup()
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
      t.equal(setup.callCount, 1)
      t.ok(main.called)
      t.equal(notifier.callCount, 1)

      const result = notifier.getCall(0).args[0]

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
  const main = stub()
  const notifier = spy()

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
      t.ok(main.called)

      const result = notifier.getCall(0).args[0]

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
  const notifier = spy()

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

      const result = notifier.getCall(0).args[0]

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
