// @ts-ignore
import t from 'tap'
import { cronometro } from '../src'

t.test('Options validation', async (t: any) => {
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
    { message: 'The iterations option must be a positive number.' }
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
    (err: Error | null) => {
      t.type(err, 'Error')
      t.equal(err!.message, 'The errorThreshold option must be a number between 0 and 100.')
    }
  )
})
