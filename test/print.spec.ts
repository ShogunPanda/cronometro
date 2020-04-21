import { SinonSpyCall, spy } from 'sinon'
// @ts-ignore
import t from 'tap'
import { isMainThread } from 'worker_threads'
import { cronometro, defaultOptions, percentiles, Results } from '../src'
import { setLogger } from '../src/print'

function removeStyle(source: string): string {
  // eslint-disable-next-line no-control-regex
  return source.replace(/\x1b\[\d+m/g, '')
}

const loggerSpy = spy()
defaultOptions.iterations = 10
setLogger(loggerSpy)

if (!isMainThread) {
  cronometro(
    {
      single() {
        // No-op
      },
      multiple() {
        // No-op
      },
      error() {
        throw new Error('FAILED')
      }
    },
    () => false
  )
} else {
  t.setTimeout(0)

  t.afterEach((done: () => void) => {
    loggerSpy.resetHistory()
    done()
  })

  t.test('Printing - Default options', (t: any) => {
    cronometro(
      {
        single() {
          // No-op
        },
        multiple() {
          // No-op
        },
        error() {
          throw new Error('FAILED')
        }
      },
      (err: Error | null, results: Results) => {
        t.strictEqual(err, null)
        t.strictDeepEqual(Object.keys(results), ['single', 'multiple', 'error'])

        t.false(results.error.success)
        t.type(results.error.error, Error)
        t.equal(results.error.error!.message, 'FAILED')
        t.equal(results.error.size, 0)
        t.equal(results.error.min, 0)
        t.equal(results.error.max, 0)
        t.equal(results.error.mean, 0)
        t.equal(results.error.stddev, 0)
        t.equal(results.error.standardError, 0)
        t.strictDeepEqual(results.error.percentiles, {})
        delete results.error

        for (const entry of Object.values(results)) {
          t.true(entry.success)
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

        const output = removeStyle(loggerSpy.getCall(0).args[0])
        t.match(output, /║\s+Slower tests\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+║/)
        t.match(output, /║\s+Faster test\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+║/)
        t.match(output, /║\s+(single|multiple)\s+|\s+10\s+|\s+\d+\.\d{2}\sop\/sec\s+|\s+±\s\d+.\d{2}\s%\s+║/)
        t.match(output, /║\s+(error)\s+|\s+0\s+|\s+Errored\s+|\s+N\/A\s+║/)
        t.end()
      }
    )
  })

  t.test('Printing - No colors', (t: any) => {
    cronometro(
      {
        single() {
          // No-op
        },
        multiple() {
          // No-op
        },
        error() {
          throw new Error('FAILED')
        }
      },
      { print: { colors: false } },
      (err: Error | null) => {
        t.strictEqual(err, null)

        const output = loggerSpy.getCall(0).args[0]

        // eslint-disable-next-line no-control-regex
        t.notMatch(output, /\x1b/)

        t.end()
      }
    )
  })

  t.test('Printing - Base compare', (t: any) => {
    cronometro(
      {
        single() {
          // No-op
        },
        multiple() {
          // No-op
        },
        error() {
          throw new Error('FAILED')
        }
      },
      { print: { compare: true } },
      (err: Error | null) => {
        t.strictEqual(err, null)

        const output = removeStyle(loggerSpy.getCall(0).args[0])
        t.match(output, /║\s+Slower tests\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+|\s+Difference with slowest║/)
        t.match(output, /║\s+Fastest test\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+|\s+Difference with slowest║/)
        t.match(output, /║\s+(single|multiple)\s+|\s+10\s+|\s+\d+\.\d{2}\sop\/sec\s+|\s+±\s\d+.\d{2}\s%\s+|\s+║/)
        t.match(
          output,
          /║\s+(single|multiple)\s+|\s+10\s+|\s+\d+\.\d{2}\sop\/sec\s+|\s+±\s\d+.\d{2}\s%\s+|\s+\\+\s+\d+.\d{2}\s%\s+║/
        )
        t.match(output, /║\s+(error)\s+|\s+0\s+|\s+Errored\s+|\s+N\/A\s+|\s+N\/A\s+║/)
        t.end()
      }
    )
  })

  t.test('Printing - Previous compare', (t: any) => {
    cronometro(
      {
        single() {
          // No-op
        },
        multiple() {
          // No-op
        },
        error() {
          throw new Error('FAILED')
        }
      },
      { print: { compare: true, compareMode: 'previous' } },
      (err: Error | null) => {
        t.strictEqual(err, null)

        const output = removeStyle(loggerSpy.getCall(0).args[0])
        t.match(
          output,
          /║\s+Slower tests\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+|\s+Difference with previous\s+║/
        )
        t.match(output, /║\s+Faster test\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+|\s+Difference with previous\s+║/)
        t.match(output, /║\s+(single|multiple)\s+|\s+10\s+|\s+\d+\.\d{2}\sop\/sec\s+|\s+±\s\d+.\d{2}\s%\s+|\s+║/)
        t.match(
          output,
          /║\s+(single|multiple)\s+|\s+10\s+|\s+\d+\.\d{2}\sop\/sec\s+|\s+±\s\d+.\d{2}\s%\s+|\s+\\+\s+\d+.\d{2}\s%\s+║/
        )
        t.match(output, /║\s+(error)\s+|\s+0\s+|\s+Errored\s+|\s+N\/A\s+|\s+N\/A\s+║/)
        t.end()
      }
    )
  })

  t.test('Printing - Debugging', (t: any) => {
    const prevEnv = process.env.NODE_DEBUG
    process.env.NODE_DEBUG = 'cronometro'

    cronometro(
      {
        single() {
          // No-op
        },
        multiple() {
          // No-op
        },
        error() {
          throw new Error('FAILED')
        }
      },
      { print: { compare: true, compareMode: 'previous' } },
      (err: Error | null) => {
        process.env.NODE_DEBUG = prevEnv
        t.strictEqual(err, null)

        const invocations = loggerSpy.getCalls().map((c: SinonSpyCall) => c.args[0])

        t.match(
          invocations[0],
          /\[cronometro \d+\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] Creating worker for test single, 2 tests to go/
        )
        t.match(
          invocations[1],
          /\[cronometro \d+\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] Creating worker for test multiple, 1 tests to go/
        )
        t.match(
          invocations[2],
          /\[cronometro \d+\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] Creating worker for test error, 0 tests to go/
        )

        t.end()
      }
    )
  })
}
