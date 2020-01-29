import { clean, colorize } from 'acquerello'
import { Result, Results } from './models'

const styles = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray']

interface PrintInfo {
  name: string
  error: Error | null
  throughput: string
  standardError: string
  relative: string
  compared: string
}

function log(message: string): void {
  console.log(
    message
      .replace(/^\s+/g, '')
      .replace(/\n|(?:\s+)/g, ' ')
      .trim()
  )
}

export function printResults(results: Results, colors: boolean, compare: boolean, mode: 'base' | 'previous'): void {
  const styler = colors ? colorize : clean
  // Sort results by least performant first, then compare relative performances and also printing padding
  let last = 0
  let compared = ''
  const paddings = {
    name: 0,
    throughput: 0,
    standardError: 0,
    relative: 0
  }

  const entries: Array<PrintInfo> = Object.entries(results)
    .sort((a: [string, Result], b: [string, Result]) => b[1].mean! - a[1].mean!)
    .map(([name, result]: [string, Result]) => {
      if (!result.success) {
        return { name, error: result.error, throughput: '', standardError: '', relative: '', compared: '' } as PrintInfo
      }

      const { mean, standardError } = result
      const relative = last !== 0 ? (last / mean! - 1) * 100 : 0

      if (mode === 'base') {
        if (last === 0) {
          last = mean!
          compared = name
        }
      } else {
        last = mean!
        compared = name
      }

      const info: PrintInfo = {
        name,
        error: null,
        throughput: (1e9 / mean!).toFixed(2),
        standardError: ((standardError! / mean!) * 100).toFixed(2),
        relative: relative.toFixed(2),
        compared
      }

      paddings.name = Math.max(info.name.length, paddings.name)
      paddings.throughput = Math.max(info.throughput.length, paddings.name)
      paddings.standardError = Math.max(info.standardError.length, paddings.standardError)
      paddings.relative = Math.max(info.relative.length, paddings.relative)

      return info
    })

  let currentColor = 0
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].error) {
      log(styler(`{{gray}}${entries[i].name.padStart(paddings.name, ' ')}: Skipped since it threw errors.{{-}}`))
    } else {
      let { name, throughput, standardError, relative, compared } = entries[i]
      const color = styles[currentColor++ % styles.length]

      name = name.padStart(paddings.name, ' ')
      throughput = throughput.padStart(paddings.throughput, ' ')
      standardError = standardError.padStart(paddings.standardError, ' ')
      relative = relative.padStart(paddings.relative, ' ')

      if (!compare || relative.match(/^[0.\s]+$/)) {
        log(
          styler(
            `
              {{${color}}}${name}: {{bold}}${throughput} ops/s{{-}}
              {{gray}}± ${standardError} %{{-}}
              ${compare ? '{{bold gray}} | {{-}}' : ''}
            `
          )
        )
      } else {
        log(
          styler(
            `
              {{${color}}}${name}: {{bold}}${throughput} ops/s{{-}}
              {{gray}}± ${standardError} %{{-}}
              {{bold gray}} | {{-}}{{green}}{{bold}}${relative} % faster{{-}} than ${compared}{{-}}
            `
          )
        )
      }
    }
  }
}
