/*! *****************************************************************************
Copyright (c) Cloudflare. All rights reserved.
Copyright (c) Microsoft Corporation. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0
THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.
See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* eslint-disable */
// noinspection JSUnusedGlobalSymbols
declare class DOMException extends Error {
  constructor(message?: string, name?: string);
  readonly message: string;
  readonly name: string;
  readonly code: number;
  readonly stack: any;
  static readonly INDEX_SIZE_ERR: number;
  static readonly DOMSTRING_SIZE_ERR: number;
  static readonly HIERARCHY_REQUEST_ERR: number;
  static readonly WRONG_DOCUMENT_ERR: number;
  static readonly INVALID_CHARACTER_ERR: number;
  static readonly NO_DATA_ALLOWED_ERR: number;
  static readonly NO_MODIFICATION_ALLOWED_ERR: number;
  static readonly NOT_FOUND_ERR: number;
  static readonly NOT_SUPPORTED_ERR: number;
  static readonly INUSE_ATTRIBUTE_ERR: number;
  static readonly INVALID_STATE_ERR: number;
  static readonly SYNTAX_ERR: number;
  static readonly INVALID_MODIFICATION_ERR: number;
  static readonly NAMESPACE_ERR: number;
  static readonly INVALID_ACCESS_ERR: number;
  static readonly VALIDATION_ERR: number;
  static readonly TYPE_MISMATCH_ERR: number;
  static readonly SECURITY_ERR: number;
  static readonly NETWORK_ERR: number;
  static readonly ABORT_ERR: number;
  static readonly URL_MISMATCH_ERR: number;
  static readonly QUOTA_EXCEEDED_ERR: number;
  static readonly TIMEOUT_ERR: number;
  static readonly INVALID_NODE_TYPE_ERR: number;
  static readonly DATA_CLONE_ERR: number;
}
declare type WorkerGlobalScopeEventMap = {
  fetch: FetchEvent;
  scheduled: ScheduledEvent;
  unhandledrejection: PromiseRejectionEvent;
  rejectionhandled: PromiseRejectionEvent;
};
declare abstract class WorkerGlobalScope extends EventTarget<WorkerGlobalScopeEventMap> {
  EventTarget: typeof EventTarget;
}
declare interface Console {
  "assert"(condition?: boolean, ...data: any[]): void;
  clear(): void;
  count(label?: string): void;
  countReset(label?: string): void;
  debug(...data: any[]): void;
  dir(item?: any, options?: any): void;
  dirxml(...data: any[]): void;
  error(...data: any[]): void;
  group(...data: any[]): void;
  groupCollapsed(...data: any[]): void;
  groupEnd(): void;
  info(...data: any[]): void;
  log(...data: any[]): void;
  table(tabularData?: any, properties?: string[]): void;
  time(label?: string): void;
  timeEnd(label?: string): void;
  timeLog(label?: string, ...data: any[]): void;
  timeStamp(label?: string): void;
  trace(...data: any[]): void;
  warn(...data: any[]): void;
}
declare const console: Console;
declare type BufferSource = ArrayBufferView | ArrayBuffer;
declare namespace WebAssembly {
  class CompileError extends Error {
    constructor(message?: string);
  }
  class RuntimeError extends Error {
    constructor(message?: string);
  }
  type ValueType =
    | "anyfunc"
    | "externref"
    | "f32"
    | "f64"
    | "i32"
    | "i64"
    | "v128";
  interface GlobalDescriptor {
    value: ValueType;
    mutable?: boolean;
  }
  class Global {
    constructor(descriptor: GlobalDescriptor, value?: any);
    value: any;
    valueOf(): any;
  }
  type ImportValue = ExportValue | number;
  type ModuleImports = Record<string, ImportValue>;
  type Imports = Record<string, ModuleImports>;
  type ExportValue = Function | Global | Memory | Table;
  type Exports = Record<string, ExportValue>;
  class Instance {
    constructor(module: Module, imports?: Imports);
    readonly exports: Exports;
  }
  interface MemoryDescriptor {
    initial: number;
    maximum?: number;
    shared?: boolean;
  }
  class Memory {
    constructor(descriptor: MemoryDescriptor);
    readonly buffer: ArrayBuffer;
    grow(delta: number): number;
  }
  type ImportExportKind = "function" | "global" | "memory" | "table";
  interface ModuleExportDescriptor {
    kind: ImportExportKind;
    name: string;
  }
  interface ModuleImportDescriptor {
    kind: ImportExportKind;
    module: string;
    name: string;
  }
  abstract class Module {
    static customSections(module: Module, sectionName: string): ArrayBuffer[];
    static exports(module: Module): ModuleExportDescriptor[];
    static imports(module: Module): ModuleImportDescriptor[];
  }
  type TableKind = "anyfunc" | "externref";
  interface TableDescriptor {
    element: TableKind;
    initial: number;
    maximum?: number;
  }
  class Table {
    constructor(descriptor: TableDescriptor, value?: any);
    readonly length: number;
    get(index: number): any;
    grow(delta: number, value?: any): number;
    set(index: number, value?: any): void;
  }
  function instantiate(module: Module, imports?: Imports): Promise<Instance>;
  function validate(bytes: BufferSource): boolean;
}
/** This ServiceWorker API interface represents the global execution context of a service worker. */
declare interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
  DOMException: typeof DOMException;
  WorkerGlobalScope: typeof WorkerGlobalScope;
  btoa(data: string): string;
  atob(data: string): string;
  setTimeout(callback: (...args: any[]) => void, msDelay?: number): number;
  setTimeout<Args extends any[]>(
    callback: (...args: Args) => void,
    msDelay?: number,
    ...args: Args
  ): number;
  clearTimeout(timeoutId: number | null): void;
  setInterval(callback: (...args: any[]) => void, msDelay?: number): number;
  setInterval<Args extends any[]>(
    callback: (...args: Args) => void,
    msDelay?: number,
    ...args: Args
  ): number;
  clearInterval(timeoutId: number | null): void;
  queueMicrotask(task: Function): void;
  structuredClone<T>(value: T, options?: StructuredSerializeOptions): T;
  fetch(
    input: RequestInfo,
    init?: RequestInit<RequestInitCfProperties>
  ): Promise<Response>;
  self: ServiceWorkerGlobalScope;
  crypto: Crypto;
  caches: CacheStorage;
  scheduler: Scheduler;
  Event: typeof Event;
  ExtendableEvent: typeof ExtendableEvent;
  PromiseRejectionEvent: typeof PromiseRejectionEvent;
  FetchEvent: typeof FetchEvent;
  TraceEvent: typeof TraceEvent;
  ScheduledEvent: typeof ScheduledEvent;
  MessageEvent: typeof MessageEvent;
  CloseEvent: typeof CloseEvent;
  ReadableStreamDefaultReader: typeof ReadableStreamDefaultReader;
  ReadableStreamBYOBReader: typeof ReadableStreamBYOBReader;
  ReadableStream: typeof ReadableStream;
  WritableStream: typeof WritableStream;
  WritableStreamDefaultWriter: typeof WritableStreamDefaultWriter;
  TransformStream: typeof TransformStream;
  ByteLengthQueuingStrategy: typeof ByteLengthQueuingStrategy;
  CountQueuingStrategy: typeof CountQueuingStrategy;
  CompressionStream: typeof CompressionStream;
  DecompressionStream: typeof DecompressionStream;
  TextEncoderStream: typeof TextEncoderStream;
  TextDecoderStream: typeof TextDecoderStream;
  Headers: typeof Headers;
  Body: typeof Body;
  Request: typeof Request;
  Response: typeof Response;
  WebSocket: typeof WebSocket;
  WebSocketPair: typeof WebSocketPair;
  AbortController: typeof AbortController;
  AbortSignal: typeof AbortSignal;
  TextDecoder: typeof TextDecoder;
  TextEncoder: typeof TextEncoder;
  navigator: Navigator;
  Navigator: typeof Navigator;
  URL: typeof URL;
  URLSearchParams: typeof URLSearchParams;
  URLPattern: typeof URLPattern;
  Blob: typeof Blob;
  File: typeof File;
  FormData: typeof FormData;
  Crypto: typeof Crypto;
  SubtleCrypto: typeof SubtleCrypto;
  CryptoKey: typeof CryptoKey;
  CacheStorage: typeof CacheStorage;
  Cache: typeof Cache;
  FixedLengthStream: typeof FixedLengthStream;
  IdentityTransformStream: typeof IdentityTransformStream;
  HTMLRewriter: typeof HTMLRewriter;
}
declare function addEventListener<Type extends keyof WorkerGlobalScopeEventMap>(
  type: Type,
  handler: EventListenerOrEventListenerObject<WorkerGlobalScopeEventMap[Type]>,
  options?: EventTargetAddEventListenerOptions | boolean
): void;
declare function removeEventListener<
  Type extends keyof WorkerGlobalScopeEventMap
>(
  type: Type,
  handler: EventListenerOrEventListenerObject<WorkerGlobalScopeEventMap[Type]>,
  options?: EventTargetEventListenerOptions | boolean
): void;
/** Dispatches a synthetic event event to target and returns true if either event's cancelable attribute value is false or its preventDefault() method was not invoked, and false otherwise. */
declare function dispatchEvent(
  event: WorkerGlobalScopeEventMap[keyof WorkerGlobalScopeEventMap]
): boolean;
declare function btoa(data: string): string;
declare function atob(data: string): string;
declare function setTimeout(
  callback: (...args: any[]) => void,
  msDelay?: number
): number;
declare function setTimeout<Args extends any[]>(
  callback: (...args: Args) => void,
  msDelay?: number,
  ...args: Args
): number;
declare function clearTimeout(timeoutId: number | null): void;
declare function setInterval(
  callback: (...args: any[]) => void,
  msDelay?: number
): number;
declare function setInterval<Args extends any[]>(
  callback: (...args: Args) => void,
  msDelay?: number,
  ...args: Args
): number;
declare function clearInterval(timeoutId: number | null): void;
declare function queueMicrotask(task: Function): void;
declare function structuredClone<T>(
  value: T,
  options?: StructuredSerializeOptions
): T;
declare function fetch(
  input: RequestInfo,
  init?: RequestInit<RequestInitCfProperties>
): Promise<Response>;
declare const self: ServiceWorkerGlobalScope;
declare const crypto: Crypto;
declare const caches: CacheStorage;
declare const scheduler: Scheduler;
declare const navigator: Navigator;
declare interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}
declare type ExportedHandlerFetchHandler<Env = unknown> = (
  request: Request,
  env: Env,
  ctx: ExecutionContext
) => Response | Promise<Response>;
declare type ExportedHandlerTraceHandler<Env = unknown> = (
  traces: TraceItem[],
  env: Env,
  ctx: ExecutionContext
) => void | Promise<void>;
declare type ExportedHandlerScheduledHandler<Env = unknown> = (
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext
) => void | Promise<void>;
declare type ExportedHandlerQueueHandler<Env = unknown, Message = unknown> = (
  batch: MessageBatch<Message>,
  env: Env,
  ctx: ExecutionContext
) => void | Promise<void>;
declare interface ExportedHandler<Env = unknown, QueueMessage = unknown> {
  fetch?: ExportedHandlerFetchHandler<Env>;
  trace?: ExportedHandlerTraceHandler<Env>;
  scheduled?: ExportedHandlerScheduledHandler<Env>;
  queue?: ExportedHandlerQueueHandler<Env, QueueMessage>;
}
declare interface StructuredSerializeOptions {
  transfer?: any[];
}
declare abstract class PromiseRejectionEvent extends Event {
  readonly promise: Promise<any>;
  readonly reason: any;
}
declare abstract class Navigator {
  readonly userAgent: string;
}
declare interface DurableObject {
  fetch(request: Request): Response | Promise<Response>;
  alarm?(): void | Promise<void>;
}
declare interface DurableObjectStub extends Fetcher {
  readonly id: DurableObjectId;
  readonly name?: string;
}
declare interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
  readonly name?: string;
}
declare interface DurableObjectNamespace {
  newUniqueId(
    options?: DurableObjectNamespaceNewUniqueIdOptions
  ): DurableObjectId;
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  get(
    id: DurableObjectId,
    options?: DurableObjectNamespaceGetDurableObjectOptions
  ): DurableObjectStub;
  jurisdiction(jurisdiction: string): DurableObjectNamespace;
}
declare interface DurableObjectNamespaceNewUniqueIdOptions {
  jurisdiction?: string;
}
declare interface DurableObjectNamespaceGetDurableObjectOptions {
  locationHint?: string;
}
declare interface DurableObjectState {
  waitUntil(promise: Promise<any>): void;
  readonly id: DurableObjectId;
  readonly storage: DurableObjectStorage;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}
