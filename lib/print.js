"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const acquerello_1 = require("acquerello");
const table_1 = require("table");
const styles = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'];
function printResults(results, colors, compare, mode) {
    const styler = colors ? acquerello_1.colorize : acquerello_1.clean;
    // Sort results by least performant first, then compare relative performances and also printing padding
    let last = 0;
    let compared = '';
    let standardErrorPadding = 0;
    const entries = Object.entries(results)
        .sort((a, b) => b[1].mean - a[1].mean)
        .map(([name, result]) => {
        if (!result.success) {
            return { name, error: result.error, throughput: '', standardError: '', relative: '', compared: '' };
        }
        const { mean, standardError } = result;
        const relative = last !== 0 ? (last / mean - 1) * 100 : 0;
        if (mode === 'base') {
            if (last === 0) {
                last = mean;
                compared = name;
            }
        }
        else {
            last = mean;
            compared = name;
        }
        const standardErrorString = ((standardError / mean) * 100).toFixed(2);
        standardErrorPadding = Math.max(standardErrorPadding, standardErrorString.length);
        return {
            name,
            error: null,
            throughput: (1e9 / mean).toFixed(2),
            standardError: standardErrorString,
            relative: relative.toFixed(2),
            compared
        };
    });
    let currentColor = 0;
    const rows = entries.map((entry) => {
        if (entry.error) {
            const row = [styler(`{{gray}}${entry.name}{{-}}`), styler('{{gray}}Errored{{-}}'), styler('{{gray}}N/A{{-}}')];
            if (compare) {
                row.push(styler('{{gray}}N/A{{-}}'));
            }
        }
        const { name, throughput, standardError, relative } = entry;
        const color = styles[currentColor++ % styles.length];
        const row = [
            styler(`{{${color}}}${name}{{-}}`),
            styler(`{{${color}}}${throughput} op/sec{{-}}`),
            styler(`{{gray}}± ${standardError.padStart(standardErrorPadding, ' ')} %{{-}}`)
        ];
        if (compare) {
            if (relative.match(/^[0.\s]+$/)) {
                row.push('');
            }
            else {
                row.push(styler(`{{${color}}}+ ${relative} %{{-}}`));
            }
        }
        return row;
    });
    const compareHeader = `Difference with ${mode === 'base' ? compared : 'previous'}`;
    rows.unshift([
        styler('{{bold white}}Test{{-}}'),
        styler('{{bold white}}Result{{-}}'),
        styler('{{bold white}}Tolerance{{-}}')
    ]);
    rows.splice(rows.length - 1, 0, [
        styler('{{bold white}}Fastest test{{-}}'),
        styler('{{bold white}}Result{{-}}'),
        styler('{{bold white}}Tolerance{{-}}')
    ]);
    if (compare) {
        rows[0].push(styler(`{{bold white}}${compareHeader}{{-}}`));
        rows[rows.length - 2].push(styler(`{{bold white}}${compareHeader}{{-}}`));
    }
    console.log(table_1.table(rows, {
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
        drawHorizontalLine(index, size) {
            return index < 2 || index > size - 3;
        }
    }));
}
exports.printResults = printResults;
