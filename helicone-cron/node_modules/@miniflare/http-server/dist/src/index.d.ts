/// <reference types="node" />

import { Awaitable } from '@miniflare/shared';
import { Clock } from '@miniflare/shared';
import { CorePluginSignatures } from '@miniflare/core';
import http from 'http';
import https from 'https';
import { IncomingRequestCfProperties } from '@miniflare/core';
import { MiniflareCore } from '@miniflare/core';
import { Plugin } from '@miniflare/shared';
import { PluginContext } from '@miniflare/shared';
import { Request } from '@miniflare/core';
import { RequestInfo } from 'undici';
import { Response } from '@miniflare/core';
import { SetupResult } from '@miniflare/shared';
import { URL as URL_2 } from 'url';

export declare function convertNodeRequest(req: http.IncomingMessage, meta?: RequestMeta): Promise<{
    request: Request;
    url: URL_2;
}>;

export declare function createRequestListener<Plugins extends HTTPPluginSignatures>(mf: MiniflareCore<Plugins>): RequestListener;

export declare function createServer<Plugins extends HTTPPluginSignatures>(mf: MiniflareCore<Plugins>, options?: http.ServerOptions & https.ServerOptions): Promise<http.Server | https.Server>;

export declare const DEFAULT_PORT = 8787;

export declare function getAccessibleHosts(ipv4?: boolean): string[];

export declare interface HTTPOptions {
    host?: string;
    port?: number;
    open?: boolean | string;
    https?: boolean | string;
    httpsKey?: string;
    httpsKeyPath?: string;
    httpsCert?: string;
    httpsCertPath?: string;
    httpsCa?: string;
    httpsCaPath?: string;
    httpsPfx?: string;
    httpsPfxPath?: string;
    httpsPassphrase?: string;
    cfFetch?: boolean | string;
    metaProvider?: (req: http.IncomingMessage) => Awaitable<RequestMeta>;
    liveReload?: boolean;
}

export declare class HTTPPlugin extends Plugin<HTTPOptions> implements HTTPOptions {
    #private;
    private readonly defaults;
    host?: string;
    port?: number;
    open?: boolean | string;
    https?: boolean | string;
    httpsKey?: string;
    httpsKeyPath?: string;
    httpsCert?: string;
    httpsCertPath?: string;
    httpsCa?: string;
    httpsCaPath?: string;
    httpsPfx?: string;
    httpsPfxPath?: string;
    httpsPassphrase?: string;
    cfFetch?: boolean | string;
    metaProvider?: (req: http.IncomingMessage) => Awaitable<RequestMeta>;
    liveReload?: boolean;
    private readonly defaultCertRoot;
    private readonly defaultCfPath;
    private readonly defaultCfFetch;
    private readonly cfFetchEndpoint;
    private readonly clock;
    readonly httpsEnabled: boolean;
    constructor(ctx: PluginContext, options?: HTTPOptions, defaults?: HTTPPluginDefaults);
    getRequestMeta(req: http.IncomingMessage): Awaitable<RequestMeta>;
    get httpsOptions(): ProcessedHTTPSOptions | undefined;
    setupCf(): Promise<void>;
    setupHttps(): Promise<void>;
    setup(): Promise<SetupResult>;
}

export declare interface HTTPPluginDefaults {
    certRoot?: string;
    cfPath?: string;
    cfFetch?: boolean;
    cfFetchEndpoint?: RequestInfo;
    clock?: Clock;
}

export declare type HTTPPluginSignatures = CorePluginSignatures & {
    HTTPPlugin: typeof HTTPPlugin;
};

export declare interface ProcessedHTTPSOptions {
    key?: string;
    cert?: string;
    ca?: string;
    pfx?: string;
    passphrase?: string;
}

export declare type RequestListener = (req: http.IncomingMessage, res?: http.ServerResponse) => Promise<Response | undefined>;

export declare interface RequestMeta {
    forwardedProto?: string;
    realIp?: string;
    cf?: IncomingRequestCfProperties;
}

export declare function startServer<Plugins extends HTTPPluginSignatures>(mf: MiniflareCore<Plugins>, options?: http.ServerOptions & https.ServerOptions): Promise<http.Server | https.Server>;

export { }
