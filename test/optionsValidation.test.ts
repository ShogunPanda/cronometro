/* eslint-disable @typescript-eslint/no-floating-promises */

import t from 'tap'
import { cronometro } from '../src/index.js'

t.test('Options validation', async t => {
  await t.rejects(
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
      t.type(err, 'Error')
      t.equal(err!.message, 'The errorThreshold option must be a number between 0 and 100.')
    }
  )
})
