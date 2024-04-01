import type { Cron } from '../cron';
import { ITimerHandle } from '../utils';
/**
 * A cron scheduler that is based on timers.
 * It will create one timer for every scheduled cron.
 * When the node timeout limit of ~24 days would be exceeded,
 * it uses multiple consecutive timeouts.
 */
export declare class TimerBasedCronScheduler {
    /**
     * Creates a timeout, which will fire the given task on the next cron date.
     * Returns a handle which can be used to clear the timeout using clearTimeoutOrInterval.
     */
    static setTimeout(cron: Cron, task: () => unknown, opts?: {
        errorHandler?: (err: unknown) => unknown;
    }): ITimerHandle;
    /**
     * Creates an interval, which will fire the given task on every future cron date.
     * Returns a handle which can be used to clear the interval using clearTimeoutOrInterval.
     */
    static setInterval(cron: Cron, task: () => unknown, opts?: {
        errorHandler?: (err: unknown) => unknown;
        handle?: ITimerHandle;
    }): ITimerHandle;
    /** Clears a timeout or interval, making sure that the function will no longer execute. */
    static clearTimeoutOrInterval(handle: ITimerHandle): void;
}