declare interface DurableObjectTransaction {
  get<T = unknown>(
    key: string,
    options?: DurableObjectGetOptions
  ): Promise<T | undefined>;
  get<T = unknown>(
    keys: string[],
    options?: DurableObjectGetOptions
  ): Promise<Map<string, T>>;
  list<T = unknown>(
    options?: DurableObjectListOptions
  ): Promise<Map<string, T>>;
  put<T>(
    key: string,
    value: T,
    options?: DurableObjectPutOptions
  ): Promise<void>;
  put<T>(
    entries: Record<string, T>,
    options?: DurableObjectPutOptions
  ): Promise<void>;
  delete(key: string, options?: DurableObjectPutOptions): Promise<boolean>;
  delete(keys: string[], options?: DurableObjectPutOptions): Promise<number>;
  rollback(): void;
  getAlarm(options?: DurableObjectGetAlarmOptions): Promise<number | null>;
  setAlarm(
    scheduledTime: number | Date,
    options?: DurableObjectSetAlarmOptions
  ): Promise<void>;
  deleteAlarm(options?: DurableObjectSetAlarmOptions): Promise<void>;
}
declare interface DurableObjectStorage {
  get<T = unknown>(
    key: string,
    options?: DurableObjectGetOptions
  ): Promise<T | undefined>;
  get<T = unknown>(
    keys: string[],
    options?: DurableObjectGetOptions
  ): Promise<Map<string, T>>;
  list<T = unknown>(
    options?: DurableObjectListOptions
  ): Promise<Map<string, T>>;
  put<T>(
    key: string,
    value: T,
    options?: DurableObjectPutOptions
  ): Promise<void>;
  put<T>(
    entries: Record<string, T>,
    options?: DurableObjectPutOptions
  ): Promise<void>;
  delete(key: string, options?: DurableObjectPutOptions): Promise<boolean>;
  delete(keys: string[], options?: DurableObjectPutOptions): Promise<number>;
  deleteAll(options?: DurableObjectPutOptions): Promise<void>;
  transaction<T>(
    closure: (txn: DurableObjectTransaction) => Promise<T>
  ): Promise<T>;
  getAlarm(options?: DurableObjectGetAlarmOptions): Promise<number | null>;
  setAlarm(
    scheduledTime: number | Date,
    options?: DurableObjectSetAlarmOptions
  ): Promise<void>;
  deleteAlarm(options?: DurableObjectSetAlarmOptions): Promise<void>;
  sync(): Promise<void>;
}
declare interface DurableObjectListOptions {
  start?: string;
  startAfter?: string;
  end?: string;
  prefix?: string;
  reverse?: boolean;
  limit?: number;
  allowConcurrency?: boolean;
  noCache?: boolean;
}
declare interface DurableObjectGetOptions {
  allowConcurrency?: boolean;
  noCache?: boolean;
}
declare interface DurableObjectGetAlarmOptions {
  allowConcurrency?: boolean;
}
declare interface DurableObjectPutOptions {
  allowConcurrency?: boolean;
  allowUnconfirmed?: boolean;
  noCache?: boolean;
}
declare interface DurableObjectSetAlarmOptions {
  allowConcurrency?: boolean;
  allowUnconfirmed?: boolean;
}
declare interface AnalyticsEngineDataset {
  writeDataPoint(event?: AnalyticsEngineDataPoint): void;
}
declare interface AnalyticsEngineDataPoint {
  indexes?: ((ArrayBuffer | string) | null)[];
  doubles?: number[];
  blobs?: ((ArrayBuffer | string) | null)[];
}
declare class Event {
  constructor(type: string, init?: EventInit);
  get type(): string;
  get eventPhase(): number;
  get composed(): boolean;
  get bubbles(): boolean;
  get cancelable(): boolean;
  get defaultPrevented(): boolean;
  get returnValue(): boolean;
  get currentTarget(): EventTarget | undefined;
  get srcElement(): EventTarget | undefined;
  get timeStamp(): number;
  get isTrusted(): boolean;
  get cancelBubble(): boolean;
  set cancelBubble(value: boolean);
  stopImmediatePropagation(): void;
  preventDefault(): void;
  stopPropagation(): void;
  composedPath(): EventTarget[];
  static readonly NONE: number;
  static readonly CAPTURING_PHASE: number;
  static readonly AT_TARGET: number;
  static readonly BUBBLING_PHASE: number;
}
declare interface EventInit {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
}
declare type EventListener<EventType extends Event = Event> = (
  event: EventType
) => void;
declare interface EventListenerObject<EventType extends Event = Event> {
  handleEvent(event: EventType): void;
}
declare type EventListenerOrEventListenerObject<
  EventType extends Event = Event
> = EventListener<EventType> | EventListenerObject<EventType>;
declare class EventTarget<
  EventMap extends Record<string, Event> = Record<string, Event>
> {
  constructor();
  addEventListener<Type extends keyof EventMap>(
    type: Type,
    handler: EventListenerOrEventListenerObject<EventMap[Type]>,
    options?: EventTargetAddEventListenerOptions | boolean
  ): void;
  removeEventListener<Type extends keyof EventMap>(
    type: Type,
    handler: EventListenerOrEventListenerObject<EventMap[Type]>,
    options?: EventTargetEventListenerOptions | boolean
  ): void;
  dispatchEvent(event: EventMap[keyof EventMap]): boolean;
}
declare interface EventTargetEventListenerOptions {
  capture?: boolean;
}
declare interface EventTargetAddEventListenerOptions {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
  signal?: AbortSignal;
}
declare interface EventTargetHandlerObject {
  handleEvent: (event: Event) => any | undefined;
}
declare class AbortController {
  constructor();
  get signal(): AbortSignal;
  abort(reason?: any): void;
}
declare abstract class AbortSignal extends EventTarget {
  static abort(reason?: any): AbortSignal;
  static timeout(delay: number): AbortSignal;
  get aborted(): boolean;
  get reason(): any;
  throwIfAborted(): void;
}
declare interface Scheduler {
  wait(delay: number, maybeOptions?: SchedulerWaitOptions): Promise<void>;
}
declare interface SchedulerWaitOptions {
  signal?: AbortSignal;
}
declare abstract class ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}
declare class Blob {
  constructor(
    bits?: ((ArrayBuffer | ArrayBufferView) | string | Blob)[],
    options?: BlobOptions
  );
  get size(): number;
  get type(): string;
  slice(start?: number, end?: number, type?: string): Blob;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  stream(): ReadableStream;
}
declare interface BlobOptions {
  type?: string;
}
declare class File extends Blob {
  constructor(
    bits: ((ArrayBuffer | ArrayBufferView) | string | Blob)[] | undefined,
    name: string,
    options?: FileOptions
  );
  get name(): string;
  get lastModified(): number;
}
declare interface FileOptions {
  type?: string;
  lastModified?: number;
}
declare abstract class CacheStorage {
  open(cacheName: string): Promise<Cache>;
  readonly default: Cache;
}
declare abstract class Cache {
  delete(request: RequestInfo, options?: CacheQueryOptions): Promise<boolean>;
  match(
    request: RequestInfo,
    options?: CacheQueryOptions
  ): Promise<Response | undefined>;
  put(request: RequestInfo, response: Response): Promise<void>;
}
declare interface CacheQueryOptions {
  ignoreMethod?: boolean;
}
declare abstract class Crypto {
  get subtle(): SubtleCrypto;
  getRandomValues<
    T extends
      | Int8Array
      | Uint8Array
      | Int16Array
      | Uint16Array
      | Int32Array
      | Uint32Array
      | BigInt64Array
      | BigUint64Array
  >(buffer: T): T;
  randomUUID(): string;
  DigestStream: typeof DigestStream;
}
declare abstract class SubtleCrypto {
  encrypt(
    algorithm: string | SubtleCryptoEncryptAlgorithm,
    key: CryptoKey,
    plainText: ArrayBuffer | ArrayBufferView
  ): Promise<ArrayBuffer>;
  decrypt(
    algorithm: string | SubtleCryptoEncryptAlgorithm,
    key: CryptoKey,
    cipherText: ArrayBuffer | ArrayBufferView
  ): Promise<ArrayBuffer>;
  sign(
    algorithm: string | SubtleCryptoSignAlgorithm,
    key: CryptoKey,
    data: ArrayBuffer | ArrayBufferView
  ): Promise<ArrayBuffer>;
  verify(
    algorithm: string | SubtleCryptoSignAlgorithm,
    key: CryptoKey,
    signature: ArrayBuffer | ArrayBufferView,
    data: ArrayBuffer | ArrayBufferView
  ): Promise<boolean>;
  digest(
    algorithm: string | SubtleCryptoHashAlgorithm,
    data: ArrayBuffer | ArrayBufferView
  ): Promise<ArrayBuffer>;
  generateKey(
    algorithm: string | SubtleCryptoGenerateKeyAlgorithm,
    extractable: boolean,
    keyUsages: string[]
  ): Promise<CryptoKey | CryptoKeyPair>;
  deriveKey(
    algorithm: string | SubtleCryptoDeriveKeyAlgorithm,
    baseKey: CryptoKey,
    derivedKeyAlgorithm: string | SubtleCryptoImportKeyAlgorithm,
    extractable: boolean,
    keyUsages: string[]
  ): Promise<CryptoKey>;
  deriveBits(
    algorithm: string | SubtleCryptoDeriveKeyAlgorithm,
    baseKey: CryptoKey,
    length: number | null
  ): Promise<ArrayBuffer>;
  importKey(
    format: string,
    keyData: (ArrayBuffer | ArrayBufferView) | JsonWebKey,
    algorithm: string | SubtleCryptoImportKeyAlgorithm,
    extractable: boolean,
    keyUsages: string[]
  ): Promise<CryptoKey>;
  exportKey(format: string, key: CryptoKey): Promise<ArrayBuffer | JsonWebKey>;
  wrapKey(
    format: string,
    key: CryptoKey,
    wrappingKey: CryptoKey,
    wrapAlgorithm: string | SubtleCryptoEncryptAlgorithm
  ): Promise<ArrayBuffer>;
  unwrapKey(
    format: string,
    wrappedKey: ArrayBuffer | ArrayBufferView,
    unwrappingKey: CryptoKey,
    unwrapAlgorithm: string | SubtleCryptoEncryptAlgorithm,
    unwrappedKeyAlgorithm: string | SubtleCryptoImportKeyAlgorithm,
    extractable: boolean,
    keyUsages: string[]
  ): Promise<CryptoKey>;
  timingSafeEqual(
    a: ArrayBuffer | ArrayBufferView,
    b: ArrayBuffer | ArrayBufferView
  ): boolean;
}
declare abstract class CryptoKey {
  readonly type: string;
  readonly extractable: boolean;
  readonly algorithm:
    | CryptoKeyKeyAlgorithm
    | CryptoKeyAesKeyAlgorithm
    | CryptoKeyHmacKeyAlgorithm
    | CryptoKeyRsaKeyAlgorithm
    | CryptoKeyEllipticKeyAlgorithm
    | CryptoKeyArbitraryKeyAlgorithm;
  readonly usages: string[];
}
declare interface CryptoKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}
declare interface JsonWebKey {
  kty: string;
  use?: string;
  key_ops?: string[];
  alg?: string;
  ext?: boolean;
  crv?: string;
  x?: string;
  y?: string;
  d?: string;
  n?: string;
  e?: string;
  p?: string;
  q?: string;
  dp?: string;
  dq?: string;
  qi?: string;
  oth?: RsaOtherPrimesInfo[];
  k?: string;
}
declare interface RsaOtherPrimesInfo {
  r?: string;
  d?: string;
  t?: string;
}
declare interface SubtleCryptoDeriveKeyAlgorithm {
  name: string;
  salt?: ArrayBuffer;
  iterations?: number;
  hash?: string | SubtleCryptoHashAlgorithm;
  $public?: CryptoKey;
  info?: ArrayBuffer;
}
declare interface SubtleCryptoEncryptAlgorithm {
  name: string;
  iv?: ArrayBuffer;
  additionalData?: ArrayBuffer;
  tagLength?: number;
  counter?: ArrayBuffer;
  length?: number;
  label?: ArrayBuffer;
}
declare interface SubtleCryptoGenerateKeyAlgorithm {
  name: string;
  hash?: string | SubtleCryptoHashAlgorithm;
  modulusLength?: number;
  publicExponent?: ArrayBuffer;
  length?: number;
  namedCurve?: string;
}
declare interface SubtleCryptoHashAlgorithm {
  name: string;
}
declare interface SubtleCryptoImportKeyAlgorithm {
  name: string;
  hash?: string | SubtleCryptoHashAlgorithm;
  length?: number;
  namedCurve?: string;
  compressed?: boolean;
}
declare interface SubtleCryptoSignAlgorithm {
  name: string;
  hash?: string | SubtleCryptoHashAlgorithm;
  dataLength?: number;
  saltLength?: number;
}
declare interface CryptoKeyKeyAlgorithm {
  name: string;
}
declare interface CryptoKeyAesKeyAlgorithm {
  name: string;
  length: number;
}
declare interface CryptoKeyHmacKeyAlgorithm {
  name: string;
  hash: CryptoKeyKeyAlgorithm;
  length: number;
}
declare interface CryptoKeyRsaKeyAlgorithm {
  name: string;
  modulusLength: number;
  publicExponent: ArrayBuffer;
  hash?: CryptoKeyKeyAlgorithm;
}
declare interface CryptoKeyEllipticKeyAlgorithm {
  name: string;
  namedCurve: string;
}
declare interface CryptoKeyArbitraryKeyAlgorithm {
  name: string;
  hash?: CryptoKeyKeyAlgorithm;
  namedCurve?: string;
  length?: number;
}
declare class DigestStream extends WritableStream<
  ArrayBuffer | ArrayBufferView
