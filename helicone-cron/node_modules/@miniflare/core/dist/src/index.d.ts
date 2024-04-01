/// <reference types="node" />

import { Awaitable } from '@miniflare/shared';
import { BeforeSetupResult } from '@miniflare/shared';
import { Blob as Blob_2 } from 'buffer';
import { BodyInit } from 'undici';
import { CompatibilityFlag } from '@miniflare/shared';
import { Context } from '@miniflare/shared';
import { Dispatcher } from 'undici';
import { FormData } from 'undici';
import { Headers } from 'undici';
import { HeadersInit } from 'undici';
import http from 'http';
import { Log } from '@miniflare/shared';
import { MessageBatch } from '@miniflare/shared';
import { MiniflareError } from '@miniflare/shared';
import { MockAgent } from 'undici';
import { ModuleRule } from '@miniflare/shared';
import { Mount } from '@miniflare/shared';
import { Options } from '@miniflare/shared';
import { Plugin } from '@miniflare/shared';
import { PluginContext } from '@miniflare/shared';
import { PluginSignatures } from '@miniflare/shared';
import { ProcessedModuleRule } from '@miniflare/shared';
import { QueueBroker } from '@miniflare/queues';
import { ReadableStream } from 'stream/web';
import { Request as Request_2 } from 'undici';
import { RequestCache } from 'undici';
import { RequestCredentials } from 'undici';
import { RequestDestination } from 'undici';
import { RequestInfo as RequestInfo_2 } from 'undici';
import { RequestInit as RequestInit_2 } from 'undici';
import { RequestMode } from 'undici';
import { RequestRedirect } from 'undici';
import { Response as Response_2 } from 'undici';
import { ResponseInit as ResponseInit_2 } from 'undici';
import { ResponseRedirectStatus } from 'undici';
import { ResponseType } from 'undici';
import { ScriptRunner } from '@miniflare/shared';
import { SetupResult } from '@miniflare/shared';
import { Storage } from '@miniflare/shared';
import { StorageFactory } from '@miniflare/shared';
import { ThrowingEventTarget } from '@miniflare/shared';
import { TransformStream } from 'stream/web';
import { TransformStreamDefaultController } from 'stream/web';
import { TypedEventListener } from '@miniflare/shared';
import { TypedEventTarget } from '@miniflare/shared';
import { URL as URL_2 } from 'url';
import { UsageModel } from '@miniflare/shared';
import { webcrypto } from 'crypto';
import type { WebSocket } from '@miniflare/web-sockets';
import { WranglerConfig } from '@miniflare/shared';
import { WritableStream } from 'stream/web';

declare const AbortSignal_2: {
    new (): AbortSignal;
    prototype: AbortSignal;
};
export { AbortSignal_2 as AbortSignal }

export declare type ArrayBufferViewConstructor = typeof Int8Array | typeof Uint8Array | typeof Uint8ClampedArray | typeof Int16Array | typeof Uint16Array | typeof Int32Array | typeof Uint32Array | typeof Float32Array | typeof Float64Array | typeof DataView;

declare function atob_2(input: string): string;
export { atob_2 as atob }

export declare interface BasicImageTransformations {
    width?: number;
    height?: number;
    fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
    gravity?: "left" | "right" | "top" | "bottom" | "center" | BasicImageTransformationsGravityCoordinates;
    background?: string;
    rotate?: 0 | 90 | 180 | 270 | 360;
}

export declare interface BasicImageTransformationsGravityCoordinates {
    x: number;
    y: number;
}

export declare interface BindingsOptions {
    envPath?: boolean | string;
    envPathDefaultFallback?: boolean;
    bindings?: Record<string, any>;
    globals?: Record<string, any>;
    wasmBindings?: Record<string, string>;
    textBlobBindings?: Record<string, string>;
    dataBlobBindings?: Record<string, string>;
    serviceBindings?: ServiceBindingsOptions;
}

