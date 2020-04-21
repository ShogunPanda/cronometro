import { AbstractHistogram } from 'hdr-histogram-js'

export interface PrintOptions {
  colors?: boolean
  compare?: boolean
  compareMode?: 'base' | 'previous'
}

export interface Options {
  iterations: number
  errorThreshold: number
  print: boolean | PrintOptions
  warmup: boolean
}

export type StaticTest = () => any
export type AsyncTest = (cb: Callback) => any
export type PromiseTest = () => Promise<any>

export type Test = StaticTest | AsyncTest | PromiseTest

export type Callback = ((err: Error | null) => any) | ((err: null, results: Results) => any)

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
  [key: string]: Test
}

export interface Results {
  [key: string]: Result
}

export interface Context {
  warmup: boolean
  iterations: number
  errorThreshold: number
  print: boolean | PrintOptions
  tests: Array<[string, Test]>
  results: Results
  current: number
  callback: Callback
}

export interface WorkerContext {
  path: string
  tests: Array<[string, Test]>
  index: number
  iterations: number
  errorThreshold: number
}

export interface TestContext {
  name: string
  test: Test
  errorThreshold: number
  total: number
  executed: number
  histogram: AbstractHistogram
  start: bigint
  handler(error?: Error | null): void
  notifier(value: any): void
  callback(code: number): void
}

export const defaultOptions = {
  iterations: 1e4,
  warmup: true,
  errorThreshold: 1,
  print: true
}

export const percentiles = [0.001, 0.01, 0.1, 1, 2.5, 10, 25, 50, 75, 90, 97.5, 99, 99.9, 99.99, 99.999]
