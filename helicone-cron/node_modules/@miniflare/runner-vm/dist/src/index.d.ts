/// <reference types="node" />

import { AdditionalModules } from '@miniflare/shared';
import { Context } from '@miniflare/shared';
import { MiniflareError } from '@miniflare/shared';
import { ProcessedModuleRule } from '@miniflare/shared';
import { ScriptBlueprint } from '@miniflare/shared';
import { ScriptRunner } from '@miniflare/shared';
import { ScriptRunnerResult } from '@miniflare/shared';
import vm from 'vm';

export declare function defineHasInstances(ctx: vm.Context): void;

export declare class VMScriptRunner implements ScriptRunner {
    private context?;
    constructor(context?: vm.Context | undefined);
    private runAsScript;
    private runAsModule;
    run(globalScope: Context, blueprint: ScriptBlueprint, modulesRules?: ProcessedModuleRule[], additionalModules?: AdditionalModules): Promise<ScriptRunnerResult>;
}

export declare class VMScriptRunnerError extends MiniflareError<VMScriptRunnerErrorCode> {
}

export declare type VMScriptRunnerErrorCode = "ERR_MODULE_DISABLED" | "ERR_MODULE_STRING_SCRIPT" | "ERR_MODULE_RULE" | "ERR_MODULE_UNSUPPORTED" | "ERR_CJS_MODULE_UNSUPPORTED";

export { }