export declare class BindingsPlugin extends Plugin<BindingsOptions> implements BindingsOptions {
    #private;
    envPath?: boolean | string;
    [kWranglerBindings]?: Record<string, any>;
    envPathDefaultFallback?: boolean;
    bindings?: Record<string, any>;
    globals?: Record<string, any>;
    wasmBindings?: Record<string, string>;
    textBlobBindings?: Record<string, string>;
    dataBlobBindings?: Record<string, string>;
    serviceBindings?: ServiceBindingsOptions;
    constructor(ctx: PluginContext, options?: BindingsOptions);
    setup(): Promise<SetupResult>;
    beforeReload(): void;
    reload(bindings: Context, moduleExports: Context, mounts: Map<string, Mount>): void;
    dispose(): void;
}

export declare class Body<Inner extends Request_2 | Response_2> {
    #private;
    /* Excluded from this release type: [_kInner] */
    [kInputGated]: boolean;
    [kFormDataFiles]: boolean;
    [kCloned]: boolean;
    constructor(inner: Inner);
    [inspect](): Inner;
    get headers(): Headers;
    get body(): ReadableStream<Uint8Array> | null;
    get bodyUsed(): boolean;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob_2>;
    formData(): Promise<FormData>;
    json<T>(): Promise<T>;
    text(): Promise<string>;
}

export { BodyInit }

declare function btoa_2(input: string): string;
export { btoa_2 as btoa }

export declare class BuildError extends MiniflareError<number> {
}

export declare interface BuildOptions {
    buildCommand?: string;
    buildBasePath?: string;
    buildWatchPaths?: string[];
}

export declare class BuildPlugin extends Plugin<BuildOptions> implements BuildOptions {
    buildCommand?: string;
    buildBasePath?: string;
    buildWatchPaths?: string[];
    constructor(ctx: PluginContext, options?: BuildOptions);
    beforeSetup(): Awaitable<BeforeSetupResult>;
}

/* Excluded from this release type: _buildUnknownProtocolWarning */

export declare class CompressionStream extends TransformStream<Uint8Array, Uint8Array> {
    constructor(format: "gzip" | "deflate");
}

/* Excluded from this release type: _CoreMount */

export declare interface CoreOptions {
    script?: string;
    scriptPath?: string;
    rootPath?: string;
    packagePath?: boolean | string;
    wranglerConfigPath?: boolean | string;
    wranglerConfigEnv?: string;
    modules?: boolean;
    modulesRules?: ModuleRule[];
    compatibilityDate?: string;
    compatibilityFlags?: CompatibilityFlag[];
    usageModel?: "bundled" | "unbound";
    upstream?: string;
    watch?: boolean;
    debug?: boolean;
    verbose?: boolean;
    updateCheck?: boolean;
    repl?: boolean;
    mounts?: Record<string, string | CoreOptions | BindingsOptions>;
    name?: string;
    routes?: string[];
    logUnhandledRejections?: boolean;
    fetchMock?: MockAgent;
    globalAsyncIO?: boolean;
    globalTimers?: boolean;
    globalRandom?: boolean;
    actualTime?: boolean;
    inaccurateCpu?: boolean;
}

export declare class CorePlugin extends Plugin<CoreOptions> implements CoreOptions {
    #private;
    script?: string;
    scriptPath?: string;
    wranglerConfigPath?: boolean | string;
    wranglerConfigEnv?: string;
    packagePath?: boolean | string;
    modules?: boolean;
    modulesRules?: ModuleRule[];
    compatibilityDate?: string;
    compatibilityFlags?: CompatibilityFlag[];
    usageModel?: "bundled" | "unbound";
    upstream?: string;
    watch?: boolean;
    debug?: boolean;
    verbose?: boolean;
    updateCheck?: boolean;
    repl?: boolean;
    rootPath?: string;
    mounts?: Record<string, string | CoreOptions | BindingsOptions>;
    name?: string;
    routes?: string[];
    logUnhandledRejections?: boolean;
    fetchMock?: MockAgent;
    globalAsyncIO?: boolean;
    globalTimers?: boolean;
    globalRandom?: boolean;
    actualTime?: boolean;
    inaccurateCpu?: boolean;
    readonly processedModuleRules: ProcessedModuleRule[];
    readonly upstreamURL?: URL_2;
    constructor(ctx: PluginContext, options?: CoreOptions);
    setup(): Promise<SetupResult>;
}

