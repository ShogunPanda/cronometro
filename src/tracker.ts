import { build, type Histogram } from 'hdr-histogram-js'
import { percentiles, type Result } from './models.ts'

export class Tracker {
  iterations: number
  histogram: Histogram
  error: Error | undefined

  constructor() {
    this.iterations = 0
    this.error = undefined
    this.histogram = build({
      lowestDiscernibleValue: 1,
      highestTrackableValue: 1e9,
      numberOfSignificantValueDigits: 5
    })
  }

  get results(): Result {
    if (typeof this.error !== 'undefined') {
      return {
        success: false,
        error: this.error,
        size: 0,
        min: 0,
        max: 0,
        mean: 0,
        stddev: 0,
        percentiles: {},
        standardError: 0
      }
    }

    const size = this.iterations
    const { minNonZeroValue: min, maxValue: max, mean, stdDeviation } = this.histogram

    return {
      success: true,
      size,
      min,
      max,
      mean,
      stddev: stdDeviation,
      percentiles: Object.fromEntries(
        percentiles.map(percentile => [percentile, this.histogram.getValueAtPercentile(percentile)])
      ),
      standardError: stdDeviation / Math.sqrt(size)
    }
  }

  get standardError(): number {
    return this.histogram.stdDeviation / Math.sqrt(this.iterations)
  }

  track(start: bigint) {
    // Grab duration even in case of error to make sure we don't add any overhead to the benchmark
    const duration = Number(process.hrtime.bigint() - start)
    this.histogram.recordValue(duration)
    this.iterations++
  }
}
