import { spy, stub } from 'sinon'
// @ts-ignore
import t from 'tap'
import { percentiles, Test } from '../src'
import { runWorker } from '../src/worker'

t.test('Worker execution - Handle sync functions that succeed', (t: any) => {
  const main = stub()
  const notifier = spy()

  runWorker(
    {
      path: 'fs',
      tests: [['main', main]],
      index: 0,
      iterations: 10000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    (code: number) => {
      t.equal(code, 0)
      t.true(main.called)

      const result = notifier.getCall(0).args[0]

      t.true(result.success)
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

t.test('Worker execution - Handle sync functions that throw errors', (t: any) => {
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
    (code: number) => {
      t.equal(code, 1)
      t.true(main.called)

      const result = notifier.getCall(0).args[0]

      t.false(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictDeepEqual(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker execution - Handle callback functions that succeed', (t: any) => {
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
      iterations: 10000,
      warmup: false,
      errorThreshold: 1e-9
    },
    notifier,
    (code: number) => {
      t.equal(code, 0)
      t.true(mainSpy.called)

      const result = notifier.getCall(0).args[0]

      t.true(result.success)
      t.type(result.error, 'undefined')
      t.equal(result.size, 10000)
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

t.test('Worker execution - Handle callback functions that throw errors', (t: any) => {
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
    (code: number) => {
      t.equal(code, 1)
      t.true(mainSpy.called)

      const result = notifier.getCall(0).args[0]

      t.false(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictDeepEqual(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker execution - Handle promise functions that resolve', (t: any) => {
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
    (code: number) => {
      t.equal(code, 0)
      t.true(main.called)

      const result = notifier.getCall(0).args[0]

      t.true(result.success)
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

t.test('Worker execution - Handle promise functions that reject', (t: any) => {
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
    (code: number) => {
      t.equal(code, 1)
      t.true(main.called)

      const result = notifier.getCall(0).args[0]

      t.false(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictDeepEqual(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker execution - Handle warmup mode enabled', (t: any) => {
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
    (code: number) => {
      t.equal(code, 0)
      t.equal(main.callCount, 10)
      t.equal(notifier.callCount, 1)

      const result = notifier.getCall(0).args[0]

      t.true(result.success)
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

t.test('Worker execution - Handle warmup mode disabled', (t: any) => {
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
    (code: number) => {
      t.equal(code, 0)
      t.equal(main.callCount, 5)
      t.equal(notifier.callCount, 1)

      const result = notifier.getCall(0).args[0]

      t.true(result.success)
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

t.test('Worker setup - Handle callback before functions', (t: any) => {
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
      iterations: 10000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    (code: number) => {
      t.equal(code, 0)
      t.equal(setup.callCount, 1)
      t.true(main.called)
      t.equal(notifier.callCount, 1)

      const result = notifier.getCall(0).args[0]

      t.true(result.success)
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

t.test('Worker setup - Handle callback before functions that throw errors', (t: any) => {
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
      iterations: 10000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    (code: number) => {
      t.equal(code, 1)
      t.false(main.called)

      const result = notifier.getCall(0).args[0]

      t.false(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictDeepEqual(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker setup - Handle promise before functions that resolve', (t: any) => {
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
            async before(): Promise<void> {
              setup()
            }
          }
        ]
      ],
      index: 0,
      iterations: 10000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    (code: number) => {
      t.equal(code, 0)
      t.equal(setup.callCount, 1)
      t.true(main.called)
      t.equal(notifier.callCount, 1)

      const result = notifier.getCall(0).args[0]

      t.true(result.success)
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

t.test('Worker setup - Handle promise before functions that reject', (t: any) => {
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
            async before(): Promise<void> {
              throw new Error('FAILED')
            }
          }
        ]
      ],
      index: 0,
      iterations: 10000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    (code: number) => {
      t.equal(code, 1)
      t.false(main.called)

      const result = notifier.getCall(0).args[0]

      t.false(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictDeepEqual(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker setup - Handle callback after functions', (t: any) => {
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
      iterations: 10000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    (code: number) => {
      t.equal(code, 0)
      t.equal(setup.callCount, 1)
      t.true(main.called)
      t.equal(notifier.callCount, 1)

      const result = notifier.getCall(0).args[0]

      t.true(result.success)
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

t.test('Worker setup - Handle callback after functions that throw errors', (t: any) => {
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
      iterations: 10000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    (code: number) => {
      t.equal(code, 1)
      t.true(main.called)

      const result = notifier.getCall(0).args[0]

      t.false(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictDeepEqual(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker setup - Handle promise after functions that resolve', (t: any) => {
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
            async after(): Promise<void> {
              setup()
            }
          }
        ]
      ],
      index: 0,
      iterations: 10000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    (code: number) => {
      t.equal(code, 0)
      t.equal(setup.callCount, 1)
      t.true(main.called)
      t.equal(notifier.callCount, 1)

      const result = notifier.getCall(0).args[0]

      t.true(result.success)
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

t.test('Worker setup - Handle promise after functions that reject', (t: any) => {
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
            async after(): Promise<void> {
              throw new Error('FAILED')
            }
          }
        ]
      ],
      index: 0,
      iterations: 10000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    (code: number) => {
      t.equal(code, 1)
      t.true(main.called)

      const result = notifier.getCall(0).args[0]

      t.false(result.success)
      t.type(result.error, Error)
      t.equal(result.error!.message, 'FAILED')
      t.equal(result.size, 0)
      t.equal(result.min, 0)
      t.equal(result.max, 0)
      t.equal(result.mean, 0)
      t.equal(result.stddev, 0)
      t.equal(result.standardError, 0)
      t.strictDeepEqual(result.percentiles, {})

      t.end()
    }
  )
})

t.test('Worker execution - Handle empty tets', (t: any) => {
  const notifier = spy()

  runWorker(
    {
      path: 'fs',
      tests: [['main', {}]],
      index: 0,
      iterations: 10000,
      warmup: false,
      errorThreshold: 100
    },
    notifier,
    (code: number) => {
      t.equal(code, 0)

      const result = notifier.getCall(0).args[0]

      t.true(result.success)
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