> {
  constructor(algorithm: string | SubtleCryptoHashAlgorithm);
  get digest(): Promise<ArrayBuffer>;
}
declare class TextDecoder {
  constructor(decoder?: string, options?: TextDecoderConstructorOptions);
  decode(
    input?: ArrayBuffer | ArrayBufferView,
    options?: TextDecoderDecodeOptions
  ): string;
  get encoding(): string;
  get fatal(): boolean;
  get ignoreBOM(): boolean;
}
declare class TextEncoder {
  constructor();
  encode(input?: string): Uint8Array;
  encodeInto(input: string, buffer: Uint8Array): TextEncoderEncodeIntoResult;
  get encoding(): string;
}
declare interface TextDecoderConstructorOptions {
  fatal: boolean;
  ignoreBOM: boolean;
}
declare interface TextDecoderDecodeOptions {
  stream: boolean;
}
declare interface TextEncoderEncodeIntoResult {
  read: number;
  written: number;
}
declare class FormData {
  constructor();
  append(name: string, value: string): void;
  append(name: string, value: Blob, filename?: string): void;
  delete(name: string): void;
  get(name: string): (File | string) | null;
  getAll(name: string): (File | string)[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  set(name: string, value: Blob, filename?: string): void;
  entries(): IterableIterator<[key: string, value: File | string]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<File | string>;
  forEach<This = unknown>(
    callback: (
      this: This,
      value: File | string,
      key: string,
      parent: FormData
    ) => void,
    thisArg?: This
  ): void;
  [Symbol.iterator](): IterableIterator<[key: string, value: File | string]>;
}
declare interface ContentOptions {
  html?: boolean;
}
declare class HTMLRewriter {
  constructor();
  on(
    selector: string,
    handlers: HTMLRewriterElementContentHandlers
  ): HTMLRewriter;
  onDocument(handlers: HTMLRewriterDocumentContentHandlers): HTMLRewriter;
  transform(response: Response): Response;
}
declare interface HTMLRewriterElementContentHandlers {
  element?(element: Element): void | Promise<void>;
  comments?(comment: Comment): void | Promise<void>;
  text?(element: Text): void | Promise<void>;
}
declare interface HTMLRewriterDocumentContentHandlers {
  doctype?(doctype: Doctype): void | Promise<void>;
  comments?(comment: Comment): void | Promise<void>;
  text?(text: Text): void | Promise<void>;
  end?(end: DocumentEnd): void | Promise<void>;
}
declare interface Doctype {
  readonly name: string | null;
  readonly publicId: string | null;
  readonly systemId: string | null;
}
declare interface Element {
  tagName: string;
  readonly attributes: IterableIterator<string[]>;
  readonly removed: boolean;
  readonly namespaceURI: string;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  setAttribute(name: string, value: string): Element;
  removeAttribute(name: string): Element;
  before(content: string, options?: ContentOptions): Element;
  after(content: string, options?: ContentOptions): Element;
  prepend(content: string, options?: ContentOptions): Element;
  append(content: string, options?: ContentOptions): Element;
  replace(content: string, options?: ContentOptions): Element;
  remove(): Element;
  removeAndKeepContent(): Element;
  setInnerContent(content: string, options?: ContentOptions): Element;
  onEndTag(handler: (tag: EndTag) => void | Promise<void>): void;
}
declare interface EndTag {
  name: string;
  before(content: string, options?: ContentOptions): EndTag;
  after(content: string, options?: ContentOptions): EndTag;
  remove(): EndTag;
}
declare interface Comment {
  text: string;
  readonly removed: boolean;
  before(content: string, options?: ContentOptions): Comment;
  after(content: string, options?: ContentOptions): Comment;
  replace(content: string, options?: ContentOptions): Comment;
  remove(): Comment;
}
declare interface Text {
  readonly text: string;
  readonly lastInTextNode: boolean;
  readonly removed: boolean;
  before(content: string, options?: ContentOptions): Text;
  after(content: string, options?: ContentOptions): Text;
  replace(content: string, options?: ContentOptions): Text;
  remove(): Text;
}
declare interface DocumentEnd {
  append(content: string, options?: ContentOptions): DocumentEnd;
}
declare abstract class FetchEvent extends ExtendableEvent {
  readonly request: Request;
  respondWith(promise: Response | Promise<Response>): void;
  passThroughOnException(): void;
}
declare type HeadersInit =
  | Headers
  | Iterable<Iterable<string>>
  | Record<string, string>;
declare class Headers {
  constructor(init?: HeadersInit);
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  append(name: string, value: string): void;
  delete(name: string): void;
  forEach<This = unknown>(
    callback: (this: This, value: string, key: string, parent: Headers) => void,
    thisArg?: This
  ): void;
  entries(): IterableIterator<[key: string, value: string]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  [Symbol.iterator](): IterableIterator<[key: string, value: string]>;
}
declare type BodyInit =
  | ReadableStream<Uint8Array>
  | string
  | ArrayBuffer
  | ArrayBufferView
  | Blob
  | URLSearchParams
  | FormData;
declare abstract class Body {
  get body(): ReadableStream | null;
  get bodyUsed(): boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T>(): Promise<T>;
  formData(): Promise<FormData>;
  blob(): Promise<Blob>;
}
declare class Response extends Body {
  constructor(body?: BodyInit | null, init?: ResponseInit);
  static redirect(url: string, status?: number): Response;
  static json(any: any, maybeInit?: ResponseInit | Response): Response;
  clone(): Response;
  get status(): number;
  get statusText(): string;
  get headers(): Headers;
  get ok(): boolean;
  get redirected(): boolean;
  get url(): string;
  get webSocket(): WebSocket | null;
  get cf(): any | undefined;
}
declare interface ResponseInit {
  status?: number;
  statusText?: string;
  headers?: HeadersInit;
  cf?: any;
  webSocket?: WebSocket | null;
  encodeBody?: "automatic" | "manual";
}
declare type RequestInfo = Request | string | URL;
declare class Request<CfHostMetadata = unknown> extends Body {
  constructor(input: RequestInfo, init?: RequestInit);
  clone(): Request<CfHostMetadata>;
  get method(): string;
  get url(): string;
  get headers(): Headers;
  get redirect(): string;
  get fetcher(): Fetcher | null;
  get signal(): AbortSignal;
  get cf(): IncomingRequestCfProperties<CfHostMetadata> | undefined;
}
declare interface RequestInit<
  CfType = IncomingRequestCfProperties | RequestInitCfProperties
> {
  /** A string to set request's method. */
  method?: string;
  /** A Headers object, an object literal, or an array of two-item arrays to set request's headers. */
  headers?: HeadersInit;
  /** A BodyInit object or null to set request's body. */
  body?: BodyInit | null;
  /** A string indicating whether request follows redirects, results in an error upon encountering a redirect, or returns the redirect (in an opaque fashion). Sets request's redirect. */
  redirect?: string;
  fetcher?: Fetcher | null;
  cf?: CfType;
  /** An AbortSignal to set request's signal. */
  signal?: AbortSignal | null;
}
declare abstract class Fetcher {
  fetch(
    input: RequestInfo,
    init?: RequestInit<RequestInitCfProperties>
  ): Promise<Response>;
}
declare interface FetcherPutOptions {
  expiration?: number;
  expirationTtl?: number;
}
declare interface KVNamespaceListKey<Metadata, Key extends string = string> {
  name: Key;
  expiration?: number;
  metadata?: Metadata;
}
declare type KVNamespaceListResult<Metadata, Key extends string = string> =
  | {
      list_complete: false;
      keys: KVNamespaceListKey<Metadata, Key>[];
      cursor: string;
    }
  | {
      list_complete: true;
      keys: KVNamespaceListKey<Metadata, Key>[];
    };
declare interface KVNamespace<Key extends string = string> {
  get(
    key: Key,
    options?: Partial<KVNamespaceGetOptions<undefined>>
  ): Promise<string | null>;
  get(key: Key, type: "text"): Promise<string | null>;
  get<ExpectedValue = unknown>(
    key: Key,
    type: "json"
  ): Promise<ExpectedValue | null>;
  get(key: Key, type: "arrayBuffer"): Promise<ArrayBuffer | null>;
  get(key: Key, type: "stream"): Promise<ReadableStream | null>;
  get(
    key: Key,
    options?: KVNamespaceGetOptions<"text">
  ): Promise<string | null>;
  get<ExpectedValue = unknown>(
    key: Key,
    options?: KVNamespaceGetOptions<"json">
  ): Promise<ExpectedValue | null>;
  get(
    key: Key,
    options?: KVNamespaceGetOptions<"arrayBuffer">
  ): Promise<string | null>;
  get(
    key: Key,
    options?: KVNamespaceGetOptions<"stream">
  ): Promise<string | null>;
  list<Metadata = unknown>(
    options?: KVNamespaceListOptions
  ): Promise<KVNamespaceListResult<Metadata, Key>>;
  put(
    key: Key,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: KVNamespacePutOptions
  ): Promise<void>;
  getWithMetadata<Metadata = unknown>(
    key: Key,
    options?: Partial<KVNamespaceGetOptions<undefined>>
  ): Promise<KVNamespaceGetWithMetadataResult<string, Metadata>>;
  getWithMetadata<Metadata = unknown>(
    key: Key,
    type: "text"
  ): Promise<KVNamespaceGetWithMetadataResult<string, Metadata>>;
  getWithMetadata<ExpectedValue = unknown, Metadata = unknown>(
    key: Key,
    type: "json"
  ): Promise<KVNamespaceGetWithMetadataResult<ExpectedValue, Metadata>>;
  getWithMetadata<Metadata = unknown>(
    key: Key,
    type: "arrayBuffer"
  ): Promise<KVNamespaceGetWithMetadataResult<ArrayBuffer, Metadata>>;
  getWithMetadata<Metadata = unknown>(
    key: Key,
    type: "stream"
  ): Promise<KVNamespaceGetWithMetadataResult<ReadableStream, Metadata>>;
  getWithMetadata<Metadata = unknown>(
    key: Key,
    options: KVNamespaceGetOptions<"text">
  ): Promise<KVNamespaceGetWithMetadataResult<string, Metadata>>;
  getWithMetadata<ExpectedValue = unknown, Metadata = unknown>(
    key: Key,
    options: KVNamespaceGetOptions<"json">
  ): Promise<KVNamespaceGetWithMetadataResult<ExpectedValue, Metadata>>;
  getWithMetadata<Metadata = unknown>(
    key: Key,
    options: KVNamespaceGetOptions<"arrayBuffer">
  ): Promise<KVNamespaceGetWithMetadataResult<ArrayBuffer, Metadata>>;
  getWithMetadata<Metadata = unknown>(
    key: Key,
    options: KVNamespaceGetOptions<"stream">
  ): Promise<KVNamespaceGetWithMetadataResult<ReadableStream, Metadata>>;
  delete(key: Key): Promise<void>;
}
declare interface KVNamespaceListOptions {
  limit?: number;
  prefix?: string | null;
  cursor?: string | null;
}
declare interface KVNamespaceGetOptions<Type> {
  type: Type;
  cacheTtl?: number;
}
declare interface KVNamespacePutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: any | null;
}
declare interface KVNamespaceGetWithMetadataResult<Value, Metadata> {
  value: Value | null;
  metadata: Metadata | null;
}
declare interface R2Error extends Error {
  readonly name: string;
  readonly code: number;
  readonly message: string;
  readonly action: string;
  readonly stack: any;
}
declare interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
  startAfter?: string;
  include?: ("httpMetadata" | "customMetadata")[];
}
declare abstract class R2Bucket {
  head(key: string): Promise<R2Object | null>;
  get(
    key: string,
    options: R2GetOptions & {
      onlyIf: R2Conditional | Headers;
    }
  ): Promise<R2ObjectBody | R2Object | null>;
  get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value:
      | ReadableStream
      | ArrayBuffer
      | ArrayBufferView
      | string
      | null
      | Blob,
    options?: R2PutOptions
  ): Promise<R2Object>;
  put(
    key: string,
    value:
      | ReadableStream
      | ArrayBuffer
      | ArrayBufferView
      | string
      | null
      | Blob,
    options?: R2PutOptions & {
      onlyIf: R2Conditional | Headers;
    }
  ): Promise<R2Object | null>;
  createMultipartUpload(
    key: string,
    options?: R2MultipartOptions
  ): Promise<R2MultipartUpload>;
  resumeMultipartUpload(key: string, uploadId: string): R2MultipartUpload;
  delete(keys: string | string[]): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}
