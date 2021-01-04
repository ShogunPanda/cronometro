import { Callback, Options, Results, Tests } from './models';
export * from './models';
export declare function cronometro(tests: Tests): Promise<Results> | void;
export declare function cronometro(tests: Tests, options: Partial<Options>): Promise<Results>;
export declare function cronometro(tests: Tests, options: Partial<Options>, cb: Callback): undefined;
export declare function cronometro(tests: Tests, options: Callback): void;
export default cronometro;