export declare type CorePluginSignatures = PluginSignatures & {
    CorePlugin: typeof CorePlugin;
};

export declare function createCompatFetch({ log, compat, globalAsyncIO, }: Pick<PluginContext, "log" | "compat" | "globalAsyncIO">, inner?: typeof fetch): typeof fetch;

export declare function createCrypto(blockGlobalRandom?: boolean): WorkerCrypto;

export declare function createDate(actualTime?: boolean): typeof Date;

export declare function createFetchMock(): MockAgent<MockAgent.Options>;

export declare function createTimer<Return>(func: TimerFunction<Return>, blockGlobalTimers?: boolean): TimerFunction<Return>;

export declare class DecompressionStream extends TransformStream<Uint8Array, Uint8Array> {
    constructor(format: "gzip" | "deflate");
}

/* Excluded from this release type: _deepEqual */

export declare class DigestStream extends WritableStream<BufferSource> {
    readonly digest: Promise<ArrayBuffer>;
    constructor(algorithm: webcrypto.AlgorithmIdentifier);
}

export declare const DOM_EXCEPTION_NAMES: {
    IndexSizeError: number;
    DOMStringSizeError: number;
    HierarchyRequestError: number;
    WrongDocumentError: number;
    InvalidCharacterError: number;
    NoDataAllowedError: number;
    NoModificationAllowedError: number;
    NotFoundError: number;
    NotSupportedError: number;
    InUseAttributeError: number;
    InvalidStateError: number;
    SyntaxError: number;
    InvalidModificationError: number;
    NamespaceError: number;
    InvalidAccessError: number;
    ValidationError: number;
    TypeMismatchError: number;
    SecurityError: number;
    NetworkError: number;
    AbortError: number;
    URLMismatchError: number;
    QuotaExceededError: number;
    TimeoutError: number;
    InvalidNodeTypeError: number;
    DataCloneError: number;
};

export declare class DOMException extends Error {
    readonly name: keyof typeof DOM_EXCEPTION_NAMES | string;
    static readonly INDEX_SIZE_ERR = 1;
    static readonly DOMSTRING_SIZE_ERR = 2;
    static readonly HIERARCHY_REQUEST_ERR = 3;
    static readonly WRONG_DOCUMENT_ERR = 4;
    static readonly INVALID_CHARACTER_ERR = 5;
    static readonly NO_DATA_ALLOWED_ERR = 6;
    static readonly NO_MODIFICATION_ALLOWED_ERR = 7;
    static readonly NOT_FOUND_ERR = 8;
    static readonly NOT_SUPPORTED_ERR = 9;
    static readonly INUSE_ATTRIBUTE_ERR = 10;
    static readonly INVALID_STATE_ERR = 11;
    static readonly SYNTAX_ERR = 12;
    static readonly INVALID_MODIFICATION_ERR = 13;
    static readonly NAMESPACE_ERR = 14;
    static readonly INVALID_ACCESS_ERR = 15;
    static readonly VALIDATION_ERR = 16;
    static readonly TYPE_MISMATCH_ERR = 17;
    static readonly SECURITY_ERR = 18;
    static readonly NETWORK_ERR = 19;
    static readonly ABORT_ERR = 20;
    static readonly URL_MISMATCH_ERR = 21;
    static readonly QUOTA_EXCEEDED_ERR = 22;
    static readonly TIMEOUT_ERR = 23;
    static readonly INVALID_NODE_TYPE_ERR = 24;
    static readonly DATA_CLONE_ERR = 25;
    constructor(message?: string, name?: keyof typeof DOM_EXCEPTION_NAMES | string);
    get code(): number;
}

export declare class ExecutionContext {
    #private;
    constructor(event: FetchEvent | ScheduledEvent | QueueEvent);
    passThroughOnException(): void;
    waitUntil(promise: Awaitable<any>): void;
}

