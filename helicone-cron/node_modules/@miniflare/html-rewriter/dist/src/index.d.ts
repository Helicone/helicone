import type { DocumentHandlers } from 'html-rewriter-wasm';
import type { ElementHandlers } from 'html-rewriter-wasm';
import { Plugin } from '@miniflare/shared';
import { PluginContext } from '@miniflare/shared';
import { Response } from 'undici';
import { Response as Response_2 } from '@miniflare/core';
import { SetupResult } from '@miniflare/shared';

export declare class HTMLRewriter {
    #private;
    [kEnableEsiTags]: boolean;
    on(selector: string, handlers: ElementHandlers): this;
    onDocument(handlers: DocumentHandlers): this;
    transform(response: Response | Response_2): Response_2;
}

export declare class HTMLRewriterPlugin extends Plugin {
    constructor(ctx: PluginContext);
    setup(): SetupResult;
}

declare const kEnableEsiTags: unique symbol;

export declare function withEnableEsiTags(rewriter: HTMLRewriter): HTMLRewriter;

export { }
