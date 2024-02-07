/* eslint-disable @typescript-eslint/no-floating-promises */

import { deepStrictEqual, ifError, match, ok } from 'node:assert'
import { test } from 'node:test'
import { isMainThread } from 'node:worker_threads'
import { cronometro, defaultOptions, percentiles } from '../src/index.js'
import { setLogger } from '../src/print.js'

function removeStyle(source: string): string {
  // eslint-disable-next-line no-control-regex
  return source.replaceAll(/\u001B\[\d+m/g, '')
}

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
  test('Printing - Default options', (t, done) => {
    const logger = t.mock.fn()
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
        ifError(err)
        deepStrictEqual(Object.keys(results), ['single', 'multiple', 'error'])

        ok(!results.error.success)
        ok(results.error.error instanceof Error)
        deepStrictEqual(results.error.error.message, 'FAILED')
        deepStrictEqual(results.error.size, 0)
        deepStrictEqual(results.error.min, 0)
        deepStrictEqual(results.error.max, 0)
        deepStrictEqual(results.error.mean, 0)
        deepStrictEqual(results.error.stddev, 0)
        deepStrictEqual(results.error.standardError, 0)
        deepStrictEqual(results.error.percentiles, {})
        delete results.error

        for (const entry of Object.values(results)) {
          ok(entry.success)
          ifError(entry.error)
          deepStrictEqual(entry.size, 10)
          ok(typeof entry.min, 'number')
          ok(typeof entry.max, 'number')
          ok(typeof entry.mean, 'number')
          ok(typeof entry.stddev, 'number')
          ok(typeof entry.standardError, 'number')

          for (const percentile of percentiles) {
            ok(typeof entry.percentiles[percentile.toString()], 'number')
          }
        }

        const output = removeStyle(logger.mock.calls[0].arguments[0] as string)
        match(output, /║\s+Slower tests\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+║/)
        match(output, /║\s+Faster test\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+║/)
        match(output, /║\s+(single|multiple)\s+|\s+10\s+|\s+\d+\.\d{2}\sop\/sec\s+|\s+±\s\d+.\d{2}\s%\s+║/)
        match(output, /║\s+(error)\s+|\s+0\s+|\s+Errored\s+|\s+N\/A\s+║/)
        done()
      }
    )
  })

  test('Printing - No colors', (t, done) => {
    const logger = t.mock.fn()
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
        ifError(err)

        const output = removeStyle(logger.mock.calls[0].arguments[0] as string)

        // eslint-disable-next-line no-control-regex
        ok(!output.match(/\u001B/))
        done()
      }
    )
  })

  test('Printing - Base compare', (t, done) => {
    const logger = t.mock.fn()
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
        ifError(err)

        const output = removeStyle(logger.mock.calls[0].arguments[0] as string)
        match(output, /║\s+Slower tests\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+|\s+Difference with slowest║/)
        match(output, /║\s+Fastest test\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+|\s+Difference with slowest║/)
        match(output, /║\s+(single|multiple)\s+|\s+10\s+|\s+\d+\.\d{2}\sop\/sec\s+|\s+±\s\d+.\d{2}\s%\s+|\s+║/)
        match(
          output,
          /║\s+(single|multiple)\s+|\s+10\s+|\s+\d+\.\d{2}\sop\/sec\s+|\s+±\s\d+.\d{2}\s%\s+|\s+\\+\s+\d+.\d{2}\s%\s+║/
        )
        match(output, /║\s+(error)\s+|\s+0\s+|\s+Errored\s+|\s+N\/A\s+|\s+N\/A\s+║/)
        done()
      }
    )
  })

  test('Printing - Previous compare', (t, done) => {
    const logger = t.mock.fn()
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
        ifError(err)

        const output = removeStyle(logger.mock.calls[0].arguments[0] as string)
        match(output, /║\s+Slower tests\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+|\s+Difference with previous\s+║/)
        match(output, /║\s+Faster test\s+|\s+Samples\s+|\s+Result\s+|\s+Tolerance\s+|\s+Difference with previous\s+║/)
        match(output, /║\s+(single|multiple)\s+|\s+10\s+|\s+\d+\.\d{2}\sop\/sec\s+|\s+±\s\d+.\d{2}\s%\s+|\s+║/)
        match(
          output,
          /║\s+(single|multiple)\s+|\s+10\s+|\s+\d+\.\d{2}\sop\/sec\s+|\s+±\s\d+.\d{2}\s%\s+|\s+\\+\s+\d+.\d{2}\s%\s+║/
        )
        match(output, /║\s+(error)\s+|\s+0\s+|\s+Errored\s+|\s+N\/A\s+|\s+N\/A\s+║/)
        done()
      }
    )
  })
}
