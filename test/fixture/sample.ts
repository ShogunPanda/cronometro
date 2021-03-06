// @ts-expect-error
import { cronometro } from '../../lib'
import { Results } from '../../src'

const pattern = /[123]/g
const replacements: { [key: string]: string } = { 1: 'a', 2: 'b', 3: 'c' }

const subject =
  '123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123'

cronometro(
  {
    single() {
      subject.replace(pattern, m => replacements[m])
    },
    multiple() {
      subject.replace(/1/g, 'a').replace(/2/g, 'b').replace(/3/g, 'c')
    }
  },
  { iterations: 5, errorThreshold: 0, print: { compare: true }, warmup: true },
  (_err: Error | null, results: Results) => {
    console.log(JSON.stringify(results, null, 2))
  }
)
