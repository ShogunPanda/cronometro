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
      errorThreshold: 100
    },
    notifier,
    (code: number) => {
      t.true(main.called)
      t.equal(code, 0)

      const result = notifier.getCall(0).args[0]

      t.true(result.success)
      t.type(result.error, 'undefined')
      t.equal(result.size, 499)
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
      errorThreshold: 100
    },
    notifier,
    (code: number) => {
      t.true(main.called)
      t.equal(code, 1)

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
      errorThreshold: 1e-9
    },
    notifier,
    (code: number) => {
      t.true(mainSpy.called)
      t.equal(code, 0)

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
      errorThreshold: 0
    },
    notifier,
    (code: number) => {
      t.true(mainSpy.called)
      t.equal(code, 1)

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

t.test('Worker execution - Handle promise functions that resolves', (t: any) => {
  const main = stub().resolves()
  const notifier = spy()

  runWorker(
    {
      path: 'fs',
      tests: [['main', main]],
      index: 0,
      iterations: 5,
      errorThreshold: 0
    },
    notifier,
    (code: number) => {
      t.true(main.called)
      t.equal(code, 0)

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

t.test('Worker execution - Handle promise functions that rejects', (t: any) => {
  const main = stub().rejects(new Error('FAILED'))
  const notifier = spy()

  runWorker(
    {
      path: 'fs',
      tests: [['main', main]],
      index: 0,
      iterations: 5,
      errorThreshold: 0
    },
    notifier,
    (code: number) => {
      t.true(main.called)
      t.equal(code, 1)

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
