/* eslint-disable @typescript-eslint/no-floating-promises */

import { isMainThread } from 'node:worker_threads'
import t from 'tap'
import { cronometro, defaultOptions, percentiles } from '../src/index.js'
import { setLogger } from '../src/print.js'

function removeStyle(source: string): string {
  // eslint-disable-next-line no-control-regex
  return source.replaceAll(/\u001B\[\d+m/g, '')
}

function loggerBase() {}

defaultOptions.iterations = 10

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
  t.test('Printing - Default options', t => {
    const logger = t.captureFn(loggerBase)
    setLogger(logger)

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
      (err, results) => {
        t.equal(err, null)
        t.strictSame(Object.keys(results), ['single', 'multiple', 'error'])

        t.notOk(results.error.success)
        t.type(results.error.error, Error)
        t.equal(results.error.error!.message, 'FAILED')
        t.equal(results.error.size, 0)
        t.equal(results.error.min, 0)
        t.equal(results.error.max, 0)
        t.equal(results.error.mean, 0)
        t.equal(results.error.stddev, 0)
        t.equal(results.error.standardError, 0)
        t.strictSame(results.error.percentiles, {})
        delete results.error

        for (const entry of Object.values(results)) {
          t.ok(entry.success)
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

        const output = removeStyle(logger.calls[0].args[0 as number]!)
        t.match(output, /║\s+Slower tests\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+║/)
        t.match(output, /║\s+Faster test\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+║/)
        t.match(output, /║\s+(single|multiple)\s+|\s+10\s+|\s+\d+\.\d{2}\sop\/sec\s+|\s+±\s\d+.\d{2}\s%\s+║/)
        t.match(output, /║\s+(error)\s+|\s+0\s+|\s+Errored\s+|\s+N\/A\s+║/)
        t.end()
      }
    )
  })

  t.test('Printing - No colors', t => {
    const logger = t.captureFn(loggerBase)
    setLogger(logger)

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
      err => {
        t.equal(err, null)

        const output = removeStyle(logger.calls[0].args[0 as number]!)

        // eslint-disable-next-line no-control-regex
        t.notMatch(output, /\u001B/)

        t.end()
      }
    )
  })

  t.test('Printing - Base compare', t => {
    const logger = t.captureFn(loggerBase)
    setLogger(logger)

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
      err => {
        t.equal(err, null)

        const output = removeStyle(logger.calls[0].args[0 as number]!)
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

  t.test('Printing - Previous compare', t => {
    const logger = t.captureFn(loggerBase)
    setLogger(logger)

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
      err => {
        t.equal(err, null)

        const output = removeStyle(logger.calls[0].args[0 as number]!)
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
}
