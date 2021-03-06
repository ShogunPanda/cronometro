import { resolve } from 'path';
export const defaultOptions = {
    iterations: 1e4,
    warmup: true,
    errorThreshold: 1,
    print: true
};
export const percentiles = [0.001, 0.01, 0.1, 1, 2.5, 10, 25, 50, 75, 90, 97.5, 99, 99.9, 99.99, 99.999];
export const runnerPath = resolve(import.meta.url.replace('file://', '').replace('models.mjs', ''), 'runner.mjs');
