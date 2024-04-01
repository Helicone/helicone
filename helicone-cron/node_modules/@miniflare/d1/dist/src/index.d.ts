import type { Database } from 'better-sqlite3';
import { Plugin } from '@miniflare/shared';
import { PluginContext } from '@miniflare/shared';
import { RunResult } from 'better-sqlite3';
import { SetupResult } from '@miniflare/shared';
import type { SqliteDB } from '@miniflare/shared';
import { StorageFactory } from '@miniflare/shared';

export declare class BetaDatabase {
    #private;
    constructor(db: SqliteDB);
    prepare(source: string): Statement;
    batch(statements: Statement[]): Promise<{
        results: any[] | RunResult;
        duration: number;
        lastRowId: null;
        changes: null;
        success: boolean;
        served_by: string;
    }[]>;
    exec(multiLineStatements: string): Promise<{
        count: number;
        duration: number;
    }>;
    dump(): Promise<void>;
}

export declare type BindParams = any[] | [Record<string, any>];

export declare interface D1Options {
    d1Databases?: string[];
    d1Persist?: boolean | string;
}

export declare class D1Plugin extends Plugin<D1Options> implements D1Options {
    #private;
    d1Databases?: string[];
    d1Persist?: boolean | string;
    constructor(ctx: PluginContext, options?: D1Options);
    getBetaDatabase(storageFactory: StorageFactory, dbName: string): Promise<BetaDatabase>;
    setup(storageFactory: StorageFactory): Promise<SetupResult>;
}

export declare class Statement {
    #private;
    constructor(db: Database, query: string, bindings?: BindParams);
    bind(...params: BindParams): Statement;
    all(): Promise<{
        results: any[] | RunResult;
        duration: number;
        lastRowId: null;
        changes: null;
        success: boolean;
        served_by: string;
    }>;
    first(col?: string): Promise<any>;
    run(): Promise<{
        results: null;
        duration: number;
        lastRowId: number | bigint;
        changes: number;
        success: boolean;
        served_by: string;
    }>;
    raw(): Promise<any>;
}

export { }
