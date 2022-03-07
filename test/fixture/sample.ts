import cronometro from '../../dist/index.js'

const pattern = /[1-3]/g
const replacements: { [key: string]: string } = { 1: 'a', 2: 'b', 3: 'c' }

const subject =
  '123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
cronometro(
  {
    single() {
      subject.replace(pattern, m => replacements[m])
    },
    multiple() {
      subject.replaceAll('1', 'a').replaceAll('2', 'b').replaceAll('3', 'c')
    }
  },
  { iterations: 5, errorThreshold: 0, print: { compare: true }, warmup: true },
  (_, results) => {
    console.log(JSON.stringify(results, null, 2))
  }
)
