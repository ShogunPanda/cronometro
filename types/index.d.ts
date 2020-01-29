import { Callback, Options, Results, Tests } from './models';
export * from './models';
export declare function benchie(tests: Tests, options: Options | Callback, callback?: Callback): Promise<Results> | undefined;
