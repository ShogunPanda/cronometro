import { Histogram } from 'hdr-histogram-js'
import { resolve } from 'path'

export interface PrintOptions {
  colors?: boolean
  compare?: boolean
  compareMode?: 'base' | 'previous'
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type SetupFunction = (cb: (err?: Error | null) => void) => Promise<any> | void

export interface Options {
  iterations: number
  setup: { [key: string]: SetupFunction }
  errorThreshold: number
  print: boolean | PrintOptions
  warmup: boolean
}

export type StaticTest = () => any
export type AsyncTest = (cb: Callback) => any
export type PromiseTest = () => Promise<any>
export type TestFunction = StaticTest | AsyncTest | PromiseTest

export interface Test {
  test?: TestFunction
  before?: SetupFunction
  after?: SetupFunction
}

export type Callback = ((err: Error | null) => void) | ((err: null, results: Results) => any)

export interface Percentiles {
  [key: string]: number
}

export interface Result {
  success: boolean
  error?: Error
  size: number
  min: number
  max: number
  mean: number
  stddev: number
  standardError: number
  percentiles: Percentiles
}

export interface Tests {
  [key: string]: TestFunction | Test
}

export interface Results {
  [key: string]: Result
}

export interface Context {
  warmup: boolean
  iterations: number
  errorThreshold: number
  print: boolean | PrintOptions
  tests: Array<[string, TestFunction | Test]>
  results: Results
  current: number
  callback: Callback
}

export interface WorkerContext {
  path: string
  tests: Array<[string, TestFunction | Test]>
  index: number
  iterations: number
  warmup: boolean
  errorThreshold: number
}

export interface TestContext {
  name: string
  test: TestFunction
  errorThreshold: number
  total: number
  executed: number
  histogram: Histogram
  start: bigint
  handler: (error?: Error | null) => void
  notifier: (value: any) => void
  callback: (result: Result) => void
}

export const defaultOptions = {
  iterations: 1e4,
  warmup: true,
  errorThreshold: 1,
  print: true
}

export const percentiles = [0.001, 0.01, 0.1, 1, 2.5, 10, 25, 50, 75, 90, 97.5, 99, 99.9, 99.99, 99.999]

export const runnerPath = resolve(__dirname, '../dist/cjs/runner.js')