declare interface R2MultipartUpload {
  readonly key: string;
  readonly uploadId: string;
  uploadPart(
    partNumber: number,
    value: ReadableStream | (ArrayBuffer | ArrayBufferView) | string | Blob
  ): Promise<R2UploadedPart>;
  abort(): Promise<void>;
  complete(uploadedParts: R2UploadedPart[]): Promise<R2Object>;
}
declare interface R2UploadedPart {
  partNumber: number;
  etag: string;
}
declare abstract class R2Object {
  readonly key: string;
  readonly version: string;
  readonly size: number;
  readonly etag: string;
  readonly httpEtag: string;
  readonly checksums: R2Checksums;
  readonly uploaded: Date;
  readonly httpMetadata?: R2HTTPMetadata;
  readonly customMetadata?: Record<string, string>;
  readonly range?: R2Range;
  writeHttpMetadata(headers: Headers): void;
}
declare interface R2ObjectBody extends R2Object {
  get body(): ReadableStream;
  get bodyUsed(): boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T>(): Promise<T>;
  blob(): Promise<Blob>;
}
declare type R2Range =
  | {
      offset: number;
      length?: number;
    }
  | {
      offset?: number;
      length: number;
    }
  | {
      suffix: number;
    };
declare interface R2Conditional {
  etagMatches?: string;
  etagDoesNotMatch?: string;
  uploadedBefore?: Date;
  uploadedAfter?: Date;
  secondsGranularity?: boolean;
}
declare interface R2GetOptions {
  onlyIf?: R2Conditional | Headers;
  range?: R2Range | Headers;
}
declare interface R2PutOptions {
  onlyIf?: R2Conditional | Headers;
  httpMetadata?: R2HTTPMetadata | Headers;
  customMetadata?: Record<string, string>;
  md5?: ArrayBuffer | string;
  sha1?: ArrayBuffer | string;
  sha256?: ArrayBuffer | string;
  sha384?: ArrayBuffer | string;
  sha512?: ArrayBuffer | string;
}
declare interface R2MultipartOptions {
  httpMetadata?: R2HTTPMetadata | Headers;
  customMetadata?: Record<string, string>;
}
declare interface R2Checksums {
  readonly md5?: ArrayBuffer;
  readonly sha1?: ArrayBuffer;
  readonly sha256?: ArrayBuffer;
  readonly sha384?: ArrayBuffer;
  readonly sha512?: ArrayBuffer;
  toJSON(): R2StringChecksums;
}
declare interface R2StringChecksums {
  md5?: string;
  sha1?: string;
  sha256?: string;
  sha384?: string;
  sha512?: string;
}
declare interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}
declare interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}
declare abstract class ScheduledEvent extends ExtendableEvent {
  readonly scheduledTime: number;
  readonly cron: string;
  noRetry(): void;
}
declare interface ScheduledController {
  readonly scheduledTime: number;
  readonly cron: string;
  noRetry(): void;
}
declare interface QueuingStrategy<T = any> {
  highWaterMark?: number | bigint;
  size?: (chunk: T) => number | bigint;
}
declare interface UnderlyingSink<W = any> {
  type?: string;
  start?: (controller: WritableStreamDefaultController) => void | Promise<void>;
  write?: (
    chunk: W,
    controller: WritableStreamDefaultController
  ) => void | Promise<void>;
  abort?: (reason: any) => void | Promise<void>;
  close?: () => void | Promise<void>;
}
declare interface UnderlyingByteSource {
  type: "bytes";
  autoAllocateChunkSize?: number;
  start?: (controller: ReadableByteStreamController) => void | Promise<void>;
  pull?: (controller: ReadableByteStreamController) => void | Promise<void>;
  cancel?: (reason: any) => void | Promise<void>;
}
declare interface UnderlyingSource<R = any> {
  type?: "" | undefined;
  start?: (
    controller: ReadableStreamDefaultController<R>
  ) => void | Promise<void>;
  pull?: (
    controller: ReadableStreamDefaultController<R>
  ) => void | Promise<void>;
  cancel?: (reason: any) => void | Promise<void>;
}
declare interface Transformer<I = any, O = any> {
  readableType?: string;
  writableType?: string;
  start?: (
    controller: TransformStreamDefaultController<O>
  ) => void | Promise<void>;
  transform?: (
    chunk: I,
    controller: TransformStreamDefaultController<O>
  ) => void | Promise<void>;
  flush?: (
    controller: TransformStreamDefaultController<O>
  ) => void | Promise<void>;
}
declare interface StreamPipeOptions {
  /**
   * Pipes this readable stream to a given writable stream destination. The way in which the piping process behaves under various error conditions can be customized with a number of passed options. It returns a promise that fulfills when the piping process completes successfully, or rejects if any errors were encountered.
   *
   * Piping a stream will lock it for the duration of the pipe, preventing any other consumer from acquiring a reader.
   *
   * Errors and closures of the source and destination streams propagate as follows:
   *
   * An error in this source readable stream will abort destination, unless preventAbort is truthy. The returned promise will be rejected with the source's error, or with any error that occurs during aborting the destination.
   *
   * An error in destination will cancel this source readable stream, unless preventCancel is truthy. The returned promise will be rejected with the destination's error, or with any error that occurs during canceling the source.
   *
   * When this source readable stream closes, destination will be closed, unless preventClose is truthy. The returned promise will be fulfilled once this process completes, unless an error is encountered while closing the destination, in which case it will be rejected with that error.
   *
   * If destination starts out closed or closing, this source readable stream will be canceled, unless preventCancel is true. The returned promise will be rejected with an error indicating piping to a closed stream failed, or with any error that occurs during canceling the source.
   *
   * The signal option can be set to an AbortSignal to allow aborting an ongoing pipe operation via the corresponding AbortController. In this case, this source readable stream will be canceled, and destination aborted, unless the respective options preventCancel or preventAbort are set.
   */
  preventClose?: boolean;
  preventAbort?: boolean;
  preventCancel?: boolean;
  signal?: AbortSignal;
}
declare type ReadableStreamReadResult<R = any> =
  | {
      done: false;
      value: R;
    }
  | {
      done: true;
      value?: undefined;
    };