export declare function fetch(this: Dispatcher | void, input: RequestInfo, init?: RequestInit): Promise<Response>;

export declare class Fetcher {
    #private;
    constructor(service: string | FetcherFetch, getServiceFetch: (name: string) => Promise<FetcherFetchWithUsageModel>, defaultUsageModel?: UsageModel);
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

export declare type FetcherFetch = (request: Request) => Awaitable<Response>;

export declare interface FetcherFetchWithUsageModel {
    fetch: FetcherFetch;
    usageModel?: UsageModel;
}

export declare class FetchError extends MiniflareError<FetchErrorCode> {
}

export declare type FetchErrorCode = "ERR_RESPONSE_TYPE" | "ERR_NO_UPSTREAM" | "ERR_NO_HANDLER" | "ERR_NO_RESPONSE";

export declare class FetchEvent extends Event {
    readonly request: Request;
    [kResponse]?: Promise<Response | Response_2>;
    [kPassThrough]: boolean;
    readonly [kWaitUntil]: Promise<unknown>[];
    [kSent]: boolean;
    constructor(type: "fetch", init: {
        request: Request;
    });
    respondWith(response: Awaitable<Response | Response_2>): void;
    passThroughOnException(): void;
    waitUntil(promise: Awaitable<any>): void;
}

export declare class FixedLengthStream extends IdentityTransformStream {
    #private;
    constructor(expectedLength: number);
    [kTransformHook]: (chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) => boolean;
    [kFlushHook]: (controller: TransformStreamDefaultController<Uint8Array>) => void;
}

/* Excluded from this release type: _getBodyLength */

/* Excluded from this release type: _getURLList */
export { Headers }

/* Excluded from this release type: _headersFromIncomingRequest */
export { HeadersInit }

export declare type HRTime = [seconds: number, nanoseconds: number];

export declare class IdentityTransformStream extends TransformStream<Uint8Array, Uint8Array> {
    #private;
    [kTransformHook]?: (chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) => boolean;
    [kFlushHook]?: (controller: TransformStreamDefaultController<Uint8Array>) => void;
    constructor();
    get readable(): ReadableStream<Uint8Array>;
}

export declare interface IncomingRequestCfProperties {
    asn: number;
    botManagement?: IncomingRequestCfPropertiesBotManagement;
    city?: string;
    clientAcceptEncoding?: string;
    clientTcpRtt: number;
    clientTrustScore?: number;
    colo: string;
    continent?: string;
    country: string;
    httpProtocol: string;
    latitude?: string;
    longitude?: string;
    metroCode?: string;
    postalCode?: string;
    region?: string;
    regionCode?: string;
    requestPriority: string;
    timezone?: string;
    tlsVersion: string;
    tlsCipher: string;
    tlsClientAuth: IncomingRequestCfPropertiesTLSClientAuth;
}

export declare interface IncomingRequestCfPropertiesBotManagement {
    score: number;
    staticResource: boolean;
    verifiedBot: boolean;
}

export declare interface IncomingRequestCfPropertiesTLSClientAuth {
    certIssuerDNLegacy: string;
    certIssuerDN: string;
    certPresented: "0" | "1";
    certSubjectDNLegacy: string;
    certSubjectDN: string;
    certNotBefore: string;
    certNotAfter: string;
    certSerial: string;
    certFingerprintSHA1: string;
    certVerified: string;
}

declare const inspect: unique symbol;

/* Excluded from this release type: _isByteStream */

export declare const kAddModuleFetchListener: unique symbol;

export declare const kAddModuleQueueListener: unique symbol;

export declare const kAddModuleScheduledListener: unique symbol;

declare const kCloned: unique symbol;

export declare const kDispatchFetch: unique symbol;

export declare const kDispatchQueue: unique symbol;

export declare const kDispatchScheduled: unique symbol;

export declare const kDispose: unique symbol;

declare const kFlushHook: unique symbol;

declare const kFormDataFiles: unique symbol;

/* Excluded from this release type: _kInner */

declare const kInputGated: unique symbol;

/* Excluded from this release type: _kLoopHeader */

declare const kPassThrough: unique symbol;

declare const kResponse: unique symbol;

declare const kSent: unique symbol;

declare const kTransformHook: unique symbol;

export declare const kWaitUntil: unique symbol;

declare const kWaitUntil_2: unique symbol;

declare const kWranglerBindings: unique symbol;

export declare function logResponse(log: Log, { start, startCpu, method, url, status, waitUntil, }: {
    start: HRTime;
    startCpu?: NodeJS.CpuUsage;
    method: string;
    url: string;
    status?: number;
    waitUntil?: Promise<any[]>;
}): Promise<void>;

export declare class MiniflareCore<Plugins extends CorePluginSignatures> extends TypedEventTarget<MiniflareCoreEventMap<Plugins>> {
    #private;
    constructor(plugins: Plugins, ctx: MiniflareCoreContext, options?: MiniflareCoreOptions<Plugins>);
    get log(): Log;
    reload(): Promise<void>;
    setOptions(options: MiniflareCoreOptions<Plugins>, dispatchReloadEvent?: boolean): Promise<void>;
    getPluginStorage(name: keyof Plugins): StorageFactory;
    getPlugins(): Promise<PluginInstances<Plugins>>;
    getGlobalScope(): Promise<Context>;
    getBindings(): Promise<Context>;
    getModuleExports(): Promise<Context>;
    getMount(name: string): Promise<MiniflareCore<Plugins>>;
    dispatchFetch<WaitUntil extends any[] = unknown[]>(input: RequestInfo, init?: RequestInit): Promise<Response<WaitUntil>>;
    [kDispatchFetch]<WaitUntil extends any[] = unknown[]>(request: Request, proxy: boolean): Promise<Response<WaitUntil>>;
    dispatchScheduled<WaitUntil extends any[] = unknown[]>(scheduledTime?: number, cron?: string, url?: string | URL_2): Promise<WaitUntil>;
    dispatchQueue<WaitUntil extends any[] = unknown[]>(batch: MessageBatch): Promise<WaitUntil>;
    dispose(): Promise<void>;
}

export declare interface MiniflareCoreContext {
    log: Log;
    storageFactory: StorageFactory;
    queueBroker: QueueBroker;
    scriptRunner?: ScriptRunner;
    scriptRequired?: boolean;
    scriptRunForModuleExports?: boolean;
    isMount?: boolean;
}

export declare class MiniflareCoreError extends MiniflareError<MiniflareCoreErrorCode> {
}

export declare type MiniflareCoreErrorCode = "ERR_NO_SCRIPT" | "ERR_MOUNT_NO_NAME" | "ERR_MOUNT_NESTED" | "ERR_MOUNT" | "ERR_MOUNT_NAME_MISMATCH" | "ERR_SERVICE_NOT_MOUNTED" | "ERR_SERVICE_NO_NAME" | "ERR_SERVICE_NAME_MISMATCH" | "ERR_INVALID_UPSTREAM";

export declare type MiniflareCoreEventMap<Plugins extends PluginSignatures> = {
    reload: ReloadEvent<Plugins>;
};

export declare type MiniflareCoreOptions<Plugins extends CorePluginSignatures> = Omit<Options<Plugins>, "mounts"> & {
    mounts?: Record<string, string | Omit<Options<Plugins>, "mounts">>;
};

export declare type ModuleFetchListener = (request: Request, env: Context, ctx: ExecutionContext) => Response | Promise<Response>;

export declare type ModuleQueueListener = (batch: MessageBatch, env: Context, ctx: ExecutionContext) => any;

export declare type ModuleScheduledListener = (controller: ScheduledController, env: Context, ctx: ExecutionContext) => any;

export declare class Navigator {
    readonly userAgent = "Cloudflare-Workers";
}

export declare type PluginInstances<Plugins extends PluginSignatures> = {
    [K in keyof Plugins]: InstanceType<Plugins[K]>;
};

export declare class PluginStorageFactory implements StorageFactory {
    private readonly inner;
    private readonly defaultPersistRoot;
    private readonly pluginName;
    constructor(inner: StorageFactory, pluginName: string, defaultPersistRoot?: string);
    storage(namespace: string, persist?: boolean | string): Storage;
    dispose(): Awaitable<void>;
}

/* Excluded from this release type: _populateBuildConfig */

export declare class PromiseRejectionEvent extends Event {
    readonly promise: Promise<any>;
    readonly reason?: any;
    constructor(type: "unhandledrejection" | "rejectionhandled", init: {
        promise: Promise<any>;
        reason?: any;
    });
}

export declare class QueueEvent extends Event {
    readonly batch: MessageBatch;
    readonly [kWaitUntil]: Promise<unknown>[];
    constructor(type: "queue", init: {
        batch: MessageBatch;
    });
    waitUntil(promise: Promise<any>): void;
}

export declare class ReloadEvent<Plugins extends PluginSignatures> extends Event {
    readonly plugins: PluginInstances<Plugins>;
    readonly initial: boolean;
    constructor(type: "reload", init: {
        plugins: PluginInstances<Plugins>;
        initial: boolean;
    });
}

export declare class Request extends Body<Request_2> {
    #private;
    constructor(input: RequestInfo, init?: RequestInit);
    clone(): Request;
    get method(): string;
    get url(): string;
    get redirect(): RequestRedirect;
    get signal(): AbortSignal;
    get cf(): IncomingRequestCfProperties | RequestInitCfProperties | undefined;
    get context(): never;
    get mode(): never;
    get credentials(): never;
    get integrity(): never;
    get cache(): never;
}

export { RequestCache }

export { RequestCredentials }

export { RequestDestination }

export declare type RequestInfo = RequestInfo_2 | Request;

export declare interface RequestInit extends RequestInit_2 {
    readonly cf?: IncomingRequestCfProperties | RequestInitCfProperties;
}

export declare interface RequestInitCfProperties {
    cacheEverything?: boolean;
    cacheKey?: string;
    cacheTtl?: number;
    cacheTtlByStatus?: Record<string, number>;
    scrapeShield?: boolean;
    apps?: boolean;
    image?: RequestInitCfPropertiesImage;
    minify?: RequestInitCfPropertiesImageMinify;
    mirage?: boolean;
    resolveOverride?: string;
}

export declare interface RequestInitCfPropertiesImage extends BasicImageTransformations {
    dpr?: number;
    quality?: number;
    format?: "avif" | "webp" | "json";
    metadata?: "keep" | "copyright" | "none";
    draw?: RequestInitCfPropertiesImageDraw[];
}

export declare interface RequestInitCfPropertiesImageDraw extends BasicImageTransformations {
    url: string;
    opacity?: number;
    repeat?: true | "x" | "y";
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
}

export declare interface RequestInitCfPropertiesImageMinify {
    javascript?: boolean;
    css?: boolean;
    html?: boolean;
}

export { RequestMode }

export { RequestRedirect }

export declare class Response<WaitUntil extends any[] = unknown[]> extends Body<Response_2> {
    #private;
    static redirect(url: string | URL_2, status?: ResponseRedirectStatus): Response;
    static json(data: any, init?: ResponseInit): Response;
    [kWaitUntil_2]?: Promise<WaitUntil>;
    constructor(body?: BodyInit, init?: ResponseInit | Response | Response_2);
    clone(): Response;
    get encodeBody(): "automatic" | "manual";
    get webSocket(): WebSocket | undefined;
    waitUntil(): Promise<WaitUntil>;
    get status(): number;
    get statusText(): string;
    get ok(): boolean;
    get redirected(): boolean;
    get url(): string;
    get type(): never;
    get useFinalUrl(): never;
}

export declare interface ResponseInit extends ResponseInit_2 {
    readonly encodeBody?: "automatic" | "manual";
    readonly webSocket?: WebSocket;
}

export { ResponseRedirectStatus }

export { ResponseType }

export declare interface Route {
    target: string;
    route: string;
    protocol?: string;
    allowHostnamePrefix: boolean;
    hostname: string;
    path: string;
    allowPathSuffix: boolean;
}

export declare class Router {
    routes: Route[];
    update(allRoutes: Map<string, string[]>): void;
    match(url: URL_2): string | null;
}

export declare class RouterError extends MiniflareError<RouterErrorCode> {
}

export declare type RouterErrorCode = "ERR_QUERY_STRING" | "ERR_INFIX_WILDCARD";

export declare class ScheduledController {
    readonly scheduledTime: number;
    readonly cron: string;
    constructor(scheduledTime: number, cron: string);
}

export declare class ScheduledEvent extends Event {
    readonly scheduledTime: number;
    readonly cron: string;
    readonly [kWaitUntil]: Promise<unknown>[];
    constructor(type: "scheduled", init: {
        scheduledTime: number;
        cron: string;
    });
    waitUntil(promise: Promise<any>): void;
}

export declare class Scheduler {
    #private;
    constructor(blockGlobalTimers?: boolean);
    wait(ms?: number, options?: SchedulerWaitOptions): Promise<void>;
}

export declare interface SchedulerWaitOptions {
    signal?: AbortSignal;
}

export declare type ServiceBindingsOptions = Record<string, string | {
    service: string;
    environment?: string;
} | FetcherFetch>;

export declare class ServiceWorkerGlobalScope extends WorkerGlobalScope {
    #private;
    readonly global: this;
    readonly self: this;
    constructor(log: Log, globals: Context, bindings: Context, modules?: boolean, logUnhandledRejections?: boolean);
    addEventListener: <Type extends keyof WorkerGlobalScopeEventMap>(type: Type, listener: TypedEventListener<WorkerGlobalScopeEventMap[Type]> | null, options?: boolean | AddEventListenerOptions | undefined) => void;
    removeEventListener: <Type extends keyof WorkerGlobalScopeEventMap>(type: Type, listener: TypedEventListener<WorkerGlobalScopeEventMap[Type]> | null, options?: boolean | EventListenerOptions | undefined) => void;
    [kAddModuleFetchListener](listener: ModuleFetchListener): void;
    [kAddModuleScheduledListener](listener: ModuleScheduledListener): void;
    [kAddModuleQueueListener](listener: ModuleQueueListener): void;
    [kDispatchFetch]<WaitUntil extends any[] = unknown[]>(request: Request, proxy?: boolean): Promise<Response<WaitUntil>>;
    [kDispatchScheduled]<WaitUntil extends any[] = any[]>(scheduledTime?: number, cron?: string): Promise<WaitUntil>;
    [kDispatchQueue]<WaitUntil extends any[] = any[]>(batch: MessageBatch): Promise<WaitUntil>;
    [kDispose](): void;
}

export declare type TimerFunction<Return> = <Args extends any[]>(callback: (...args: Args) => void, ms?: number, ...args: Args) => Return;

/* Excluded from this release type: _urlFromRequestInput */

export declare function withImmutableHeaders<Body extends Request | Response>(body: Body): Body;

export declare function withInputGating<Inner extends Body<Request_2 | Response_2>>(body: Inner): Inner;

export declare function withStringFormDataFiles<Inner extends Body<Request_2 | Response_2>>(body: Inner): Inner;

export declare function withWaitUntil<WaitUntil extends any[]>(res: Response | Response_2, waitUntil: Promise<WaitUntil>): Response<WaitUntil>;

export declare type WorkerCrypto = typeof webcrypto & {
    DigestStream: typeof DigestStream;
};

export declare class WorkerGlobalScope extends ThrowingEventTarget<WorkerGlobalScopeEventMap> {
}

export declare type WorkerGlobalScopeEventMap = {
    fetch: FetchEvent;
    scheduled: ScheduledEvent;
    queue: QueueEvent;
    unhandledrejection: PromiseRejectionEvent;
    rejectionhandled: PromiseRejectionEvent;
};

export { }
