# cronometro

[![Package Version](https://img.shields.io/npm/v/cronometro.svg)](https://npm.im/cronometro)
[![Dependency Status](https://img.shields.io/david/ShogunPanda/cronometro)](https://david-dm.org/ShogunPanda/cronometro)
[![Build](https://github.com/ShogunPanda/cronometro/workflows/CI/badge.svg)](https://github.com/ShogunPanda/cronometro/actions?query=workflow%3ACI)
[![Code Coverage](https://img.shields.io/codecov/c/gh/ShogunPanda/cronometro?token=d0ae1643f35c4c4f9714a357f796d05d)](https://codecov.io/gh/ShogunPanda/cronometro)

Simple benchmarking suite powered by HDR histograms.

http://sw.cowtech.it/cronometro

## Usage

To run a benchmark, simply call the `cronometro` function with the set of tests you want to run, then optionally provide a options object and a Node's style callback.

The set of tests must a be a object whose property names are tests names, and property values are tests definitions.

Each test can be either a function, a function accepting a Node style callback or a function returning a promise (hence also async functions).

The return value of the cronometro function is a promise which will be resolved with a results object (see below).

If the callback is provided, it will also be called with an error or the results object

## Options

The supported options are the following:

- `iterations`: The number of iterations to run for each test. Must be a positive number. The default is `10000`.
- `errorThreshold`: If active, it stops the test run before the desider number of iterations if the standard error is below the provided value and at least 10% of the iterations have been run. Must be a number between `0` (which disables this option) and `100`. The default is `1`.
- `warmup`: Run the suite twice, the first time without collecting results. The default is `true`.
- `print`: If print results on the console in a pretty tabular way. The default is `true`. It can be a boolean or a printing options object. The supported printing options are:
  - `colors`: If use colors. Default is `true`.
  - `compare`: If compare tests in the output. Default is `false`.
  - `compareMode`: When comparing is enabled, this can be set to `base` in order to always compare a test to the slowest one. The default is to compare a test to the immediate slower one.

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
const cronometro = require('cronometro')

const results = cronometro({
  test1: function() {
    // Do something
  },
  test2: function() {
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
const cronometro = require('cronometro')

const results = cronometro(
  {
    test1: function() {
      // Do something
    },
    test2: function() {
      // Do something else
    }
  },
  { print: { compare: true } },
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
  "test1": {
    "success": true,
    "size": 100001,
    "min": 4732,
    "max": 4732,
    "mean": 7010.153258467415,
    "stddev": 66157.57904031666,
    "percentiles": {
      "0": 4732,
      "50": 5216,
      "75": 6077,
      "100": 20469632,
      "87.5": 6988,
      "93.75": 13986,
      "96.875": 20314,
      "98.4375": 25338,
      "99.21875": 27127,
      "99.609375": 32019,
      "99.8046875": 39667,
      "99.90234375": 57527,
      "99.951171875": 81029,
      "99.9755859375": 237553,
      "99.98779296875": 700244,
      "99.993896484375": 996392,
      "99.9969482421875": 1133848,
      "99.99847412109375": 2129600,
      "99.99923706054688": 20469632
    },
    "standardError": 209.20758821469119
  },
  "test2": {
    "success": true,
    "size": 100001,
    "min": 1376,
    "max": 1376,
    "mean": 3810.3853361466386,
    "stddev": 50388.5658604418,
    "percentiles": {
      "0": 1376,
      "50": 1478,
      "75": 1587,
      "100": 3069392,
      "87.5": 1732,
      "93.75": 1811,
      "96.875": 2037,
      "98.4375": 15448,
      "99.21875": 20835,
      "99.609375": 23230,
      "99.8046875": 42270,
      "99.90234375": 1129616,
      "99.951171875": 1333168,
      "99.9755859375": 1429376,
      "99.98779296875": 1483120,
      "99.993896484375": 1743192,
      "99.9969482421875": 2598512,
      "99.99847412109375": 2910800,
      "99.99923706054688": 3069392
    },
    "standardError": 159.34183944119272
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
