import { AbstractHistogram } from 'hdr-histogram-js';
export interface PrintOptions {
    colors?: boolean;
    compare?: boolean;
    compareMode?: 'base' | 'previous';
}
export declare type SetupFunction = (cb: (err?: Error | null) => void) => Promise<any> | void;
export interface Options {
    iterations: number;
    setup: {
        [key: string]: SetupFunction;
    };
    errorThreshold: number;
    print: boolean | PrintOptions;
    warmup: boolean;
}
export declare type StaticTest = () => any;
export declare type AsyncTest = (cb: Callback) => any;
export declare type PromiseTest = () => Promise<any>;
export declare type Test = StaticTest | AsyncTest | PromiseTest;
export declare type Callback = ((err: Error | null) => void) | ((err: null, results: Results) => any);
export interface Percentiles {
    [key: string]: number;
}
export interface Result {
    success: boolean;
    error?: Error;
    size: number;
    min: number;
    max: number;
    mean: number;
    stddev: number;
    standardError: number;
    percentiles: Percentiles;
}
export interface Tests {
    [key: string]: Test;
}
export interface Results {
    [key: string]: Result;
}
export interface Context {
    warmup: boolean;
    iterations: number;
    errorThreshold: number;
    print: boolean | PrintOptions;
    tests: Array<[string, Test]>;
    results: Results;
    current: number;
    callback: Callback;
}
export interface WorkerContext {
    path: string;
    tests: Array<[string, Test]>;
    setup: {
        [key: string]: SetupFunction;
    };
    index: number;
    iterations: number;
    warmup: boolean;
    errorThreshold: number;
}
export interface TestContext {
    name: string;
    test: Test;
    errorThreshold: number;
    total: number;
    executed: number;
    histogram: AbstractHistogram;
    start: bigint;
    handler(error?: Error | null): void;
    notifier(value: any): void;
    callback(result: Result): void;
}
export declare const defaultOptions: {
    iterations: number;
    warmup: boolean;
    errorThreshold: number;
    print: boolean;
};
export declare const percentiles: number[];
