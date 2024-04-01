var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};

// packages/kv/src/index.ts
__export(exports, {
  KVNamespace: () => KVNamespace,
  KVPlugin: () => KVPlugin
});

// packages/kv/src/namespace.ts
var import_consumers = __toModule(require("stream/consumers"));
var import_web = __toModule(require("stream/web"));
var import_util = __toModule(require("util"));
var import_shared = __toModule(require("@miniflare/shared"));
var MIN_CACHE_TTL = 60;
var MAX_LIST_KEYS = 1e3;
var MAX_KEY_SIZE = 512;
var MAX_VALUE_SIZE = 25 * 1024 * 1024;
var MAX_METADATA_SIZE = 1024;
var keyTypeError = " on 'KvNamespace': parameter 1 is not of type 'string'.";
var encoder = new import_util.TextEncoder();
var decoder = new import_util.TextDecoder();
var getValueTypes = new Set(["text", "json", "arrayBuffer", "stream"]);
function throwKVError(method, status, message) {
  throw new Error(`KV ${method} failed: ${status} ${message}`);
}
function validateKey(method, key) {
  if (key === "")
    throw new TypeError("Key name cannot be empty.");
  if (key === ".")
    throw new TypeError('"." is not allowed as a key name.');
  if (key === "..")
    throw new TypeError('".." is not allowed as a key name.');
  const keyLength = encoder.encode(key).byteLength;
  if (keyLength > MAX_KEY_SIZE) {
    throwKVError(method, 414, `UTF-8 encoded length of ${keyLength} exceeds key length limit of ${MAX_KEY_SIZE}.`);
  }
}
function validateGetOptions(options) {
  const string = typeof options === "string";
  const type = string ? options : options?.type ?? "text";
  const cacheTtl = string ? void 0 : options?.cacheTtl;
  if (cacheTtl && (isNaN(cacheTtl) || cacheTtl < MIN_CACHE_TTL)) {
    throwKVError("GET", 400, `Invalid cache_ttl of ${cacheTtl}. Cache TTL must be at least ${MIN_CACHE_TTL}.`);
  }
  if (!getValueTypes.has(type)) {
    throw new TypeError('Unknown response type. Possible types are "text", "arrayBuffer", "json", and "stream".');
  }
  return type;
}
function normaliseInt(value) {
  switch (typeof value) {
    case "string":
      return parseInt(value);
    case "number":
      return Math.round(value);
  }
}
function convertStoredToGetValue(stored, type) {
  switch (type) {
    case "text":
      return decoder.decode(stored);
    case "arrayBuffer":
      return (0, import_shared.viewToBuffer)(stored);
    case "json":
      return JSON.parse(decoder.decode(stored));
    case "stream":
      return new import_web.ReadableStream({
        type: "bytes",
        async pull(controller) {
          await (0, import_shared.waitForOpenInputGate)();
          controller.enqueue(stored);
          controller.close();
          controller.byobRequest?.respond(0);
        }
      });
  }
}
var KVNamespace = class {
  #storage;
  #clock;
  #blockGlobalAsyncIO;
  constructor(storage, {
    clock = import_shared.defaultClock,
    blockGlobalAsyncIO = false
  } = {}) {
    this.#storage = storage;
    this.#clock = clock;
    this.#blockGlobalAsyncIO = blockGlobalAsyncIO;
  }
  async get(key, options) {
    if (this.#blockGlobalAsyncIO)
      (0, import_shared.assertInRequest)();
    const ctx = (0, import_shared.getRequestContext)();
    ctx?.incrementInternalSubrequests();
    if (typeof key !== "string") {
      throw new TypeError("Failed to execute 'get'" + keyTypeError);
    }
    validateKey("GET", key);
    const type = validateGetOptions(options);
    const stored = await this.#storage.get(key, true);
    await (0, import_shared.waitForOpenInputGate)();
    ctx?.advanceCurrentTime();
    if (stored === void 0)
      return null;
    return convertStoredToGetValue(stored.value, type);
  }
  async getWithMetadata(key, options) {
    if (this.#blockGlobalAsyncIO)
      (0, import_shared.assertInRequest)();
    const ctx = (0, import_shared.getRequestContext)();
    ctx?.incrementInternalSubrequests();
    if (typeof key !== "string") {
      throw new TypeError("Failed to execute 'getWithMetadata'" + keyTypeError);
    }
    validateKey("GET", key);
    const type = validateGetOptions(options);
    const storedValue = await this.#storage.get(key);
    await (0, import_shared.waitForOpenInputGate)();
    ctx?.advanceCurrentTime();
    if (storedValue === void 0)
      return { value: null, metadata: null };
    const { value, metadata = null } = storedValue;
    return { value: convertStoredToGetValue(value, type), metadata };
  }
  async put(key, value, options = {}) {
    if (this.#blockGlobalAsyncIO)
      (0, import_shared.assertInRequest)();
    const ctx = (0, import_shared.getRequestContext)();
    ctx?.incrementInternalSubrequests();
    if (typeof key !== "string") {
      throw new TypeError("Failed to execute 'put'" + keyTypeError);
    }
    validateKey("PUT", key);
    let stored;
    if (typeof value === "string") {
      stored = encoder.encode(value);
    } else if (value instanceof import_web.ReadableStream) {
      stored = new Uint8Array(await (0, import_consumers.arrayBuffer)(value));
    } else if (value instanceof ArrayBuffer) {
      stored = new Uint8Array(value);
    } else if (ArrayBuffer.isView(value)) {
      stored = (0, import_shared.viewToArray)(value);
    } else {
      throw new TypeError("KV put() accepts only strings, ArrayBuffers, ArrayBufferViews, and ReadableStreams as values.");
    }
    const now = (0, import_shared.millisToSeconds)(this.#clock());
    let expiration = normaliseInt(options.expiration);
    const expirationTtl = normaliseInt(options.expirationTtl);
    if (expirationTtl !== void 0) {
      if (isNaN(expirationTtl) || expirationTtl <= 0) {
        throwKVError("PUT", 400, `Invalid expiration_ttl of ${options.expirationTtl}. Please specify integer greater than 0.`);
      }
      if (expirationTtl < MIN_CACHE_TTL) {
        throwKVError("PUT", 400, `Invalid expiration_ttl of ${options.expirationTtl}. Expiration TTL must be at least ${MIN_CACHE_TTL}.`);
      }
      expiration = now + expirationTtl;
    } else if (expiration !== void 0) {
      if (isNaN(expiration) || expiration <= now) {
        throwKVError("PUT", 400, `Invalid expiration of ${options.expiration}. Please specify integer greater than the current number of seconds since the UNIX epoch.`);
      }
      if (expiration < now + MIN_CACHE_TTL) {
        throwKVError("PUT", 400, `Invalid expiration of ${options.expiration}. Expiration times must be at least ${MIN_CACHE_TTL} seconds in the future.`);
      }
    }
    if (stored.byteLength > MAX_VALUE_SIZE) {
      throwKVError("PUT", 413, `Value length of ${stored.byteLength} exceeds limit of ${MAX_VALUE_SIZE}.`);
    }
    const metadataLength = options.metadata && encoder.encode(JSON.stringify(options.metadata)).byteLength;
    if (metadataLength && metadataLength > MAX_METADATA_SIZE) {
      throwKVError("PUT", 413, `Metadata length of ${metadataLength} exceeds limit of ${MAX_METADATA_SIZE}.`);
    }
    await (0, import_shared.waitForOpenOutputGate)();
    await this.#storage.put(key, {
      value: stored,
      expiration,
      metadata: options.metadata
    });
    await (0, import_shared.waitForOpenInputGate)();
    ctx?.advanceCurrentTime();
  }
  async delete(key) {
    if (this.#blockGlobalAsyncIO)
      (0, import_shared.assertInRequest)();
    const ctx = (0, import_shared.getRequestContext)();
    ctx?.incrementInternalSubrequests();
    if (typeof key !== "string") {
      throw new TypeError("Failed to execute 'delete'" + keyTypeError);
    }
    validateKey("DELETE", key);
    await (0, import_shared.waitForOpenOutputGate)();
    await this.#storage.delete(key);
    await (0, import_shared.waitForOpenInputGate)();
    ctx?.advanceCurrentTime();
  }
  async list({
    prefix = "",
    limit = MAX_LIST_KEYS,
    cursor
  } = {}) {
    if (this.#blockGlobalAsyncIO)
      (0, import_shared.assertInRequest)();
    const ctx = (0, import_shared.getRequestContext)();
    ctx?.incrementInternalSubrequests();
    if (isNaN(limit) || limit < 1) {
      throwKVError("GET", 400, `Invalid key_count_limit of ${limit}. Please specify an integer greater than 0.`);
    }
    if (limit > MAX_LIST_KEYS) {
      throwKVError("GET", 400, `Invalid key_count_limit of ${limit}. Please specify an integer less than ${MAX_LIST_KEYS}.`);
    }
    const res = await this.#storage.list({ prefix, limit, cursor });
    await (0, import_shared.waitForOpenInputGate)();
    ctx?.advanceCurrentTime();
    return {
      keys: res.keys,
      cursor: res.cursor,
      list_complete: res.cursor === ""
    };
  }
};

// packages/kv/src/plugin.ts
var import_shared2 = __toModule(require("@miniflare/shared"));
var KVPlugin = class extends import_shared2.Plugin {
  kvNamespaces;
  kvPersist;
  #persist;
  constructor(ctx, options) {
    super(ctx);
    this.assignOptions(options);
    this.#persist = (0, import_shared2.resolveStoragePersist)(ctx.rootPath, this.kvPersist);
  }
  getNamespace(storage, namespace, blockGlobalAsyncIO = false) {
    return new KVNamespace(storage.storage(namespace, this.#persist), {
      blockGlobalAsyncIO
    });
  }
  setup(storageFactory) {
    const blockGlobalAsyncIO = !this.ctx.globalAsyncIO;
    const bindings = {};
    for (const namespace of this.kvNamespaces ?? []) {
      bindings[namespace] = this.getNamespace(storageFactory, namespace, blockGlobalAsyncIO);
    }
    return { bindings };
  }
};
__decorateClass([
  (0, import_shared2.Option)({
    type: import_shared2.OptionType.ARRAY,
    name: "kv",
    alias: "k",
    description: "KV namespace to bind",
    logName: "KV Namespaces",
    fromWrangler: ({ kv_namespaces }) => kv_namespaces?.map(({ binding }) => binding)
  })
], KVPlugin.prototype, "kvNamespaces", 2);
__decorateClass([
  (0, import_shared2.Option)({
    type: import_shared2.OptionType.BOOLEAN_STRING,
    description: "Persist KV data (to optional path)",
    logName: "KV Persistence",
    fromWrangler: ({ miniflare }) => miniflare?.kv_persist
  })
], KVPlugin.prototype, "kvPersist", 2);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KVNamespace,
  KVPlugin
});
//# sourceMappingURL=index.js.map
