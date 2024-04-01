import type { Cron } from '../cron';
/**
 * A cron scheduler that is based on a single interval.
 * Every interval, it checks whether a registered cron task
 * was due during the last interval and executes it.
 * This scheduler might be more performant depending on the use case,
 * because it only creates a single interval for all scheduled crons,
 * however depending on the interval and crons, tasks might be executed
 * with a delay.
 */
export declare class IntervalBasedCronScheduler {
    #private;
    /**
     * Creates and starts a new scheduler with the given interval.
     */
    constructor(interval: number);
    start(): void;
    stop(): void;
    private insertTask;
    registerTask(cron: Cron, task: () => unknown, opts?: {
        isOneTimeTask: boolean;
        errorHandler?: (err: unknown) => unknown;
    }): number;
    /** Unregisters a task, causing it to no longer be executed. */
    unregisterTask(id: number): void;
    private sortTasks;
    private processTasks;
}
