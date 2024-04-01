import { CorePluginSignatures } from '@miniflare/core';
import type { Cron } from 'cron-schedule';
import type { ITimerHandle } from 'cron-schedule';
import { MiniflareCore } from '@miniflare/core';
import { MiniflareError } from '@miniflare/shared';
import { Plugin } from '@miniflare/shared';
import { PluginContext } from '@miniflare/shared';
import { ReloadEvent } from '@miniflare/core';

export declare class CronScheduler<Plugins extends SchedulerPluginSignatures> {
    private readonly mf;
    private readonly cronScheduler;
    private previousValidatedCrons?;
    private scheduledHandles?;
    private inaccurateCpu?;
    constructor(mf: MiniflareCore<Plugins>, cronScheduler?: Promise<CronSchedulerImpl>);
    [kReload]: (event: ReloadEvent<Plugins>) => Promise<void>;
    dispose(): Promise<void>;
}

export declare interface CronSchedulerImpl {
    setInterval(cron: Cron, task: () => any): ITimerHandle;
    clearTimeoutOrInterval(handle: ITimerHandle): void;
}

declare const kReload: unique symbol;

export declare class SchedulerError extends MiniflareError<SchedulerErrorCode> {
}

export declare type SchedulerErrorCode = "ERR_INVALID_CRON";

export declare interface SchedulerOptions {
    crons?: string[];
}

export declare class SchedulerPlugin extends Plugin<SchedulerOptions> implements SchedulerOptions {
    #private;
    crons?: string[];
    constructor(ctx: PluginContext, options?: SchedulerOptions);
    get validatedCrons(): Cron[];
    setup(): Promise<void>;
}

export declare type SchedulerPluginSignatures = CorePluginSignatures & {
    SchedulerPlugin: typeof SchedulerPlugin;
};

export declare function startScheduler<Plugins extends SchedulerPluginSignatures>(mf: MiniflareCore<Plugins>, cronScheduler?: Promise<CronSchedulerImpl>): Promise<CronScheduler<Plugins>>;

export { }