/** This Streams API interface represents a readable stream of byte data. The Fetch API offers a concrete instance of a ReadableStream through the body property of a Response object. */
declare interface ReadableStream<R = any> {
  get locked(): boolean;
  cancel(reason?: any): Promise<void>;
  getReader(): ReadableStreamDefaultReader<R>;
  getReader(options: ReadableStreamGetReaderOptions): ReadableStreamBYOBReader;
  pipeThrough<T>(
    transform: ReadableWritablePair<T, R>,
    options?: StreamPipeOptions
  ): ReadableStream<T>;
  pipeTo(
    destination: WritableStream<R>,
    options?: StreamPipeOptions
  ): Promise<void>;
  tee(): [ReadableStream<R>, ReadableStream<R>];
  values(options?: ReadableStreamValuesOptions): AsyncIterableIterator<R>;
  [Symbol.asyncIterator](
    options?: ReadableStreamValuesOptions
  ): AsyncIterableIterator<R>;
}
declare const ReadableStream: {
  prototype: ReadableStream;
  new (
    underlyingSource: UnderlyingByteSource,
    strategy?: QueuingStrategy<Uint8Array>
  ): ReadableStream<Uint8Array>;
  new <R = any>(
    underlyingSource?: UnderlyingSource<R>,
    strategy?: QueuingStrategy<R>
  ): ReadableStream<R>;
};
declare class ReadableStreamDefaultReader<R = any> {
  constructor(stream: ReadableStream);
  get closed(): Promise<void>;
  cancel(reason?: any): Promise<void>;
  read(): Promise<ReadableStreamReadResult<R>>;
  releaseLock(): void;
}
declare class ReadableStreamBYOBReader {
  constructor(stream: ReadableStream);
  get closed(): Promise<void>;
  cancel(reason?: any): Promise<void>;
  read<T extends ArrayBufferView>(
    view: T
  ): Promise<ReadableStreamReadResult<T>>;
  releaseLock(): void;
  readAtLeast<T extends ArrayBufferView>(
    minElements: number,
    view: T
  ): Promise<ReadableStreamReadResult<T>>;
}
declare interface ReadableStreamGetReaderOptions {
  mode: "byob";
}
declare interface ReadableStreamBYOBRequest {
  readonly view: Uint8Array | null;
  respond(bytesWritten: number): void;
  respondWithNewView(view: ArrayBuffer | ArrayBufferView): void;
  readonly atLeast: number | null;
}
declare interface ReadableStreamDefaultController<R = any> {
  readonly desiredSize: number | null;
  close(): void;
  enqueue(chunk?: R): void;
  error(reason: any): void;
}
declare interface ReadableByteStreamController {
  readonly byobRequest: ReadableStreamBYOBRequest | null;
  readonly desiredSize: number | null;
  close(): void;
  enqueue(chunk: ArrayBuffer | ArrayBufferView): void;
  error(reason: any): void;
}
/** This Streams API interface represents a controller allowing control of a WritableStream's state. When constructing a WritableStream, the underlying sink is given a corresponding WritableStreamDefaultController instance to manipulate. */
declare interface WritableStreamDefaultController {
  readonly signal: AbortSignal;
  error(reason?: any): void;
}
declare interface TransformStreamDefaultController<O = any> {
  get desiredSize(): number | null;
  enqueue(chunk?: O): void;
  error(reason: any): void;
  terminate(): void;
}
declare interface ReadableWritablePair<R = any, W = any> {
  /**
   * Provides a convenient, chainable way of piping this readable stream through a transform stream (or any other { writable, readable } pair). It simply pipes the stream into the writable side of the supplied pair, and returns the readable side for further use.
   *
   * Piping a stream will lock it for the duration of the pipe, preventing any other consumer from acquiring a reader.
   */
  writable: WritableStream<W>;
  readable: ReadableStream<R>;
}
declare class WritableStream<W = any> {
  constructor(
    underlyingSink?: UnderlyingSink,
    queuingStrategy?: QueuingStrategy
  );
  get locked(): boolean;
  abort(reason?: any): Promise<void>;
  close(): Promise<void>;
  getWriter(): WritableStreamDefaultWriter<W>;
}
declare class WritableStreamDefaultWriter<W = any> {
  constructor(stream: WritableStream);
  get closed(): Promise<void>;
  get ready(): Promise<void>;
  get desiredSize(): number | null;
  abort(reason?: any): Promise<void>;
  close(): Promise<void>;
  write(chunk?: W): Promise<void>;
  releaseLock(): void;
}
declare class TransformStream<I = any, O = any> {
  constructor(
    transformer?: Transformer<I, O>,
    writableStrategy?: QueuingStrategy<I>,
    readableStrategy?: QueuingStrategy<O>
  );
  get readable(): ReadableStream<O>;
  get writable(): WritableStream<I>;
}
declare class FixedLengthStream extends IdentityTransformStream {
  constructor(expectedLength: number | bigint);
}
declare class IdentityTransformStream extends TransformStream<
  ArrayBuffer | ArrayBufferView,
  Uint8Array
> {
  constructor();
}
declare interface ReadableStreamValuesOptions {
  preventCancel?: boolean;
}
declare class CompressionStream extends TransformStream<
  ArrayBuffer | ArrayBufferView,
  Uint8Array
> {
  constructor(format: "gzip" | "deflate");
}
declare class DecompressionStream extends TransformStream<
  ArrayBuffer | ArrayBufferView,
  Uint8Array
> {
  constructor(format: "gzip" | "deflate");
}
declare class TextEncoderStream extends TransformStream<string, Uint8Array> {
  constructor();
}
declare class TextDecoderStream extends TransformStream<
  ArrayBuffer | ArrayBufferView,
  string
> {
  constructor(label?: string, options?: TextDecoderStreamTextDecoderStreamInit);
}
declare interface TextDecoderStreamTextDecoderStreamInit {
  fatal?: boolean;
}
declare class ByteLengthQueuingStrategy
  implements QueuingStrategy<ArrayBufferView>
{
  constructor(init: QueuingStrategyInit);
  get highWaterMark(): number;
  get size(): (chunk?: any) => number;
}
declare class CountQueuingStrategy implements QueuingStrategy {
  constructor(init: QueuingStrategyInit);
  get highWaterMark(): number;
  get size(): (chunk?: any) => number;
}
declare interface QueuingStrategyInit {
  /**
   * Creates a new ByteLengthQueuingStrategy with the provided high water mark.
   *
   * Note that the provided high water mark will not be validated ahead of time. Instead, if it is negative, NaN, or not a number, the resulting ByteLengthQueuingStrategy will cause the corresponding stream constructor to throw.
   */
  highWaterMark: number;
}
declare abstract class TraceEvent extends ExtendableEvent {
  readonly traces: TraceItem[];
}
declare interface TraceItem {
  readonly event:
    | (
        | TraceItemFetchEventInfo
        | TraceItemScheduledEventInfo
        | TraceItemAlarmEventInfo
        | TraceItemQueueEventInfo
        | TraceItemEmailEventInfo
        | TraceItemCustomEventInfo
      )
    | null;
  readonly eventTimestamp: number | null;
  readonly logs: TraceLog[];
  readonly exceptions: TraceException[];
  readonly scriptName: string | null;
  readonly dispatchNamespace?: string;
  readonly scriptTags?: string[];
  readonly outcome: string;
}
declare interface TraceItemAlarmEventInfo {
  readonly scheduledTime: Date;
}
declare interface TraceItemCustomEventInfo {}
declare interface TraceItemScheduledEventInfo {
  readonly scheduledTime: number;
  readonly cron: string;
}
declare interface TraceItemQueueEventInfo {
  readonly queue: string;
  readonly batchSize: number;
}
declare interface TraceItemEmailEventInfo {
  readonly mailFrom: string;
  readonly rcptTo: string;
  readonly rawSize: number;
}
declare interface TraceItemFetchEventInfo {
  readonly response?: TraceItemFetchEventInfoResponse;
  readonly request: TraceItemFetchEventInfoRequest;
}
declare interface TraceItemFetchEventInfoRequest {
  readonly cf?: any;
  readonly headers: Record<string, string>;
  readonly method: string;
  readonly url: string;
  getUnredacted(): TraceItemFetchEventInfoRequest;
}
declare interface TraceItemFetchEventInfoResponse {
  readonly status: number;
}
declare interface TraceLog {
  readonly timestamp: number;
  readonly level: string;
  readonly message: any;
}
declare interface TraceException {
  readonly timestamp: number;
  readonly message: string;
  readonly name: string;
}
declare interface TraceMetrics {
  readonly cpuTime: number;
  readonly wallTime: number;
}
declare interface UnsafeTraceMetrics {
  fromTrace(item: TraceItem): TraceMetrics;
}
declare class URL {
  constructor(url: string | URL, base?: string | URL);
  get origin(): string;
  get href(): string;
  set href(value: string);
  get protocol(): string;
  set protocol(value: string);
  get username(): string;
  set username(value: string);
  get password(): string;
  set password(value: string);
  get host(): string;
  set host(value: string);
  get hostname(): string;
  set hostname(value: string);
  get port(): string;
  set port(value: string);
  get pathname(): string;
  set pathname(value: string);
  get search(): string;
  set search(value: string);
  get hash(): string;
  set hash(value: string);
  get searchParams(): URLSearchParams;
  toJSON(): string;
  toString(): string;
}
declare class URLSearchParams {
  constructor(
    init?: Iterable<Iterable<string>> | Record<string, string> | string
  );
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  sort(): void;
  entries(): IterableIterator<[key: string, value: string]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  forEach<This = unknown>(
    callback: (
      this: This,
      value: string,
      key: string,
      parent: URLSearchParams
    ) => void,
    thisArg?: This
  ): void;
  toString(): string;
  [Symbol.iterator](): IterableIterator<[key: string, value: string]>;
}
declare class URLPattern {
  constructor(input?: string | URLPatternURLPatternInit, baseURL?: string);
  get protocol(): string;
  get username(): string;
  get password(): string;
  get hostname(): string;
  get port(): string;
  get pathname(): string;
  get search(): string;
  get hash(): string;
  test(input?: string | URLPatternURLPatternInit, baseURL?: string): boolean;
  exec(
    input?: string | URLPatternURLPatternInit,
    baseURL?: string
  ): URLPatternURLPatternResult | null;
}
declare interface URLPatternURLPatternInit {
  protocol?: string;
  username?: string;
  password?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
  baseURL?: string;
}
declare interface URLPatternURLPatternComponentResult {
  input: string;
  groups: Record<string, string>;
}
declare interface URLPatternURLPatternResult {
  inputs: (string | URLPatternURLPatternInit)[];
  protocol: URLPatternURLPatternComponentResult;
  username: URLPatternURLPatternComponentResult;
  password: URLPatternURLPatternComponentResult;
  hostname: URLPatternURLPatternComponentResult;
  port: URLPatternURLPatternComponentResult;
  pathname: URLPatternURLPatternComponentResult;
  search: URLPatternURLPatternComponentResult;
  hash: URLPatternURLPatternComponentResult;
}
declare class CloseEvent extends Event {
  constructor(type: string, initializer: CloseEventInit);
  /** Returns the WebSocket connection close code provided by the server. */
  readonly code: number;
  /** Returns the WebSocket connection close reason provided by the server. */
  readonly reason: string;
  /** Returns true if the connection closed cleanly; false otherwise. */
  readonly wasClean: boolean;
}
declare interface CloseEventInit {
  code?: number;
  reason?: string;
  wasClean?: boolean;
}
declare class MessageEvent extends Event {
  constructor(type: string, initializer: MessageEventInit);
  readonly data: ArrayBuffer | string;
}
declare interface MessageEventInit {
  data: ArrayBuffer | string;
}
/** Events providing information related to errors in scripts or in files. */
declare interface ErrorEvent extends Event {
  readonly filename: string;
  readonly message: string;
  readonly lineno: number;
  readonly colno: number;
  readonly error: any;
}
declare type WebSocketEventMap = {
  close: CloseEvent;
  message: MessageEvent;
  open: Event;
  error: ErrorEvent;
};
declare class WebSocket extends EventTarget<WebSocketEventMap> {
  constructor(url: string, protocols?: string[] | string);
  accept(): void;
  send(message: (ArrayBuffer | ArrayBufferView) | string): void;
  close(code?: number, reason?: string): void;
  static readonly READY_STATE_CONNECTING: number;
  static readonly READY_STATE_OPEN: number;
  static readonly READY_STATE_CLOSING: number;
  static readonly READY_STATE_CLOSED: number;
  get readyState(): number;
  get url(): string | null;
  get protocol(): string | null;
  get extensions(): string | null;
}
declare const WebSocketPair: {
  new (): {
    0: WebSocket;
    1: WebSocket;
  };
};
declare interface BasicImageTransformations {
  /**
   * Maximum width in image pixels. The value must be an integer.
   */
  width?: number;
  /**
   * Maximum height in image pixels. The value must be an integer.
   */
  height?: number;
  /**
   * Resizing mode as a string. It affects interpretation of width and height
   * options:
   *  - scale-down: Similar to contain, but the image is never enlarged. If
   *    the image is larger than given width or height, it will be resized.
   *    Otherwise its original size will be kept.
   *  - contain: Resizes to maximum size that fits within the given width and
   *    height. If only a single dimension is given (e.g. only width), the
   *    image will be shrunk or enlarged to exactly match that dimension.
   *    Aspect ratio is always preserved.
   *  - cover: Resizes (shrinks or enlarges) to fill the entire area of width
   *    and height. If the image has an aspect ratio different from the ratio
   *    of width and height, it will be cropped to fit.
   *  - crop: The image will be shrunk and cropped to fit within the area
   *    specified by width and height. The image will not be enlarged. For images
   *    smaller than the given dimensions it's the same as scale-down. For
   *    images larger than the given dimensions, it's the same as cover.
   *    See also trim.
   *  - pad: Resizes to the maximum size that fits within the given width and
   *    height, and then fills the remaining area with a background color
   *    (white by default). Use of this mode is not recommended, as the same
   *    effect can be more efficiently achieved with the contain mode and the
   *    CSS object-fit: contain property.
   */
  fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
  /**
   * When cropping with fit: "cover", this defines the side or point that should
   * be left uncropped. The value is either a string
   * "left", "right", "top", "bottom", "auto", or "center" (the default),
   * or an object {x, y} containing focal point coordinates in the original
   * image expressed as fractions ranging from 0.0 (top or left) to 1.0
   * (bottom or right), 0.5 being the center. {fit: "cover", gravity: "top"} will
   * crop bottom or left and right sides as necessary, but won’t crop anything
   * from the top. {fit: "cover", gravity: {x:0.5, y:0.2}} will crop each side to
   * preserve as much as possible around a point at 20% of the height of the
   * source image.
   */
  gravity?:
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "center"
    | "auto"
    | BasicImageTransformationsGravityCoordinates;
  /**
   * Background color to add underneath the image. Applies only to images with
   * transparency (such as PNG). Accepts any CSS color (#RRGGBB, rgba(…),
   * hsl(…), etc.)
   */
  background?: string;
  /**
   * Number of degrees (90, 180, 270) to rotate the image by. width and height
   * options refer to axes after rotation.
   */
  rotate?: 0 | 90 | 180 | 270 | 360;
}
declare interface BasicImageTransformationsGravityCoordinates {
  x: number;
  y: number;
}
/**
 * In addition to the properties you can set in the RequestInit dict
 * that you pass as an argument to the Request constructor, you can
 * set certain properties of a `cf` object to control how Cloudflare
 * features are applied to that new Request.
 *
 * Note: Currently, these properties cannot be tested in the
 * playground.
 */
