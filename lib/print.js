"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const acquerello_1 = require("acquerello");
const styles = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'];
function log(message) {
    console.log(message
        .replace(/^\s+/g, '')
        .replace(/\n|(?:\s+)/g, ' ')
        .trim());
}
function printResults(results, colors, compare, mode) {
    const styler = colors ? acquerello_1.colorize : acquerello_1.clean;
    // Sort results by least performant first, then compare relative performances and also printing padding
    let last = 0;
    let compared = '';
    const paddings = {
        name: 0,
        throughput: 0,
        standardError: 0,
        relative: 0
    };
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
        const info = {
            name,
            error: null,
            throughput: (1e9 / mean).toFixed(2),
            standardError: ((standardError / mean) * 100).toFixed(2),
            relative: relative.toFixed(2),
            compared
        };
        paddings.name = Math.max(info.name.length, paddings.name);
        paddings.throughput = Math.max(info.throughput.length, paddings.name);
        paddings.standardError = Math.max(info.standardError.length, paddings.standardError);
        paddings.relative = Math.max(info.relative.length, paddings.relative);
        return info;
    });
    let currentColor = 0;
    for (let i = 0; i < entries.length; i++) {
        if (entries[i].error) {
            log(styler(`{{gray}}${entries[i].name.padStart(paddings.name, ' ')}: Skipped since it threw errors.{{-}}`));
        }
        else {
            let { name, throughput, standardError, relative, compared } = entries[i];
            const color = styles[currentColor++ % styles.length];
            name = name.padStart(paddings.name, ' ');
            throughput = throughput.padStart(paddings.throughput, ' ');
            standardError = standardError.padStart(paddings.standardError, ' ');
            relative = relative.padStart(paddings.relative, ' ');
            if (!compare || relative.match(/^[0.\s]+$/)) {
                log(styler(`
              {{${color}}}${name}: {{bold}}${throughput} ops/s{{-}}
              {{gray}}± ${standardError} %{{-}}
              ${compare ? '{{bold gray}} | {{-}}' : ''}
            `));
            }
            else {
                log(styler(`
              {{${color}}}${name}: {{bold}}${throughput} ops/s{{-}}
              {{gray}}± ${standardError} %{{-}}
              {{bold gray}} | {{-}}{{green}}{{bold}}${relative} % faster{{-}} than ${compared}{{-}}
            `));
            }
        }
    }
}
exports.printResults = printResults;
