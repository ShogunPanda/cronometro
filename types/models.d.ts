export interface PrintOptions {
    colors?: boolean;
    compare?: boolean;
    compareMode?: 'base' | 'previous';
}
export interface Options {
    iterations: number;
    print: boolean | PrintOptions;
}
export declare type StaticTest = () => any;
export declare type AsyncTest = (cb: Callback) => any;
export declare type PromiseTest = () => Promise<any>;
export declare type Test = StaticTest | AsyncTest | PromiseTest;
export declare type Callback = (err?: Error | null, result?: Results) => any;
export interface Histogram {
    record(value: number): boolean;
    min(): number;
    max(): number;
    mean(): number;
    stddev(): number;
    percentiles(): Array<{
        percentile: number;
        value: number;
    }>;
}
export interface Result {
    success: boolean;
    error?: Error;
    size?: number;
    min?: number;
    max?: number;
    mean?: number;
    stddev?: number;
    standardError?: number;
    percentiles?: {
        [key: string]: number;
    };
}
export interface Tests {
    [key: string]: Test;
}
export interface Results {
    [key: string]: Result;
}
export interface Context {
    callback: Callback;
    queue: Array<[string, Test]>;
    results: Results;
    iterations: number;
    current?: {
        name: string;
        test: Test;
        remaining: number;
        records: number;
        histogram: Histogram;
    };
}