declare interface RequestInitCfProperties {
  cacheEverything?: boolean;
  /**
   * A request's cache key is what determines if two requests are
   * "the same" for caching purposes. If a request has the same cache key
   * as some previous request, then we can serve the same cached response for
   * both. (e.g. 'some-key')
   *
   * Only available for Enterprise customers.
   */
  cacheKey?: string;
  /**
   * This allows you to append additional Cache-Tag response headers
   * to the origin response without modifications to the origin server.
   * This will allow for greater control over the Purge by Cache Tag feature
   * utilizing changes only in the Workers process.
   *
   * Only available for Enterprise customers.
   */
  cacheTags?: string[];
  /**
   * Force response to be cached for a given number of seconds. (e.g. 300)
   */
  cacheTtl?: number;
  /**
   * Force response to be cached for a given number of seconds based on the Origin status code.
   * (e.g. { '200-299': 86400, '404': 1, '500-599': 0 })
   */
  cacheTtlByStatus?: Record<string, number>;
  scrapeShield?: boolean;
  apps?: boolean;
  image?: RequestInitCfPropertiesImage;
  minify?: RequestInitCfPropertiesImageMinify;
  mirage?: boolean;
  polish?: "lossy" | "lossless" | "off";
  /**
   * Redirects the request to an alternate origin server. You can use this,
   * for example, to implement load balancing across several origins.
   * (e.g.us-east.example.com)
   *
   * Note - For security reasons, the hostname set in resolveOverride must
   * be proxied on the same Cloudflare zone of the incoming request.
   * Otherwise, the setting is ignored. CNAME hosts are allowed, so to
   * resolve to a host under a different domain or a DNS only domain first
   * declare a CNAME record within your own zone’s DNS mapping to the
   * external hostname, set proxy on Cloudflare, then set resolveOverride
   * to point to that CNAME record.
   */
  resolveOverride?: string;
}
declare interface RequestInitCfPropertiesImageDraw
  extends BasicImageTransformations {
  /**
   * Absolute URL of the image file to use for the drawing. It can be any of
   * the supported file formats. For drawing of watermarks or non-rectangular
   * overlays we recommend using PNG or WebP images.
   */
  url: string;
  /**
   * Floating-point number between 0 (transparent) and 1 (opaque).
   * For example, opacity: 0.5 makes overlay semitransparent.
   */
  opacity?: number;
  /**
   * - If set to true, the overlay image will be tiled to cover the entire
   *   area. This is useful for stock-photo-like watermarks.
   * - If set to "x", the overlay image will be tiled horizontally only
   *   (form a line).
   * - If set to "y", the overlay image will be tiled vertically only
   *   (form a line).
   */
  repeat?: true | "x" | "y";
  /**
   * Position of the overlay image relative to a given edge. Each property is
   * an offset in pixels. 0 aligns exactly to the edge. For example, left: 10
   * positions left side of the overlay 10 pixels from the left edge of the
   * image it's drawn over. bottom: 0 aligns bottom of the overlay with bottom
   * of the background image.
   *
   * Setting both left & right, or both top & bottom is an error.
   *
   * If no position is specified, the image will be centered.
   */
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}
declare interface RequestInitCfPropertiesImage
  extends BasicImageTransformations {
  /**
   * Device Pixel Ratio. Default 1. Multiplier for width/height that makes it
   * easier to specify higher-DPI sizes in <img srcset>.
   */
  dpr?: number;
  /**
   * An object with four properties {left, top, right, bottom} that specify
   * a number of pixels to cut off on each side. Allows removal of borders
   * or cutting out a specific fragment of an image. Trimming is performed
   * before resizing or rotation. Takes dpr into account.
   */
  trim?: {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
  };
  /**
   * Quality setting from 1-100 (useful values are in 60-90 range). Lower values
   * make images look worse, but load faster. The default is 85. It applies only
   * to JPEG and WebP images. It doesn’t have any effect on PNG.
   */
  quality?: number;
  /**
   * Output format to generate. It can be:
   *  - avif: generate images in AVIF format.
   *  - webp: generate images in Google WebP format. Set quality to 100 to get
   *    the WebP-lossless format.
   *  - json: instead of generating an image, outputs information about the
   *    image, in JSON format. The JSON object will contain image size
   *    (before and after resizing), source image’s MIME type, file size, etc.
   * - jpeg: generate images in JPEG format.
   * - png: generate images in PNG format.
   */
  format?: "avif" | "webp" | "json" | "jpeg" | "png";
  /**
   * Whether to preserve animation frames from input files. Default is true.
   * Setting it to false reduces animations to still images. This setting is
   * recommended when enlarging images or processing arbitrary user content,
   * because large GIF animations can weigh tens or even hundreds of megabytes.
   * It is also useful to set anim:false when using format:"json" to get the
   * response quicker without the number of frames.
   */
  anim?: boolean;
  /**
   * What EXIF data should be preserved in the output image. Note that EXIF
   * rotation and embedded color profiles are always applied ("baked in" into
   * the image), and aren't affected by this option. Note that if the Polish
   * feature is enabled, all metadata may have been removed already and this
   * option may have no effect.
   *  - keep: Preserve most of EXIF metadata, including GPS location if there's
   *    any.
   *  - copyright: Only keep the copyright tag, and discard everything else.
   *    This is the default behavior for JPEG files.
   *  - none: Discard all invisible EXIF metadata. Currently WebP and PNG
   *    output formats always discard metadata.
   */
  metadata?: "keep" | "copyright" | "none";
  /**
   * Strength of sharpening filter to apply to the image. Floating-point
   * number between 0 (no sharpening, default) and 10 (maximum). 1.0 is a
   * recommended value for downscaled images.
   */
  sharpen?: number;
  /**
   * Radius of a blur filter (approximate gaussian). Maximum supported radius
   * is 250.
   */
  blur?: number;
  /**
   * Overlays are drawn in the order they appear in the array (last array
   * entry is the topmost layer).
   */
  draw?: RequestInitCfPropertiesImageDraw[];
  /**
   * Fetching image from authenticated origin. Setting this property will
   * pass authentication headers (Authorization, Cookie, etc.) through to
   * the origin.
   */
  "origin-auth"?: "share-publicly";
}
declare interface RequestInitCfPropertiesImageMinify {
  javascript?: boolean;
  css?: boolean;
  html?: boolean;
}
/**
 * Request metadata provided by Cloudflare's edge.
 */
declare type IncomingRequestCfProperties<HostMetadata = unknown> =
  IncomingRequestCfPropertiesBase &
    IncomingRequestCfPropertiesBotManagementEnterprise &
    IncomingRequestCfPropertiesCloudflareForSaaSEnterprise<HostMetadata> &
    IncomingRequestCfPropertiesGeographicInformation &
    IncomingRequestCfPropertiesCloudflareAccessOrApiShield;
