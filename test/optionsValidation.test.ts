/* eslint-disable @typescript-eslint/no-floating-promises */

import { deepStrictEqual, ok, rejects } from 'node:assert'
import { test } from 'node:test'
import { cronometro } from '../src/index.js'

test('Options validation', async () => {
  await rejects(
    () =>
      cronometro(
        {
          single() {
            Buffer.alloc(10)
          },
          multiple() {
            Buffer.alloc(10)
            Buffer.alloc(20)
          }
        },
        { iterations: -1 }
      ),
    new Error('The iterations option must be a positive number.')
  )

  cronometro(
    {
      single() {
        Buffer.alloc(10)
      },
      multiple() {
        Buffer.alloc(10)
        Buffer.alloc(20)
      }
    },
    { errorThreshold: -1 },
    err => {
      ok(err instanceof Error)
      deepStrictEqual(err.message, 'The errorThreshold option must be a number between 0 and 100.')
    }
  )

  cronometro(
    {
      single() {
        Buffer.alloc(10)
      },
      multiple() {
        Buffer.alloc(10)
        Buffer.alloc(20)
      }
    },
    { onTestStart: 1 as any },
    err => {
      ok(err instanceof Error)
      deepStrictEqual(err.message, 'The onTestStart option must be a function.')
    }
  )

  cronometro(
    {
      single() {
        Buffer.alloc(10)
      },
      multiple() {
        Buffer.alloc(10)
        Buffer.alloc(20)
      }
    },
    { onTestEnd: 1 as any },
    err => {
      ok(err instanceof Error)
      deepStrictEqual(err.message, 'The onTestEnd option must be a function.')
    }
  )

  cronometro(
    {
      single() {
        Buffer.alloc(10)
      },
      multiple() {
        Buffer.alloc(10)
        Buffer.alloc(20)
      }
    },
    { onTestError: 1 as any },
    err => {
      ok(err instanceof Error)
      deepStrictEqual(err.message, 'The onTestError option must be a function.')
    }
  )
})
