import { Histogram } from 'hdr-histogram-js';
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
export declare type TestFunction = StaticTest | AsyncTest | PromiseTest;
export interface Test {
    test?: TestFunction;
    before?: SetupFunction;
    after?: SetupFunction;
}
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
    [key: string]: TestFunction | Test;
}
export interface Results {
    [key: string]: Result;
}
export interface Context {
    warmup: boolean;
    iterations: number;
    errorThreshold: number;
    print: boolean | PrintOptions;
    tests: Array<[string, TestFunction | Test]>;
    results: Results;
    current: number;
    callback: Callback;
}
export interface WorkerContext {
    path: string;
    tests: Array<[string, TestFunction | Test]>;
    index: number;
    iterations: number;
    warmup: boolean;
    errorThreshold: number;
}
export interface TestContext {
    name: string;
    test: TestFunction;
    errorThreshold: number;
    total: number;
    executed: number;
    histogram: Histogram;
    start: bigint;
    handler: (error?: Error | null) => void;
    notifier: (value: any) => void;
    callback: (result: Result) => void;
}
export declare const defaultOptions: {
    iterations: number;
    warmup: boolean;
    errorThreshold: number;
    print: boolean;
};
export declare const percentiles: number[];
export declare const runnerPath: string;