declare interface IncomingRequestCfPropertiesBase {
  /**
   * [ASN](https://www.iana.org/assignments/as-numbers/as-numbers.xhtml) of the incoming request.
   *
   * @example 395747
   */
  asn: number;
  /**
   * The organization which owns the ASN of the incoming request.
   *
   * @example "Google Cloud"
   */
  asOrganization: string;
  /**
   * The original value of the `Accept-Encoding` header if Cloudflare modified it.
   *
   * @example "gzip, deflate, br"
   */
  clientAcceptEncoding?: string;
  /**
   * The number of milliseconds it took for the request to reach your worker.
   *
   * @example 22
   */
  clientTcpRtt?: number;
  /**
   * The three-letter [IATA](https://en.wikipedia.org/wiki/IATA_airport_code)
   * airport code of the data center that the request hit.
   *
   * @example "DFW"
   */
  colo: string;
  /**
   * Represents the upstream's response to a
   * [TCP `keepalive` message](https://tldp.org/HOWTO/TCP-Keepalive-HOWTO/overview.html)
   * from cloudflare.
   *
   * For workers with no upstream, this will always be `1`.
   *
   * @example 3
   */
  edgeRequestKeepAliveStatus: IncomingRequestCfPropertiesEdgeRequestKeepAliveStatus;
  /**
   * The HTTP Protocol the request used.
   *
   * @example "HTTP/2"
   */
  httpProtocol: string;
  /**
   * The browser-requested prioritization information in the request object.
   *
   * If no information was set, defaults to the empty string `""`
   *
   * @example "weight=192;exclusive=0;group=3;group-weight=127"
   * @default ""
   */
  requestPriority: string;
  /**
   * The TLS version of the connection to Cloudflare.
   * In requests served over plaintext (without TLS), this property is the empty string `""`.
   *
   * @example "TLSv1.3"
   */
  tlsVersion: string;
  /**
   * The cipher for the connection to Cloudflare.
   * In requests served over plaintext (without TLS), this property is the empty string `""`.
   *
   * @example "AEAD-AES128-GCM-SHA256"
   */
  tlsCipher: string;
  /**
   * Metadata containing the [`HELLO`](https://www.rfc-editor.org/rfc/rfc5246#section-7.4.1.2) and [`FINISHED`](https://www.rfc-editor.org/rfc/rfc5246#section-7.4.9) messages from this request's TLS handshake.
   *
   * If the incoming request was served over plaintext (without TLS) this field is undefined.
   */
  tlsExportedAuthenticator?: IncomingRequestCfPropertiesExportedAuthenticatorMetadata;
}
declare interface IncomingRequestCfPropertiesBotManagementBase {
  /**
   * Cloudflare’s [level of certainty](https://developers.cloudflare.com/bots/concepts/bot-score/) that a request comes from a bot,
   * represented as an integer percentage between `1` (almost certainly human)
   * and `99` (almost certainly a bot).
   *
   * @example 54
   */
  score: number;
  /**
   * A boolean value that is true if the request comes from a good bot, like Google or Bing.
   * Most customers choose to allow this traffic. For more details, see [Traffic from known bots](https://developers.cloudflare.com/firewall/known-issues-and-faq/#how-does-firewall-rules-handle-traffic-from-known-bots).
   */
  verifiedBot: boolean;
  /**
   * A boolean value that is true if the request originates from a
   * Cloudflare-verified proxy service.
   */
  corporateProxy: boolean;
  /**
   * A boolean value that's true if the request matches [file extensions](https://developers.cloudflare.com/bots/reference/static-resources/) for many types of static resources.
   */
  staticResource: boolean;
}
declare interface IncomingRequestCfPropertiesBotManagement {
  /**
   * Results of Cloudflare's Bot Management analysis
   */
  botManagement: IncomingRequestCfPropertiesBotManagementBase;
  /**
   * Duplicate of `botManagement.score`.
   *
   * @deprecated
   */
  clientTrustScore: number;
}
declare interface IncomingRequestCfPropertiesBotManagementEnterprise
  extends IncomingRequestCfPropertiesBotManagement {
  /**
   * Results of Cloudflare's Bot Management analysis
   */
  botManagement: IncomingRequestCfPropertiesBotManagementBase & {
    /**
     * A [JA3 Fingerprint](https://developers.cloudflare.com/bots/concepts/ja3-fingerprint/) to help profile specific SSL/TLS clients
     * across different destination IPs, Ports, and X509 certificates.
     */
    ja3Hash: string;
  };
}
declare interface IncomingRequestCfPropertiesCloudflareForSaaSEnterprise<
  HostMetadata
> {
  /**
   * Custom metadata set per-host in [Cloudflare for SaaS](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/).
   *
   * This field is only present if you have Cloudflare for SaaS enabled on your account
   * and you have followed the [required steps to enable it]((https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/domain-support/custom-metadata/)).
   */
  hostMetadata: HostMetadata;
}
declare interface IncomingRequestCfPropertiesCloudflareAccessOrApiShield {
  /**
   * Information about the client certificate presented to Cloudflare.
   *
   * This is populated when the incoming request is served over TLS using
   * either Cloudflare Access or API Shield (mTLS)
   * and the presented SSL certificate has a valid
   * [Certificate Serial Number](https://ldapwiki.com/wiki/Certificate%20Serial%20Number)
   * (i.e., not `null` or `""`).
   *
   * Otherwise, a set of placeholder values are used.
   *
   * The property `certPresented` will be set to `"1"` when
   * the object is populated (i.e. the above conditions were met).
   */
  tlsClientAuth:
    | IncomingRequestCfPropertiesTLSClientAuth
    | IncomingRequestCfPropertiesTLSClientAuthPlaceholder;
}
/**
 * Metadata about the request's TLS handshake
 */
declare interface IncomingRequestCfPropertiesExportedAuthenticatorMetadata {
  /**
   * The client's [`HELLO` message](https://www.rfc-editor.org/rfc/rfc5246#section-7.4.1.2), encoded in hexadecimal
   *
   * @example "44372ba35fa1270921d318f34c12f155dc87b682cf36a790cfaa3ba8737a1b5d"
   */
  clientHandshake: string;
  /**
   * The server's [`HELLO` message](https://www.rfc-editor.org/rfc/rfc5246#section-7.4.1.2), encoded in hexadecimal
   *
   * @example "44372ba35fa1270921d318f34c12f155dc87b682cf36a790cfaa3ba8737a1b5d"
   */
  serverHandshake: string;
  /**
   * The client's [`FINISHED` message](https://www.rfc-editor.org/rfc/rfc5246#section-7.4.9), encoded in hexadecimal
   *
   * @example "084ee802fe1348f688220e2a6040a05b2199a761f33cf753abb1b006792d3f8b"
   */
  clientFinished: string;
  /**
   * The server's [`FINISHED` message](https://www.rfc-editor.org/rfc/rfc5246#section-7.4.9), encoded in hexadecimal
   *
   * @example "084ee802fe1348f688220e2a6040a05b2199a761f33cf753abb1b006792d3f8b"
   */
  serverFinished: string;
}
/**
 * Geographic data about the request's origin.
 */
declare type IncomingRequestCfPropertiesGeographicInformation =
  | {}
  | {
      /** The country code `"T1"` is used for requests originating on TOR  */
      country: "T1";
    }
  | {
      /**
       * The [ISO 3166-1 Alpha 2](https://www.iso.org/iso-3166-country-codes.html) country code the request originated from.
       *
       * If your worker is [configured to accept TOR connections](https://support.cloudflare.com/hc/en-us/articles/203306930-Understanding-Cloudflare-Tor-support-and-Onion-Routing), this may also be `"T1"`, indicating a request that originated over TOR.
       *
       * If Cloudflare is unable to determine where the request originated this property is omitted.
       *
       * @example "GB"
       */
      country: Iso3166Alpha2Code;
      /**
       * If present, this property indicates that the request originated in the EU
       *
       * @example "1"
       */
      isEUCountry?: "1";
      /**
       * A two-letter code indicating the continent the request originated from.
       *
       * @example "AN"
       */
      continent: ContinentCode;
      /**
       * The city the request originated from
       *
       * @example "Austin"
       */
      city?: string;
      /**
       * Postal code of the incoming request
       *
       * @example "78701"
       */
      postalCode?: string;
      /**
       * Latitude of the incoming request
       *
       * @example "30.27130"
       */
      latitude?: string;
      /**
       * Longitude of the incoming request
       *
       * @example "-97.74260"
       */
      longitude?: string;
      /**
       * Timezone of the incoming request
       *
       * @example "America/Chicago"
       */
      timezone?: string;
      /**
       * If known, the ISO 3166-2 name for the first level region associated with
       * the IP address of the incoming request
       *
       * @example "Texas"
       */
      region?: string;
      /**
       * If known, the ISO 3166-2 code for the first-level region associated with
       * the IP address of the incoming request
       *
       * @example "TX"
       */
      regionCode?: string;
      /**
       * Metro code (DMA) of the incoming request
       *
       * @example "635"
       */
      metroCode?: string;
    };
/** Data about the incoming request's TLS certificate */
declare interface IncomingRequestCfPropertiesTLSClientAuth {
  /** Always `"1"`, indicating that the certificate was presented */
  certPresented: "1";
  /**
   * Result of certificate verification.
   *
   * @example "FAILED:self signed certificate"
   */
  certVerified: Exclude<CertVerificationStatus, "NONE">;
  /** The presented certificate's revokation status.
   *
   * - A value of `"1"` indicates the certificate has been revoked
   * - A value of `"0"` indicates the certificate has not been revoked
   */
  certRevoked: "1" | "0";
  /**
   * The certificate issuer's [distinguished name](https://knowledge.digicert.com/generalinformation/INFO1745.html)
   *
   * @example "CN=cloudflareaccess.com, C=US, ST=Texas, L=Austin, O=Cloudflare"
   */
  certIssuerDN: string;
  /**
   * The certificate subject's [distinguished name](https://knowledge.digicert.com/generalinformation/INFO1745.html)
   *
   * @example "CN=*.cloudflareaccess.com, C=US, ST=Texas, L=Austin, O=Cloudflare"
   */
  certSubjectDN: string;
  /**
   * The certificate issuer's [distinguished name](https://knowledge.digicert.com/generalinformation/INFO1745.html) ([RFC 2253](https://www.rfc-editor.org/rfc/rfc2253.html) formatted)
   *
   * @example "CN=cloudflareaccess.com, C=US, ST=Texas, L=Austin, O=Cloudflare"
   */
  certIssuerDNRFC2253: string;
  /**
   * The certificate subject's [distinguished name](https://knowledge.digicert.com/generalinformation/INFO1745.html) ([RFC 2253](https://www.rfc-editor.org/rfc/rfc2253.html) formatted)
   *
   * @example "CN=*.cloudflareaccess.com, C=US, ST=Texas, L=Austin, O=Cloudflare"
   */
  certSubjectDNRFC2253: string;
  /** The certificate issuer's distinguished name (legacy policies) */
  certIssuerDNLegacy: string;
  /** The certificate subject's distinguished name (legacy policies) */
  certSubjectDNLegacy: string;
  /**
   * The certificate's serial number
   *
   * @example "00936EACBE07F201DF"
   */
  certSerial: string;
  /**
   * The certificate issuer's serial number
   *
   * @example "2489002934BDFEA34"
   */
  certIssuerSerial: string;
  /**
   * The certificate's Subject Key Identifier
   *
   * @example "BB:AF:7E:02:3D:FA:A6:F1:3C:84:8E:AD:EE:38:98:EC:D9:32:32:D4"
   */
  certSKI: string;
  /**
   * The certificate issuer's Subject Key Identifier
   *
   * @example "BB:AF:7E:02:3D:FA:A6:F1:3C:84:8E:AD:EE:38:98:EC:D9:32:32:D4"
   */
  certIssuerSKI: string;
  /**
   * The certificate's SHA-1 fingerprint
   *
   * @example "6b9109f323999e52259cda7373ff0b4d26bd232e"
   */
  certFingerprintSHA1: string;
  /**
   * The certificate's SHA-256 fingerprint
   *
   * @example "acf77cf37b4156a2708e34c4eb755f9b5dbbe5ebb55adfec8f11493438d19e6ad3f157f81fa3b98278453d5652b0c1fd1d71e5695ae4d709803a4d3f39de9dea"
   */
  certFingerprintSHA256: string;
  /**
   * The effective starting date of the certificate
   *
   * @example "Dec 22 19:39:00 2018 GMT"
   */
  certNotBefore: string;
  /**
   * The effective expiration date of the certificate
   *
   * @example "Dec 22 19:39:00 2018 GMT"
   */
  certNotAfter: string;
}
/** Placeholder values for TLS Client Authorization */
declare interface IncomingRequestCfPropertiesTLSClientAuthPlaceholder {
  certPresented: "0";
  certVerified: "NONE";
  certRevoked: "0";
  certIssuerDN: "";
  certSubjectDN: "";
  certIssuerDNRFC2253: "";
  certSubjectDNRFC2253: "";
  certIssuerDNLegacy: "";
  certSubjectDNLegacy: "";
  certSerial: "";
  certIssuerSerial: "";
  certSKI: "";
  certIssuerSKI: "";
  certFingerprintSHA1: "";
  certFingerprintSHA256: "";
  certNotBefore: "";
  certNotAfter: "";
}
/** Possible outcomes of TLS verification */
declare type CertVerificationStatus =
  /** Authentication succeeded */
  | "SUCCESS"
  /** No certificate was presented */
  | "NONE"
  /** Failed because the certificate was self-signed */
  | "FAILED:self signed certificate"
  /** Failed because the certificate failed a trust chain check */
  | "FAILED:unable to verify the first certificate"
  /** Failed because the certificate not yet valid */
  | "FAILED:certificate is not yet valid"
  /** Failed because the certificate is expired */
  | "FAILED:certificate has expired"
  /** Failed for another unspecified reason */
  | "FAILED";
