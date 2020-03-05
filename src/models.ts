export interface PrintOptions {
  colors?: boolean
  compare?: boolean
  compareMode?: 'base' | 'previous'
}

export interface Options {
  iterations: number
  print: boolean | PrintOptions
  warmup: boolean
}

export type StaticTest = () => any
export type AsyncTest = (cb: Callback) => any
export type PromiseTest = () => Promise<any>

export type Test = StaticTest | AsyncTest | PromiseTest

export type Callback = (err?: Error | null, result?: Results) => any

export interface Histogram {
  record(value: number): boolean
  min(): number
  max(): number
  mean(): number
  stddev(): number
  percentiles(): Array<{ percentile: number; value: number }>
}

export interface Result {
  success: boolean
  error?: Error
  size?: number
  min?: number
  max?: number
  mean?: number
  stddev?: number
  standardError?: number
  percentiles?: {
    [key: string]: number
  }
}

export interface Tests {
  [key: string]: Test
}

export interface Results {
  [key: string]: Result
}

export interface Context {
  callback: Callback
  queue: Array<[string, Test]>
  results: Results
  iterations: number
  errorThreshold: number
}

export interface TestContext extends Context {
  current: {
    name: string
    test: Test
    remaining: number
    records: number
    histogram: Histogram
  }
}
