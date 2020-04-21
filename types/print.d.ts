import { Results } from './models';
export declare function setLogger(logger: (message: string, ...params: Array<any>) => void): void;
export declare function log(message: string): void;
export declare function printResults(results: Results, colors: boolean, compare: boolean, mode: 'base' | 'previous'): void;
