import { clean, colorize } from 'acquerello'
import { table } from 'table'
import { Result, Results } from './models'

const styles = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray']

interface PrintInfo {
  name: string
  size: number
  error: Error | null
  throughput: string
  standardError: string
  relative: string
  compared: string
}

export function printResults(results: Results, colors: boolean, compare: boolean, mode: 'base' | 'previous'): void {
  const styler = colors ? colorize : clean

  // Sort results by least performant first, then compare relative performances and also printing padding
  let last = 0
  let compared = ''
  let standardErrorPadding = 0

  const entries: Array<PrintInfo> = Object.entries(results)
    .sort((a: [string, Result], b: [string, Result]) => b[1].mean! - a[1].mean!)
    .map(([name, result]: [string, Result]) => {
      if (!result.success) {
        return { name, error: result.error, throughput: '', standardError: '', relative: '', compared: '' } as PrintInfo
      }

      const { size, mean, standardError } = result
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

      const standardErrorString = ((standardError! / mean!) * 100).toFixed(2)
      standardErrorPadding = Math.max(standardErrorPadding, standardErrorString.length)

      return {
        name,
        size: size!,
        error: null,
        throughput: (1e9 / mean!).toFixed(2),
        standardError: standardErrorString,
        relative: relative.toFixed(2),
        compared
      }
    })

  let currentColor = 0

  const rows: Array<Array<string>> = entries.map((entry: PrintInfo) => {
    if (entry.error) {
      const row = [
        styler(`{{gray}}${entry.name}{{-}}`),
        styler(`{{gray}}${entry.size}{{-}}`),
        styler('{{gray}}Errored{{-}}'),
        styler('{{gray}}N/A{{-}}')
      ]

      if (compare) {
        row.push(styler('{{gray}}N/A{{-}}'))
      }
    }

    const { name, size, throughput, standardError, relative } = entry
    const color = styles[currentColor++ % styles.length]

    const row = [
      styler(`{{${color}}}${name}{{-}}`),
      styler(`{{${color}}}${size}{{-}}`),
      styler(`{{${color}}}${throughput} op/sec{{-}}`),
      styler(`{{gray}}± ${standardError.padStart(standardErrorPadding, ' ')} %{{-}}`)
    ]

    if (compare) {
      if (relative.match(/^[0.\s]+$/)) {
        row.push('')
      } else {
        row.push(styler(`{{${color}}}+ ${relative} %{{-}}`))
      }
    }

    return row
  })

  const compareHeader = `Difference with ${mode === 'base' ? compared : 'previous'}`

  rows.unshift([
    styler('{{bold white}}Test{{-}}'),
    styler('{{bold white}}Samples{{-}}'),
    styler('{{bold white}}Result{{-}}'),
    styler('{{bold white}}Tolerance{{-}}')
  ])

  rows.splice(rows.length - 1, 0, [
    styler('{{bold white}}Fastest test{{-}}'),
    styler('{{bold white}}Samples{{-}}'),
    styler('{{bold white}}Result{{-}}'),
    styler('{{bold white}}Tolerance{{-}}')
  ])

  if (compare) {
    rows[0].push(styler(`{{bold white}}${compareHeader}{{-}}`))
    rows[rows.length - 2].push(styler(`{{bold white}}${compareHeader}{{-}}`))
  }

  console.log(
    table(rows, {
      columns: {
        0: {
          alignment: 'left'
        },
        1: {
          alignment: 'right'
        },
        2: {
          alignment: 'right'
        },
        3: {
          alignment: 'right'
        }
      },
      drawHorizontalLine(index: number, size: number): boolean {
        return index < 2 || index > size - 3
      }
    })
  )
}
