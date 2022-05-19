# cronometro

[![Version](https://img.shields.io/npm/v/cronometro.svg)](https://npm.im/cronometro)
[![Dependencies](https://img.shields.io/librariesio/release/npm/cronometro)](https://libraries.io/npm/cronometro)
[![Build](https://github.com/ShogunPanda/cronometro/workflows/CI/badge.svg)](https://github.com/ShogunPanda/cronometro/actions?query=workflow%3ACI)
[![Coverage](https://img.shields.io/codecov/c/gh/ShogunPanda/cronometro?token=LhUiSgWHoI)](https://codecov.io/gh/ShogunPanda/cronometro)

Simple benchmarking suite powered by HDR histograms.

http://sw.cowtech.it/cronometro

## Requirements

Cronometro uses [worker_threads](https://nodejs.org/dist/latest-v12.x/docs/api/worker_threads.html) to run tests in a isolated V8 enviroments to offer the most accurate benchmark. This imposes the restrictions described in the subsections below.

### Supported Node versions

Only Node 12.x and above are supported.

This package only supports to be directly imported in a ESM context.

For informations on how to use it in a CommonJS context, please check [this page](https://gist.github.com/ShogunPanda/fe98fd23d77cdfb918010dbc42f4504d).

### Script invocation

The main script which invokes cronometro must be executable without command line arguments, as it is how it will be called within a Worker Thread.

If you need to configure the script at runtime, use environment variables and optionally configuration files.

### TypeScript

cronometro uses [ts-node](https://www.npmjs.com/package/ts-node) to compile TypeScript files on the fly.

ts-node and TypeScript are not installed automatically by cronometro (as they are listed in `peerDependencies`) so you need to do it manually.

To pass the `tsconfig.json` project file to use, use the `TS_NODE_PROJECT` environment variable.

### API use

If you use cronometro as an API and manipulate its return value, consider that the exact same code its executed in both the main thread and in worker threads.

Inside worker threads, the cronometro function invocation will return no value and no callbacks are invoked.

You can use `isMainThread` from Worker Threads API to check in which environment the script is running.

If your main module returns a function, cronometro will execute it before running tests. The function can also return a promise and that will be awaited.

## Usage

To run a benchmark, simply call the `cronometro` function with the set of tests you want to run, then optionally provide a options object and a Node's style callback.

The return value of the cronometro function is a promise which will be resolved with a results object (see below).

If the callback is provided, it will also be called with an error or the results object.

The set of tests must a be a object whose property names are tests names, and property values are tests definitions.

A test can be defined as a function containing the test to run or an object containing ore or more of the following properties:

- `test`: The function containing the test to run. If omitted, the test will be a no-op.
- `before`: A setup function to execute before starting test iteration.
- `after`: A cleanup function to execute after all test iteration have been run.

Each of the `test` functions above can be either a function, a function accepting a Node style callback or a function returning a promise (hence also async functions).

Each of the `before` or `after` functions above can be either a function accepting a Node style callback or a function returning a promise (hence also async functions).

## Options

The supported options are the following:

- `iterations`: The number of iterations to run for each test. Must be a positive number. The default is `10000`.
- `errorThreshold`: If active, it stops the test run before the desider number of iterations if the standard error is below the provided value and at least 10% of the iterations have been run. Must be a number between `0` (which disables this option) and `100`. The default is `1`.
- `warmup`: Run the suite twice, the first time without collecting results. The default is `true`.
- `print`: If print results on the console in a pretty tabular way. The default is `true`. It can be a boolean or a printing options object. The supported printing options are:
  - `colors`: If use colors. Default is `true`.
  - `compare`: If compare tests in the output. Default is `false`.
  - `compareMode`: When comparing is enabled, this can be set to `base` in order to always compare a test to the slowest one. The default is to compare a test to the immediate slower one.
- `onTestStart`: Callback invoked every time a test is started.
- `onTestEnd`: Callback invoked every time a test has finished.
- `onTestError`: Callback invoked every time a test could not be loaded. If the test function throws an error or rejects, `onTestEnd` will be invoked instead.

## Results structure

The results object will a object whose property names are the tests names.

Each property value is a object with the following properties:

- `success`: A boolean indicating if the test was successful. If the test is not successful, only the property error will be present.
- `error`: The first error, if any, thrown by a test iteration.
- `size`: The number of iterations records.
- `min`: The minimum execution time.
- `max`: The maximum execution time.
- `mean`: The average execution time.
- `stddev`: The execution times standard deviation.
- `standardError`: The execution times statistic standard error.
- `percentiles`: The percentiles of the execution times.

## Example (tabular output)

```javascript
import cronometro from 'cronometro'

const results = cronometro({
  test1: function () {
    // Do something
  },
  test2: function () {
    // Do something else
  }
})
```

Output:

```
╔══════════════╤══════════════════╤═══════════╗
║ Test         │           Result │ Tolerance ║
╟──────────────┼──────────────────┼───────────╢
║ test1        │ 161297.99 op/sec │  ± 0.65 % ║
╟──────────────┼──────────────────┼───────────╢
║ Fastest test │           Result │ Tolerance ║
╟──────────────┼──────────────────┼───────────╢
║ test2        │ 270642.97 op/sec │  ± 4.42 % ║
╚══════════════╧══════════════════╧═══════════╝
```

## Example (results structure)

```javascript
import cronometro from 'cronometro'

const pattern = /[123]/g
const replacements = { 1: 'a', 2: 'b', 3: 'c' }

const subject = '123123123123123123123123123123123123123123123123'

const results = cronometro(
  {
    single() {
      subject.replace(pattern, m => replacements[m])
    },
    multiple() {
      subject.replace(/1/g, 'a').replace(/2/g, 'b').replace(/3/g, 'c')
    }
  },
  {
    setup: {
      single(cb) {
        cb()
      }
    },
    print: { compare: true }
  },
  (err, results) => {
    if (err) {
      throw err
    }

    console.log(JSON.stringify(results, null, 2))
  }
)
```

Output:

```
{
  "single": {
    "success": true,
    "size": 5,
    "min": 29785,
    "max": 41506,
    "mean": 32894.2,
    "stddev": 4407.019555209621,
    "percentiles": {
      "1": 29785,
      "10": 29785,
      "25": 29861,
      "50": 30942,
      "75": 32377,
      "90": 41506,
      "99": 41506,
      "0.001": 29785,
      "0.01": 29785,
      "0.1": 29785,
      "2.5": 29785,
      "97.5": 41506,
      "99.9": 41506,
      "99.99": 41506,
      "99.999": 41506
    },
    "standardError": 1970.87906072392
  },
  "multiple": {
    "success": true,
    "size": 5,
    "min": 21881,
    "max": 33368,
    "mean": 27646.4,
    "stddev": 4826.189494829228,
    "percentiles": {
      "1": 21881,
      "10": 21881,
      "25": 23142,
      "50": 26770,
      "75": 33071,
      "90": 33368,
      "99": 33368,
      "0.001": 21881,
      "0.01": 21881,
      "0.1": 21881,
      "2.5": 21881,
      "97.5": 33368,
      "99.9": 33368,
      "99.99": 33368,
      "99.999": 33368
    },
    "standardError": 2158.337556546705
  }
}
```

## Contributing to cronometro

- Check out the latest master to make sure the feature hasn't been implemented or the bug hasn't been fixed yet.
- Check out the issue tracker to make sure someone already hasn't requested it and/or contributed it.
- Fork the project.
- Start a feature/bugfix branch.
- Commit and push until you are happy with your contribution.
- Make sure to add tests for it. This is important so I don't break it in a future version unintentionally.

## Copyright

Copyright (C) 2020 and above Shogun (shogun@cowtech.it).

Licensed under the ISC license, which can be found at https://choosealicense.com/licenses/isc.
