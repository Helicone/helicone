/**
 * Common Result type for safe operations across the codebase
 */
export interface ResultError<K> {
    data: null;
    error: K;
}
export interface ResultSuccess<T> {
    data: T;
    error: null;
}
export type Result<T, K = string> = ResultSuccess<T> | ResultError<K>;
export declare function isError<T, K>(result: Result<T, K>): result is ResultError<K>;
export declare function isSuccess<T, K>(result: Result<T, K>): result is ResultSuccess<T>;
export declare function unwrap<T, K>(result: Result<T, K>): T;
export declare function unwrapAsync<T, K>(result: Promise<Result<T, K>>): Promise<T>;
export declare function unwrapList<T extends unknown, K>(results: Result<T, K>[]): T[];
export declare function ok<T, K = string>(data: T): Result<T, K>;
export declare function err<T, K = string>(error: K): Result<T, K>;
export declare function resultMap<T, K, Z>(result: Result<T, K>, f: (data: T) => Z): Result<Z, K>;
export declare function map<T, K, L>(result: Result<T, K>, mapFn: (data: T) => L): Result<L, K>;
export declare function promiseResultMap<T, K, Z>(result: Result<T, K>, f: (data: T) => Promise<Z>): Promise<Result<Z, K>>;
type NonNull<T> = T extends null ? never : T;
type Unwrap<T> = T extends Result<infer U, infer K> ? NonNull<U> : never;
type UnwrapError<T> = T extends Result<infer U, infer K> ? NonNull<K> : never;
type AllSuccessTuple<T extends Result<any, any>[]> = {
    [I in keyof T]: Unwrap<T[I]>;
};
export declare function resultsAll<T extends Result<any, any>[]>(results: [...T]): Result<AllSuccessTuple<T>, UnwrapError<T[number]>>;
export {};
