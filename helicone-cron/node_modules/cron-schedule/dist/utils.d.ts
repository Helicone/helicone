export declare const TIMEOUT_MAX = 2147483647;
export interface ITimerHandle {
    timeoutId?: ReturnType<typeof setTimeout>;
}
/**
 * Creates a new timeout, which can exceed the max timeout limit of 2^31-1.
 * Since multiple timeouts are used internally, the timeoutId used to clear the timeout
 * is returned as a handle (object) and changes whenever the max timeout limit is exceeded.
 * The handle parameter can be ignored, it is used internally for updating the timeoutId
 * in the handle after creating the next timeout.
 */
export declare function longTimeout(fn: () => void, timeout: number, handle?: ITimerHandle): ITimerHandle;
export declare function extractDateElements(date: Date): {
    second: number;
    minute: number;
    hour: number;
    day: number;
    month: number;
    weekday: number;
    year: number;
};
export declare function getDaysInMonth(year: number, month: number): number;
export declare function getDaysBetweenWeekdays(weekday1: number, weekday2: number): number;
export declare function wrapFunction(fn: () => unknown, errorHandler?: (err: unknown) => unknown): () => void;