/**
 * An upstream endpoint's response to a TCP `keepalive` message from Cloudflare.
 */
declare type IncomingRequestCfPropertiesEdgeRequestKeepAliveStatus =
  | 0 /** Unknown */
  | 1 /** no keepalives (not found) */
  | 2 /** no connection re-use, opening keepalive connection failed */
  | 3 /** no connection re-use, keepalive accepted and saved */
  | 4 /** connection re-use, refused by the origin server (`TCP FIN`) */
  | 5; /** connection re-use, accepted by the origin server */
/** ISO 3166-1 Alpha-2 codes */
declare type Iso3166Alpha2Code =
  | "AD"
  | "AE"
  | "AF"
  | "AG"
  | "AI"
  | "AL"
  | "AM"
  | "AO"
  | "AQ"
  | "AR"
  | "AS"
  | "AT"
  | "AU"
  | "AW"
  | "AX"
  | "AZ"
  | "BA"
  | "BB"
  | "BD"
  | "BE"
  | "BF"
  | "BG"
  | "BH"
  | "BI"
  | "BJ"
  | "BL"
  | "BM"
  | "BN"
  | "BO"
  | "BQ"
  | "BR"
  | "BS"
  | "BT"
  | "BV"
  | "BW"
  | "BY"
  | "BZ"
  | "CA"
  | "CC"
  | "CD"
  | "CF"
  | "CG"
  | "CH"
  | "CI"
  | "CK"
  | "CL"
  | "CM"
  | "CN"
  | "CO"
  | "CR"
  | "CU"
  | "CV"
  | "CW"
  | "CX"
  | "CY"
  | "CZ"
  | "DE"
  | "DJ"
  | "DK"
  | "DM"
  | "DO"
  | "DZ"
  | "EC"
  | "EE"
  | "EG"
  | "EH"
  | "ER"
  | "ES"
  | "ET"
  | "FI"
  | "FJ"
  | "FK"
  | "FM"
  | "FO"
  | "FR"
  | "GA"
  | "GB"
  | "GD"
  | "GE"
  | "GF"
  | "GG"
  | "GH"
  | "GI"
  | "GL"
  | "GM"
  | "GN"
  | "GP"
  | "GQ"
  | "GR"
  | "GS"
  | "GT"
  | "GU"
  | "GW"
  | "GY"
  | "HK"
  | "HM"
  | "HN"
  | "HR"
  | "HT"
  | "HU"
  | "ID"
  | "IE"
  | "IL"
  | "IM"
  | "IN"
  | "IO"
  | "IQ"
  | "IR"
  | "IS"
  | "IT"
  | "JE"
  | "JM"
  | "JO"
  | "JP"
  | "KE"
  | "KG"
  | "KH"
  | "KI"
  | "KM"
  | "KN"
  | "KP"
  | "KR"
  | "KW"
  | "KY"
  | "KZ"
  | "LA"
  | "LB"
  | "LC"
  | "LI"
  | "LK"
  | "LR"
  | "LS"
  | "LT"
  | "LU"
  | "LV"
  | "LY"
  | "MA"
  | "MC"
  | "MD"
  | "ME"
  | "MF"
  | "MG"
  | "MH"
  | "MK"
  | "ML"
  | "MM"
  | "MN"
  | "MO"
  | "MP"
  | "MQ"
  | "MR"
  | "MS"
  | "MT"
  | "MU"
  | "MV"
  | "MW"
  | "MX"
  | "MY"
  | "MZ"
  | "NA"
  | "NC"
  | "NE"
  | "NF"
  | "NG"
  | "NI"
  | "NL"
  | "NO"
  | "NP"
  | "NR"
  | "NU"
  | "NZ"
  | "OM"
  | "PA"
  | "PE"
  | "PF"
  | "PG"
  | "PH"
  | "PK"
  | "PL"
  | "PM"
  | "PN"
  | "PR"
  | "PS"
  | "PT"
  | "PW"
  | "PY"
  | "QA"
  | "RE"
  | "RO"
  | "RS"
  | "RU"
  | "RW"
  | "SA"
  | "SB"
  | "SC"
  | "SD"
  | "SE"
  | "SG"
  | "SH"
  | "SI"
  | "SJ"
  | "SK"
  | "SL"
  | "SM"
  | "SN"
  | "SO"
  | "SR"
  | "SS"
  | "ST"
  | "SV"
  | "SX"
  | "SY"
  | "SZ"
  | "TC"
  | "TD"
  | "TF"
  | "TG"
  | "TH"
  | "TJ"
  | "TK"
  | "TL"
  | "TM"
  | "TN"
  | "TO"
  | "TR"
  | "TT"
  | "TV"
  | "TW"
  | "TZ"
  | "UA"
  | "UG"
  | "UM"
  | "US"
  | "UY"
  | "UZ"
  | "VA"
  | "VC"
  | "VE"
  | "VG"
  | "VI"
  | "VN"
  | "VU"
  | "WF"
  | "WS"
  | "YE"
  | "YT"
  | "ZA"
  | "ZM"
  | "ZW";
/** The 2-letter continent codes Cloudflare uses */
declare type ContinentCode = "AF" | "AN" | "AS" | "EU" | "NA" | "OC" | "SA";
declare interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: any;
}
declare abstract class D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec<T = unknown>(query: string): Promise<D1Result<T>>;
}
declare abstract class D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}
/**
 * A email message that is sent to a consumer Worker.
 */
declare interface EmailMessage<Body = unknown> {
  /**
   * Envelope From attribute of the email message.
   */
  readonly from: string;
  /**
   * Envelope To attribute of the email message.
   */
  readonly to: string;
  /**
   * A [Headers object](https://developer.mozilla.org/en-US/docs/Web/API/Headers).
   */
  readonly headers: Headers;
  /**
   * Stream of the email message content.
   */
  readonly raw: ReadableStream;
  /**
   * Size of the email message content.
   */
  readonly rawSize: number;
  /**
   * Reject this email message by returning a permanent SMTP error back to the connecting client including the given reason.
   * @param reason The reject reason.
   * @returns void
   */
  setReject(reason: string): void;
  /**
   * Forward this email message to a verified destination address of the account.
   * @param rcptTo Verified destination address.
   * @param headers A [Headers object](https://developer.mozilla.org/en-US/docs/Web/API/Headers).
   * @returns A promise that resolves when the email message is forwarded.
   */
  forward(rcptTo: string, headers?: Headers): Promise<void>;
}
declare abstract class EmailEvent extends ExtendableEvent {
  readonly message: EmailMessage;
}
declare type EmailExportedHandler<Env = unknown> = (
  message: EmailMessage,
  env: Env,
  ctx: ExecutionContext
) => void | Promise<void>;
declare type Params<P extends string = any> = Record<P, string | string[]>;
declare type EventContext<Env, P extends string, Data> = {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<any>) => void;
  passThroughOnException: () => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env & {
    ASSETS: {
      fetch: typeof fetch;
    };
  };
  params: Params<P>;
  data: Data;
};
declare type PagesFunction<
  Env = unknown,
  Params extends string = any,
  Data extends Record<string, unknown> = Record<string, unknown>
> = (context: EventContext<Env, Params, Data>) => Response | Promise<Response>;
declare type EventPluginContext<Env, P extends string, Data, PluginArgs> = {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<any>) => void;
  passThroughOnException: () => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env & {
    ASSETS: {
      fetch: typeof fetch;
    };
  };
  params: Params<P>;
  data: Data;
  pluginArgs: PluginArgs;
};
declare type PagesPluginFunction<
  Env = unknown,
  Params extends string = any,
  Data extends Record<string, unknown> = Record<string, unknown>,
  PluginArgs = unknown
> = (
  context: EventPluginContext<Env, Params, Data, PluginArgs>
) => Response | Promise<Response>;
declare module "assets:*" {
  export const onRequest: PagesFunction;
}
// https://developers.cloudflare.com/pub-sub/
// PubSubMessage represents an incoming PubSub message.
// The message includes metadata about the broker, the client, and the payload
// itself.
declare interface PubSubMessage {
  // Message ID
  readonly mid: number;
  // MQTT broker FQDN in the form mqtts://BROKER.NAMESPACE.cloudflarepubsub.com:PORT
  readonly broker: string;
  // The MQTT topic the message was sent on.
  readonly topic: string;
  // The client ID of the client that published this message.
  readonly clientId: string;
  // The unique identifier (JWT ID) used by the client to authenticate, if token
  // auth was used.
  readonly jti?: string;
  // A Unix timestamp (seconds from Jan 1, 1970), set when the Pub/Sub Broker
  // received the message from the client.
  readonly receivedAt: number;
  // An (optional) string with the MIME type of the payload, if set by the
  // client.
  readonly contentType: string;
  // Set to 1 when the payload is a UTF-8 string
  // https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901063
  readonly payloadFormatIndicator: number;
  // Pub/Sub (MQTT) payloads can be UTF-8 strings, or byte arrays.
  // You can use payloadFormatIndicator to inspect this before decoding.
  payload: string | Uint8Array;
}
// JsonWebKey extended by kid parameter
declare interface JsonWebKeyWithKid extends JsonWebKey {
  // Key Identifier of the JWK
  readonly kid: string;
}
/**
 * A message that is sent to a consumer Worker.
 */
declare interface Message<Body = unknown> {
  /**
   * A unique, system-generated ID for the message.
   */
  readonly id: string;
  /**
   * A timestamp when the message was sent.
   */
  readonly timestamp: Date;
  /**
   * The body of the message.
   */
  readonly body: Body;
}
/**
 * A batch of messages that are sent to a consumer Worker.
 */
declare interface MessageBatch<Body = unknown> {
  /**
   * The name of the Queue that belongs to this batch.
   */
  readonly queue: string;
  /**
   * An array of messages in the batch. Ordering of messages is not guaranteed.
   */
  readonly messages: readonly Message<Body>[];
  /**
   * Marks every message to be retried in the next batch.
   */
  retryAll(): void;
}
/**
 * A wrapper class used to structure message batches.
 */
declare type MessageSendRequest<Body = unknown> = {
  /**
   * The body of the message.
   */
  body: Body;
};
/**
 * A binding that allows a producer to send messages to a Queue.
 */
declare interface Queue<Body = any> {
  /**
   * Sends a message to the Queue.
   * @param message The message can be any type supported by the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types), as long as its size is less than 128 KB.
   * @returns A promise that resolves when the message is confirmed to be written to disk.
   */
  send(message: Body): Promise<void>;
  /**
   * Sends a batch of messages to the Queue.
   * @param messages Each item in the input must be supported by the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types). A batch can contain up to 100 messages, though items are limited to 128 KB each, and the total size of the array cannot exceed 256 KB.
   * @returns A promise that resolves when the messages are confirmed to be written to disk.
   */
  sendBatch(messages: Iterable<MessageSendRequest<Body>>): Promise<void>;
}
