import { type Histogram } from 'hdr-histogram-js'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Worker } from 'node:worker_threads'

export interface PrintOptions {
  colors?: boolean
  compare?: boolean
  compareMode?: 'base' | 'previous'
}

export type SetupFunctionCallback = (err?: Error | null) => void

export type SetupFunction = (cb: SetupFunctionCallback) => Promise<any> | void

export interface Options {
  iterations: number
  setup: Record<string, SetupFunction>
  errorThreshold: number
  print: boolean | PrintOptions
  warmup: boolean
  onTestStart?: (name: string, data: object, worker: Worker) => void
  onTestEnd?: (name: string, result: Result, worker: Worker) => void
  onTestError?: (name: string, error: Error, worker: Worker) => void
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

export type Percentiles = Record<string, number>

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

export type Callback = (err: Error | null, results: Results) => any

export type Tests = Record<string, TestFunction | Test>

export type Results = Record<string, Result>

export interface Context {
  warmup: boolean
  iterations: number
  errorThreshold: number
  print: boolean | PrintOptions
  tests: [string, TestFunction | Test][]
  results: Results
  current: number
  callback: Callback
  onTestStart?: (name: string, data: object, worker: Worker) => void
  onTestEnd?: (name: string, result: Result, worker: Worker) => void
  onTestError?: (name: string, error: Error, worker: Worker) => void
}

export interface WorkerContext {
  path: string
  tests: [string, TestFunction | Test][]
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

export const runnerPath = resolve(
  dirname(fileURLToPath(import.meta.url))
    .replace('src', 'dist')
    .replace(/models.(js|ts)/, ''),
  './runner.js'
)
