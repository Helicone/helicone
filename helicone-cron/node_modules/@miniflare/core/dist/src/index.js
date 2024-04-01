var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// packages/core/src/index.ts
__export(exports, {
  AbortSignal: () => AbortSignal,
  BindingsPlugin: () => BindingsPlugin,
  Body: () => Body,
  BuildError: () => BuildError,
  BuildPlugin: () => BuildPlugin,
  CompressionStream: () => CompressionStream,
  CorePlugin: () => CorePlugin,
  DOMException: () => DOMException2,
  DOM_EXCEPTION_NAMES: () => DOM_EXCEPTION_NAMES,
  DecompressionStream: () => DecompressionStream,
  DigestStream: () => DigestStream,
  ExecutionContext: () => ExecutionContext,
  FetchError: () => FetchError,
  FetchEvent: () => FetchEvent,
  Fetcher: () => Fetcher,
  FixedLengthStream: () => FixedLengthStream,
  Headers: () => import_undici2.Headers,
  IdentityTransformStream: () => IdentityTransformStream,
  MiniflareCore: () => MiniflareCore,
  MiniflareCoreError: () => MiniflareCoreError,
  Navigator: () => Navigator,
  PluginStorageFactory: () => PluginStorageFactory,
  PromiseRejectionEvent: () => PromiseRejectionEvent,
  QueueEvent: () => QueueEvent,
  ReloadEvent: () => ReloadEvent,
  Request: () => Request,
  Response: () => Response,
  Router: () => Router,
  RouterError: () => RouterError,
  ScheduledController: () => ScheduledController,
  ScheduledEvent: () => ScheduledEvent,
  Scheduler: () => Scheduler,
  ServiceWorkerGlobalScope: () => ServiceWorkerGlobalScope,
  WorkerGlobalScope: () => WorkerGlobalScope,
  _buildUnknownProtocolWarning: () => _buildUnknownProtocolWarning,
  _deepEqual: () => _deepEqual,
  _getBodyLength: () => _getBodyLength,
  _getURLList: () => _getURLList,
  _headersFromIncomingRequest: () => _headersFromIncomingRequest,
  _isByteStream: () => _isByteStream,
  _kInner: () => _kInner,
  _kLoopHeader: () => _kLoopHeader,
  _populateBuildConfig: () => _populateBuildConfig,
  _urlFromRequestInput: () => _urlFromRequestInput,
  atob: () => atob,
  btoa: () => btoa,
  createCompatFetch: () => createCompatFetch,
  createCrypto: () => createCrypto,
  createDate: () => createDate,
  createFetchMock: () => createFetchMock,
  createTimer: () => createTimer,
  fetch: () => fetch,
  kAddModuleFetchListener: () => kAddModuleFetchListener,
  kAddModuleQueueListener: () => kAddModuleQueueListener,
  kAddModuleScheduledListener: () => kAddModuleScheduledListener,
  kDispatchFetch: () => kDispatchFetch,
  kDispatchQueue: () => kDispatchQueue,
  kDispatchScheduled: () => kDispatchScheduled,
  kDispose: () => kDispose,
  kWaitUntil: () => kWaitUntil2,
  logResponse: () => logResponse,
  withImmutableHeaders: () => withImmutableHeaders,
  withInputGating: () => withInputGating,
  withStringFormDataFiles: () => withStringFormDataFiles,
  withWaitUntil: () => withWaitUntil
});
var import_promises3 = __toModule(require("fs/promises"));
var import_path6 = __toModule(require("path"));
var import_url4 = __toModule(require("url"));
var import_shared12 = __toModule(require("@miniflare/shared"));

// node_modules/dequal/lite/index.mjs
var has = Object.prototype.hasOwnProperty;
function dequal(foo, bar) {
  var ctor, len;
  if (foo === bar)
    return true;
  if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
    if (ctor === Date)
      return foo.getTime() === bar.getTime();
    if (ctor === RegExp)
      return foo.toString() === bar.toString();
    if (ctor === Array) {
      if ((len = foo.length) === bar.length) {
        while (len-- && dequal(foo[len], bar[len]))
          ;
      }
      return len === -1;
    }
    if (!ctor || typeof foo === "object") {
      len = 0;
      for (ctor in foo) {
        if (has.call(foo, ctor) && ++len && !has.call(bar, ctor))
          return false;
        if (!(ctor in bar) || !dequal(foo[ctor], bar[ctor]))
          return false;
      }
      return Object.keys(bar).length === len;
    }
  }
  return foo !== foo && bar !== bar;
}

// packages/core/src/index.ts
var import_colors2 = __toModule(require("kleur/colors"));

// packages/core/src/error.ts
var import_shared = __toModule(require("@miniflare/shared"));
var MiniflareCoreError = class extends import_shared.MiniflareError {
};

// packages/core/src/helpers.ts
var import_path = __toModule(require("path"));
function pathsToString(set) {
  return [...set].map((filePath) => import_path.default.relative("", filePath)).sort().join(", ");
}
function formatSize(bytes) {
  if (bytes >= 524288)
    return `${(bytes / 1048576).toFixed(2)}MiB`;
  if (bytes >= 512)
    return `${(bytes / 1024).toFixed(2)}KiB`;
  return `${bytes}B`;
}

// packages/core/src/plugins/bindings.ts
var import_assert2 = __toModule(require("assert"));
var import_promises = __toModule(require("fs/promises"));
var import_path2 = __toModule(require("path"));
var import_shared8 = __toModule(require("@miniflare/shared"));
var import_dotenv = __toModule(require("dotenv"));

// packages/core/src/standards/crypto.ts
var import_crypto = __toModule(require("crypto"));
var import_web = __toModule(require("stream/web"));
var import_core = __toModule(require("@miniflare/core"));
var import_shared3 = __toModule(require("@miniflare/shared"));

// packages/core/src/standards/helpers.ts
var import_shared2 = __toModule(require("@miniflare/shared"));
function isBufferSource(chunk) {
  return chunk instanceof ArrayBuffer || ArrayBuffer.isView(chunk);
}
function bufferSourceToArray(chunk) {
  if (chunk instanceof Uint8Array) {
    return chunk;
  } else if (chunk instanceof ArrayBuffer) {
    return new Uint8Array(chunk);
  } else {
    return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  }
}
function buildNotBufferSourceError(value) {
  const isString = typeof value === "string";
  return "This TransformStream is being used as a byte stream, but received " + (isString ? "a string on its writable side. If you wish to write a string, you'll probably want to explicitly UTF-8-encode it with TextEncoder." : "an object of non-ArrayBuffer/ArrayBufferView type on its writable side.");
}
function assertsInRequest(func, assert4) {
  return assert4 ? (...args) => {
    (0, import_shared2.assertInRequest)();
    return func(...args);
  } : func;
}

// packages/core/src/standards/crypto.ts
var supportedDigests = ["sha-1", "sha-256", "sha-384", "sha-512", "md5"];
var DigestStream = class extends import_web.WritableStream {
  digest;
  constructor(algorithm) {
    let name = typeof algorithm === "string" ? algorithm : algorithm?.name;
    if (!(name && supportedDigests.includes(name.toLowerCase()))) {
      throw new import_core.DOMException("Unrecognized name.", "NotSupportedError");
    }
    name = name.replace("-", "");
    let digestResolve;
    const digest2 = new Promise((r) => digestResolve = r);
    const hash = (0, import_crypto.createHash)(name);
    super({
      write(chunk) {
        if (isBufferSource(chunk)) {
          hash.update(bufferSourceToArray(chunk));
        } else {
          throw new TypeError(buildNotBufferSourceError(chunk));
        }
      },
      close() {
        digestResolve((0, import_shared3.viewToBuffer)(hash.digest()));
      }
    });
    this.digest = digest2;
  }
};
var usesModernEd25519 = (async () => {
  try {
    await import_crypto.webcrypto.subtle.generateKey({ name: "Ed25519", namedCurve: "Ed25519" }, false, ["sign", "verify"]);
    return true;
  } catch {
    return false;
  }
})();
async function ensureValidNodeAlgorithm(algorithm) {
  if (typeof algorithm === "object" && algorithm.name === "NODE-ED25519" && "namedCurve" in algorithm && algorithm.namedCurve === "NODE-ED25519" && await usesModernEd25519) {
    return { name: "Ed25519", namedCurve: "Ed25519" };
  }
  return algorithm;
}
function ensureValidWorkerKey(key) {
  if (key.algorithm.name === "Ed25519")
    key.algorithm.name = "NODE-ED25519";
  return key;
}
async function ensureValidNodeKey(key) {
  if (key.algorithm.name === "NODE-ED25519" && await usesModernEd25519) {
    return new Proxy(key, {
      get(target, property, receiver) {
        if (property === "algorithm")
          return { name: "Ed25519" };
        return Reflect.get(target, property, receiver);
      }
    });
  }
  return key;
}
var digest = function(algorithm, data) {
  const name = typeof algorithm === "string" ? algorithm : algorithm?.name;
  if (name?.toLowerCase() == "md5") {
    if (data instanceof ArrayBuffer)
      data = new Uint8Array(data);
    const hash = (0, import_crypto.createHash)("md5").update(data);
    return Promise.resolve((0, import_shared3.viewToBuffer)(hash.digest()));
  }
  return import_crypto.webcrypto.subtle.digest(algorithm, data);
};
var generateKey = async function(algorithm, extractable, keyUsages) {
  algorithm = await ensureValidNodeAlgorithm(algorithm);
  const key = await import_crypto.webcrypto.subtle.generateKey(algorithm, extractable, keyUsages);
  if (key instanceof import_crypto.webcrypto.CryptoKey) {
    return ensureValidWorkerKey(key);
  } else {
    key.publicKey = ensureValidWorkerKey(key.publicKey);
    key.privateKey = ensureValidWorkerKey(key.privateKey);
    return key;
  }
};
var importKey = async function(format, keyData, algorithm, extractable, keyUsages) {
  const forcePublic = format === "raw" && typeof algorithm === "object" && algorithm.name === "NODE-ED25519" && "namedCurve" in algorithm && algorithm.namedCurve === "NODE-ED25519";
  algorithm = await ensureValidNodeAlgorithm(algorithm);
  if (forcePublic)
    algorithm.public = true;
  const key = await import_crypto.webcrypto.subtle.importKey(format, keyData, algorithm, extractable, keyUsages);
  return ensureValidWorkerKey(key);
};
var exportKey = async function(format, key) {
  key = await ensureValidNodeKey(key);
  return import_crypto.webcrypto.subtle.exportKey(format, key);
};
var sign = async function(algorithm, key, data) {
  algorithm = await ensureValidNodeAlgorithm(algorithm);
  key = await ensureValidNodeKey(key);
  return import_crypto.webcrypto.subtle.sign(algorithm, key, data);
};
var verify = async function(algorithm, key, signature, data) {
  algorithm = await ensureValidNodeAlgorithm(algorithm);
  key = await ensureValidNodeKey(key);
  return import_crypto.webcrypto.subtle.verify(algorithm, key, signature, data);
};
function createCrypto(blockGlobalRandom = false) {
  const assertingGetRandomValues = assertsInRequest(import_crypto.webcrypto.getRandomValues.bind(import_crypto.webcrypto), blockGlobalRandom);
  const assertingGenerateKey = assertsInRequest(generateKey, blockGlobalRandom);
  const subtle = new Proxy(import_crypto.webcrypto.subtle, {
    get(target, propertyKey, receiver) {
      if (propertyKey === "digest")
        return digest;
      if (propertyKey === "generateKey")
        return assertingGenerateKey;
      if (propertyKey === "importKey")
        return importKey;
      if (propertyKey === "exportKey")
        return exportKey;
      if (propertyKey === "sign")
        return sign;
      if (propertyKey === "verify")
        return verify;
      let result = Reflect.get(target, propertyKey, receiver);
      if (typeof result === "function")
        result = result.bind(import_crypto.webcrypto.subtle);
      return result;
    }
  });
  return new Proxy(import_crypto.webcrypto, {
    get(target, propertyKey, receiver) {
      if (propertyKey === "getRandomValues")
        return assertingGetRandomValues;
      if (propertyKey === "subtle")
        return subtle;
      if (propertyKey === "DigestStream")
        return DigestStream;
      let result = Reflect.get(target, propertyKey, receiver);
      if (typeof result === "function")
        result = result.bind(import_crypto.webcrypto);
      return result;
    }
  });
}

// packages/core/src/standards/date.ts
var import_shared4 = __toModule(require("@miniflare/shared"));
var originalDateNow = Date.now;
function requestContextNow() {
  return (0, import_shared4.getRequestContext)()?.currentTime ?? originalDateNow();
}
function createDate(actualTime = false) {
  if (actualTime)
    return Date;
  return new Proxy(Date, {
    construct(target, args, newTarget) {
      return Reflect.construct(target, args.length === 0 ? [requestContextNow()] : args, newTarget);
    },
    get(target, propertyKey, receiver) {
      if (propertyKey === "now")
        return requestContextNow;
      return Reflect.get(target, propertyKey, receiver);
    }
  });
}

// packages/core/src/standards/domexception.ts
var DOM_EXCEPTION_NAMES = {
  IndexSizeError: 1,
  DOMStringSizeError: 2,
  HierarchyRequestError: 3,
  WrongDocumentError: 4,
  InvalidCharacterError: 5,
  NoDataAllowedError: 6,
  NoModificationAllowedError: 7,
  NotFoundError: 8,
  NotSupportedError: 9,
  InUseAttributeError: 10,
  InvalidStateError: 11,
  SyntaxError: 12,
  InvalidModificationError: 13,
  NamespaceError: 14,
  InvalidAccessError: 15,
  ValidationError: 16,
  TypeMismatchError: 17,
  SecurityError: 18,
  NetworkError: 19,
  AbortError: 20,
  URLMismatchError: 21,
  QuotaExceededError: 22,
  TimeoutError: 23,
  InvalidNodeTypeError: 24,
  DataCloneError: 25
};
var DOMException2 = class extends Error {
  constructor(message, name = "Error") {
    super(message);
    this.name = name;
  }
  get code() {
    return DOM_EXCEPTION_NAMES[this.name] ?? 0;
  }
};
__publicField(DOMException2, "INDEX_SIZE_ERR", 1);
__publicField(DOMException2, "DOMSTRING_SIZE_ERR", 2);
__publicField(DOMException2, "HIERARCHY_REQUEST_ERR", 3);
__publicField(DOMException2, "WRONG_DOCUMENT_ERR", 4);
__publicField(DOMException2, "INVALID_CHARACTER_ERR", 5);
__publicField(DOMException2, "NO_DATA_ALLOWED_ERR", 6);
__publicField(DOMException2, "NO_MODIFICATION_ALLOWED_ERR", 7);
__publicField(DOMException2, "NOT_FOUND_ERR", 8);
__publicField(DOMException2, "NOT_SUPPORTED_ERR", 9);
__publicField(DOMException2, "INUSE_ATTRIBUTE_ERR", 10);
__publicField(DOMException2, "INVALID_STATE_ERR", 11);
__publicField(DOMException2, "SYNTAX_ERR", 12);
__publicField(DOMException2, "INVALID_MODIFICATION_ERR", 13);
__publicField(DOMException2, "NAMESPACE_ERR", 14);
__publicField(DOMException2, "INVALID_ACCESS_ERR", 15);
__publicField(DOMException2, "VALIDATION_ERR", 16);
__publicField(DOMException2, "TYPE_MISMATCH_ERR", 17);
__publicField(DOMException2, "SECURITY_ERR", 18);
__publicField(DOMException2, "NETWORK_ERR", 19);
__publicField(DOMException2, "ABORT_ERR", 20);
__publicField(DOMException2, "URL_MISMATCH_ERR", 21);
__publicField(DOMException2, "QUOTA_EXCEEDED_ERR", 22);
__publicField(DOMException2, "TIMEOUT_ERR", 23);
__publicField(DOMException2, "INVALID_NODE_TYPE_ERR", 24);
__publicField(DOMException2, "DATA_CLONE_ERR", 25);

// packages/core/src/standards/encoding.ts
var import_core2 = __toModule(require("@miniflare/core"));
function btoa(input) {
  input = `${input}`;
  for (let n = 0; n < input.length; n++) {
    if (input[n].charCodeAt(0) > 255) {
      throw new import_core2.DOMException("Invalid character", "InvalidCharacterError");
    }
  }
  return Buffer.from(input, "latin1").toString("base64");
}
var BASE_64_DIGITS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function atob(input) {
  input = `${input}`.replace(/[\t\n\f\r ]+/g, "");
  for (let n = 0; n < input.length; n++) {
    if (!BASE_64_DIGITS.includes(input[n])) {
      throw new import_core2.DOMException("Invalid character", "InvalidCharacterError");
    }
  }
  return Buffer.from(input, "base64").toString("latin1");
}

// packages/core/src/standards/event.ts
var import_shared6 = __toModule(require("@miniflare/shared"));
var import_undici3 = __toModule(require("undici"));

// packages/core/src/standards/http.ts
var import_assert = __toModule(require("assert"));
var import_http = __toModule(require("http"));
var import_web3 = __toModule(require("stream/web"));
var import_url = __toModule(require("url"));
var import_shared5 = __toModule(require("@miniflare/shared"));
var import_colors = __toModule(require("kleur/colors"));
var import_set_cookie_parser = __toModule(require("set-cookie-parser"));
var import_undici = __toModule(require("undici"));

// packages/core/src/standards/streams.ts
var import_web2 = __toModule(require("stream/web"));
var import_zlib = __toModule(require("zlib"));
function _isByteStream(stream) {
  for (const symbol of Object.getOwnPropertySymbols(stream)) {
    if (symbol.description === "kState") {
      const controller = stream[symbol].controller;
      return controller instanceof import_web2.ReadableByteStreamController;
    }
  }
  return false;
}
function convertToByteStream(stream, clone = false) {
  let reader;
  return new import_web2.ReadableStream({
    type: "bytes",
    start() {
      reader = stream.getReader();
    },
    async pull(controller) {
      let result = await reader.read();
      while (!result.done && result.value.byteLength === 0) {
        result = await reader.read();
      }
      if (result.done) {
        queueMicrotask(() => {
          controller.close();
          controller.byobRequest?.respond(0);
        });
      } else if (result.value.byteLength > 0) {
        if (clone)
          result.value = result.value.slice();
        controller.enqueue(result.value);
      }
    },
    cancel: (reason) => reader.cancel(reason)
  });
}
import_web2.ReadableStreamBYOBReader.prototype.readAtLeast = async function(bytes, view) {
  const { byteOffset, byteLength } = view;
  if (isNaN(bytes) || bytes <= 0) {
    throw new TypeError(`Requested invalid minimum number of bytes to read (${bytes}).`);
  }
  if (byteLength <= 0) {
    throw new TypeError('You must call read() on a "byob" reader with a positive-sized TypedArray object.');
  }
  if (bytes > byteLength) {
    throw new TypeError(`Minimum bytes to read (${bytes}) exceeds size of buffer (${byteLength}).`);
  }
  const proto = Object.getPrototypeOf(view);
  const bytesPerElement = proto.BYTES_PER_ELEMENT ?? 1;
  const ctor = proto.constructor;
  let buffer = view.buffer;
  let read = 0;
  let done = false;
  while (read < byteLength && read < bytes) {
    const result = await this.read(new ctor(buffer, byteOffset + read, (byteLength - read) / bytesPerElement));
    if (result.value) {
      buffer = result.value.buffer;
      read += result.value.byteLength;
    }
    if (result.done) {
      done = read === 0;
      break;
    }
  }
  const value = new ctor(buffer, byteOffset, read / bytesPerElement);
  return { value, done };
};
var originalTee = import_web2.ReadableStream.prototype.tee;
import_web2.ReadableStream.prototype.tee = function() {
  if (!(this instanceof import_web2.ReadableStream)) {
    throw new TypeError("Illegal invocation");
  }
  if (_isByteStream(this)) {
    const [stream1, stream2] = originalTee.call(this);
    return [
      convertToByteStream(stream1, true),
      convertToByteStream(stream2, true)
    ];
  } else {
    return originalTee.call(this);
  }
};
var kTransformHook = Symbol("kTransformHook");
var kFlushHook = Symbol("kFlushHook");
var IdentityTransformStream = class extends import_web2.TransformStream {
  #readableByteStream;
  [kTransformHook];
  [kFlushHook];
  constructor() {
    super({
      transform: (chunk, controller) => {
        if (isBufferSource(chunk)) {
          const array = bufferSourceToArray(chunk);
          if (this[kTransformHook]?.(array, controller) === false)
            return;
          controller.enqueue(array);
        } else {
          controller.error(new TypeError(buildNotBufferSourceError(chunk)));
        }
      },
      flush: (controller) => this[kFlushHook]?.(controller)
    });
  }
  get readable() {
    if (this.#readableByteStream !== void 0)
      return this.#readableByteStream;
    return this.#readableByteStream = convertToByteStream(super.readable);
  }
};
var kContentLength = Symbol("kContentLength");
var FixedLengthStream = class extends IdentityTransformStream {
  #expectedLength;
  #bytesWritten = 0;
  constructor(expectedLength) {
    super();
    if (typeof expectedLength !== "number" || expectedLength < 0) {
      throw new TypeError("FixedLengthStream requires a non-negative integer expected length.");
    }
    this.#expectedLength = expectedLength;
    Object.defineProperty(this.readable, kContentLength, {
      value: expectedLength
    });
  }
  [kTransformHook] = (chunk, controller) => {
    this.#bytesWritten += chunk.byteLength;
    if (this.#bytesWritten > this.#expectedLength) {
      controller.error(new TypeError("Attempt to write too many bytes through a FixedLengthStream."));
      return false;
    }
    return true;
  };
  [kFlushHook] = (controller) => {
    if (this.#bytesWritten < this.#expectedLength) {
      controller.error(new TypeError("FixedLengthStream did not see all expected bytes before close()."));
    }
  };
};
function createTransformerFromTransform(transform) {
  return {
    start(controller) {
      transform.on("data", (chunk) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      transform.on("error", (error) => {
        controller.error(error);
      });
    },
    transform(chunk) {
      transform.write(chunk);
    },
    flush() {
      return new Promise((resolve) => {
        transform.once("close", () => {
          transform.removeAllListeners();
          resolve();
        });
        transform.end();
      });
    }
  };
}
var CompressionStream = class extends import_web2.TransformStream {
  constructor(format) {
    if (format !== "gzip" && format !== "deflate") {
      throw new TypeError("The compression format must be either 'deflate' or 'gzip'.");
    }
    const transform = format === "gzip" ? import_zlib.default.createGzip() : import_zlib.default.createDeflate();
    super(createTransformerFromTransform(transform));
  }
};
var DecompressionStream = class extends import_web2.TransformStream {
  constructor(format) {
    if (format !== "gzip" && format !== "deflate") {
      throw new TypeError("The compression format must be either 'deflate' or 'gzip'.");
    }
    const transform = format === "gzip" ? import_zlib.default.createGunzip() : import_zlib.default.createInflate();
    super(createTransformerFromTransform(transform));
  }
};

// packages/core/src/standards/http.ts
var import_undici2 = __toModule(require("undici"));
var fetchSymbols = require("undici/lib/fetch/symbols.js");
var inspect = Symbol.for("nodejs.util.inspect.custom");
var nonEnumerable = Object.create(null);
nonEnumerable.enumerable = false;
function makeEnumerable(prototype, instance, keys) {
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
    descriptor.enumerable = true;
    Object.defineProperty(instance, key, descriptor);
  }
}
function unimplemented(klass, property) {
  throw new Error(`Failed to get the '${property}' property on '${klass}': the property is not implemented.`);
}
import_undici.Headers.prototype.getAll = function(key) {
  if (key.toLowerCase() !== "set-cookie") {
    throw new TypeError('getAll() can only be used with the header name "Set-Cookie".');
  }
  const value = this.get("set-cookie");
  return value ? (0, import_set_cookie_parser.splitCookiesString)(value) : [];
};
function _headersFromIncomingRequest(req) {
  const headers = new import_undici.Headers();
  for (const [name, values] of Object.entries(req.headers)) {
    if (name === "transfer-encoding" || name === "connection" || name === "keep-alive" || name === "expect") {
      continue;
    }
    if (Array.isArray(values)) {
      for (const value of values)
        headers.append(name, value);
    } else if (values !== void 0) {
      headers.append(name, values);
    }
  }
  return headers;
}
var _kInner = Symbol("kInner");
var kInputGated = Symbol("kInputGated");
var kFormDataFiles = Symbol("kFormDataFiles");
var kCloned = Symbol("kCloned");
var enumerableBodyKeys = ["body", "bodyUsed", "headers"];
var Body = class {
  [_kInner];
  [kInputGated] = false;
  [kFormDataFiles] = true;
  [kCloned] = false;
  #bodyStream;
  constructor(inner) {
    inner.headers[fetchSymbols.kGuard] = "none";
    this[_kInner] = inner;
    makeEnumerable(Body.prototype, this, enumerableBodyKeys);
    Object.defineProperty(this, _kInner, nonEnumerable);
    Object.defineProperty(this, kInputGated, nonEnumerable);
    Object.defineProperty(this, kFormDataFiles, nonEnumerable);
  }
  [inspect]() {
    return this[_kInner];
  }
  get headers() {
    return this[_kInner].headers;
  }
  get body() {
    const body = this[_kInner].body;
    if (body === null)
      return body;
    if (this.#bodyStream)
      return this.#bodyStream;
    (0, import_assert.default)(body instanceof import_web3.ReadableStream);
    if (!this[kInputGated] && _isByteStream(body)) {
      return this.#bodyStream = body;
    }
    let reader;
    const source = {
      type: "bytes",
      pull: async (controller) => {
        if (reader === void 0)
          reader = body.getReader();
        let { done, value } = await reader.read();
        while (!done && isBufferSource(value) && value.byteLength === 0) {
          ({ done, value } = await reader.read());
        }
        if (this[kInputGated])
          await (0, import_shared5.waitForOpenInputGate)();
        if (isBufferSource(value)) {
          if (value.byteLength) {
            let array = bufferSourceToArray(value);
            if (this[kCloned])
              array = array.slice();
            controller.enqueue(array);
          }
        } else if (value) {
          return controller.error(new TypeError(buildNotBufferSourceError(value)));
        }
        if (done) {
          controller.close();
          controller.byobRequest?.respond(0);
        }
      },
      cancel: (reason) => reader.cancel(reason)
    };
    return this.#bodyStream = new import_web3.ReadableStream(source);
  }
  get bodyUsed() {
    return this[_kInner].bodyUsed;
  }
  async arrayBuffer() {
    const body = await this[_kInner].arrayBuffer();
    if (this[kInputGated])
      await (0, import_shared5.waitForOpenInputGate)();
    return body;
  }
  async blob() {
    const body = await this[_kInner].blob();
    if (this[kInputGated])
      await (0, import_shared5.waitForOpenInputGate)();
    return body;
  }
  async formData() {
    const headers = {};
    for (const [key, value] of this.headers)
      headers[key.toLowerCase()] = value;
    if (headers["content-type"] === void 0) {
      throw new TypeError("Parsing a Body as FormData requires a Content-Type header.");
    }
    const formData = new import_undici.FormData();
    await new Promise(async (resolve) => {
      const Busboy = require("busboy");
      const busboy = Busboy({
        headers,
        preservePath: true
      });
      busboy.on("field", (name, value) => {
        formData.append(name, value);
      });
      busboy.on("file", (name, value, info) => {
        const { filename, encoding, mimeType } = info;
        const base64 = encoding.toLowerCase() === "base64";
        const chunks = [];
        let totalLength = 0;
        value.on("data", (chunk) => {
          if (base64)
            chunk = Buffer.from(chunk.toString(), "base64");
          chunks.push(chunk);
          totalLength += chunk.byteLength;
        });
        value.on("end", () => {
          if (this[kFormDataFiles]) {
            const file = new import_undici.File(chunks, filename, { type: mimeType });
            formData.append(name, file);
          } else {
            const text = Buffer.concat(chunks, totalLength).toString();
            formData.append(name, text);
          }
        });
      });
      busboy.on("finish", resolve);
      const body = this[_kInner].body;
      if (body !== null)
        for await (const chunk of body)
          busboy.write(chunk);
      busboy.end();
    });
    if (this[kInputGated])
      await (0, import_shared5.waitForOpenInputGate)();
    return formData;
  }
  async json() {
    const body = await this[_kInner].json();
    if (this[kInputGated])
      await (0, import_shared5.waitForOpenInputGate)();
    return body;
  }
  async text() {
    const body = await this[_kInner].text();
    if (this[kInputGated])
      await (0, import_shared5.waitForOpenInputGate)();
    return body;
  }
};
function withInputGating(body) {
  body[kInputGated] = true;
  return body;
}
function withStringFormDataFiles(body) {
  body[kFormDataFiles] = false;
  return body;
}
var enumerableRequestKeys = [
  "cf",
  "signal",
  "redirect",
  "url",
  "method"
];
var Request = class extends Body {
  #cf;
  constructor(input, init) {
    const cf = input instanceof Request ? input.#cf : init?.cf;
    if (input instanceof import_undici.Request && !init) {
      super(input);
    } else {
      if (input instanceof Request)
        input = input[_kInner];
      if (init instanceof Request)
        init = init[_kInner];
      if (init?.body instanceof ArrayBuffer) {
        init.body = init.body.slice(0);
      }
      super(new import_undici.Request(input, init));
    }
    this.#cf = cf ? (0, import_shared5.nonCircularClone)(cf) : void 0;
    const contentLength = init?.body?.[kContentLength];
    if (contentLength !== void 0) {
      this.headers.set("content-length", contentLength.toString());
    }
    makeEnumerable(Request.prototype, this, enumerableRequestKeys);
  }
  clone() {
    const innerClone = this[_kInner].clone();
    const clone = new Request(innerClone);
    clone[kInputGated] = this[kInputGated];
    clone[kFormDataFiles] = this[kFormDataFiles];
    clone.headers[fetchSymbols.kGuard] = this.headers[fetchSymbols.kGuard];
    clone.#cf = this.cf ? (0, import_shared5.nonCircularClone)(this.cf) : void 0;
    this[kCloned] = true;
    clone[kCloned] = true;
    return clone;
  }
  get method() {
    return this[_kInner].method;
  }
  get url() {
    return this[_kInner].url;
  }
  get redirect() {
    return this[_kInner].redirect;
  }
  get signal() {
    return this[_kInner].signal;
  }
  get cf() {
    return this.#cf;
  }
  get context() {
    return unimplemented("Request", "context");
  }
  get mode() {
    return unimplemented("Request", "mode");
  }
  get credentials() {
    return unimplemented("Request", "credentials");
  }
  get integrity() {
    return unimplemented("Request", "integrity");
  }
  get cache() {
    return unimplemented("Request", "cache");
  }
};
function withImmutableHeaders(body) {
  body.headers[fetchSymbols.kGuard] = "immutable";
  return body;
}
var kWaitUntil = Symbol("kWaitUntil");
var nullBodyStatus = [101, 204, 205, 304];
var enumerableResponseKeys = [
  "webSocket",
  "url",
  "redirected",
  "ok",
  "statusText",
  "status"
];
var Response = class extends Body {
  static redirect(url, status = 302) {
    const res = import_undici.Response.redirect(url, status);
    return new Response(res.body, res);
  }
  static json(data, init) {
    const res = import_undici.Response.json(data, init);
    return new Response(res.body, res);
  }
  #encodeBody;
  #status;
  #webSocket;
  [kWaitUntil];
  constructor(body, init) {
    let encodeBody;
    let status;
    let webSocket;
    if (init instanceof import_undici.Response && body === init.body) {
      super(init);
    } else {
      if (body instanceof ArrayBuffer) {
        body = body.slice(0);
      }
      if (init instanceof Response) {
        encodeBody = init.#encodeBody;
        status = init.#status;
        webSocket = init.#webSocket;
        init = init[_kInner];
      } else if (!(init instanceof import_undici.Response) && init) {
        encodeBody = init.encodeBody;
        if (init.webSocket) {
          if (init.status !== 101) {
            throw new RangeError("Responses with a WebSocket must have status code 101.");
          }
          status = init.status;
          webSocket = init.webSocket;
          init = { ...init, status: 200 };
        }
        if (nullBodyStatus.includes(init.status) && body === "")
          body = null;
      }
      super(new import_undici.Response(body, init));
    }
    encodeBody ??= "automatic";
    if (encodeBody !== "automatic" && encodeBody !== "manual") {
      throw new TypeError(`encodeBody: unexpected value: ${encodeBody}`);
    }
    this.#encodeBody = encodeBody;
    this.#status = status;
    this.#webSocket = webSocket;
    const contentLength = body?.[kContentLength];
    if (contentLength !== void 0) {
      this.headers.set("content-length", contentLength.toString());
    }
    makeEnumerable(Response.prototype, this, enumerableResponseKeys);
    Object.defineProperty(this, kWaitUntil, nonEnumerable);
  }
  clone() {
    if (this.#webSocket) {
      throw new TypeError("Cannot clone a response to a WebSocket handshake.");
    }
    const innerClone = this[_kInner].clone();
    const clone = new Response(innerClone.body, innerClone);
    clone[kInputGated] = this[kInputGated];
    clone[kFormDataFiles] = this[kFormDataFiles];
    clone.#encodeBody = this.#encodeBody;
    clone.#status = this.#status;
    clone[kWaitUntil] = this[kWaitUntil];
    this[kCloned] = true;
    clone[kCloned] = true;
    return clone;
  }
  get encodeBody() {
    return this.#encodeBody;
  }
  get webSocket() {
    return this.#webSocket;
  }
  waitUntil() {
    return this[kWaitUntil] ?? Promise.resolve([]);
  }
  get status() {
    return this.#status ?? this[_kInner].status;
  }
  get statusText() {
    return this[_kInner].statusText;
  }
  get ok() {
    return this[_kInner].ok;
  }
  get redirected() {
    return this[_kInner].redirected;
  }
  get url() {
    return this[_kInner].url;
  }
  get type() {
    return unimplemented("Response", "type");
  }
  get useFinalUrl() {
    return unimplemented("Response", "useFinalUrl");
  }
};
function withWaitUntil(res, waitUntil) {
  const resWaitUntil = res instanceof Response ? res : new Response(res.body, res);
  resWaitUntil[kWaitUntil] = waitUntil;
  return resWaitUntil;
}
function _getURLList(res) {
  return res[fetchSymbols.kState]?.urlList;
}
function _getBodyLength(res) {
  if (res instanceof Response)
    res = res[_kInner];
  return res[fetchSymbols.kState]?.body?.length ?? void 0;
}
var _kLoopHeader = "MF-Loop";
var kDefaultHeadersToRemove = [
  "accept",
  "accept-language",
  "sec-fetch-mode",
  "user-agent"
];
var methodsExpectingPayload = ["PUT", "POST", "PATCH"];
var MiniflareDispatcher = class extends import_undici.Dispatcher {
  constructor(inner, removeHeaders, options) {
    super(options);
    this.inner = inner;
    this.removeHeaders = removeHeaders;
  }
  dispatch(options, handler) {
    const headers = options.headers;
    if (headers) {
      (0, import_assert.default)(Array.isArray(headers));
      let i = 0;
      while (i < headers.length) {
        if (this.removeHeaders.includes(headers[i].toLowerCase())) {
          headers.splice(i, 2);
        } else {
          i += 2;
        }
      }
    }
    return this.inner.dispatch(options, handler);
  }
  close(...args) {
    return this.inner.close(...args);
  }
  destroy(...args) {
    return this.inner.destroy(...args);
  }
};
async function fetch(input, init) {
  const ctx = (0, import_shared5.getRequestContext)();
  ctx?.incrementExternalSubrequests();
  await (0, import_shared5.waitForOpenOutputGate)();
  if (input instanceof Request)
    input = input[_kInner];
  if (init instanceof Request)
    init = init[_kInner];
  const req = new import_undici.Request(input, init);
  req.headers[fetchSymbols.kGuard] = "none";
  req.headers.delete("host");
  req.headers.delete("cf-connecting-ip");
  req.headers.set(_kLoopHeader, String(ctx?.requestDepth ?? 1));
  if (!methodsExpectingPayload.includes(req.method) && req.headers.get("content-length") === "0") {
    req.headers.delete("content-length");
  }
  const removeHeaders = [];
  for (const header of kDefaultHeadersToRemove) {
    if (!req.headers.has(header))
      removeHeaders.push(header);
  }
  const dispatcher = new MiniflareDispatcher(this instanceof import_undici.Dispatcher ? this : (0, import_undici.getGlobalDispatcher)(), removeHeaders);
  const baseRes = await (0, import_undici.fetch)(req, { dispatcher });
  if (baseRes.redirected && ctx) {
    const urlList = _getURLList(baseRes);
    if (urlList)
      ctx.incrementExternalSubrequests(urlList.length - 1);
  }
  const res = new Response(nullBodyStatus.includes(baseRes.status) ? null : baseRes.body, baseRes);
  res.headers[fetchSymbols.kGuard] = "immutable";
  await (0, import_shared5.waitForOpenInputGate)();
  ctx?.advanceCurrentTime();
  return withInputGating(res);
}
function createFetchMock() {
  return new import_undici.MockAgent();
}
function _urlFromRequestInput(input) {
  if (input instanceof import_url.URL)
    return input;
  if (input instanceof Request || input instanceof import_undici.Request) {
    return new import_url.URL(input.url);
  }
  return new import_url.URL(input);
}
function _buildUnknownProtocolWarning(url) {
  let warning = "Worker passed an invalid URL to fetch(). URLs passed to fetch() must begin with either 'http:' or 'https:', not '" + url.protocol + "'. Due to a historical bug, any other protocol used here will be treated the same as 'http:'. We plan to correct this bug in the future, so please update your Worker to use 'http:' or 'https:' for all fetch() URLs.";
  if (url.protocol === "ws:" || url.protocol === "wss:") {
    warning += " Note that fetch() treats WebSockets as a special kind of HTTP request, therefore WebSockets should use 'http:'/'https:', not 'ws:'/'wss:'.";
  }
  return warning;
}
function createCompatFetch({
  log,
  compat,
  globalAsyncIO
}, inner = fetch) {
  const refusesUnknown = compat.isEnabled("fetch_refuses_unknown_protocols");
  const formDataFiles = compat.isEnabled("formdata_parser_supports_files");
  return async (input, init) => {
    if (!globalAsyncIO)
      (0, import_shared5.assertInRequest)();
    const url = _urlFromRequestInput(input);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      if (refusesUnknown) {
        throw new TypeError(`Fetch API cannot load: ${url.toString()}`);
      } else {
        log.warn(_buildUnknownProtocolWarning(url));
        if (init) {
          init = new Request(input, init);
        } else if (input instanceof import_undici.Request) {
          init = new Request(input);
        } else if (input instanceof Request) {
          init = input;
        }
        input = url.toString().replace(url.protocol, "http:");
      }
    }
    let res = await inner(input, init);
    if (!formDataFiles)
      res = withStringFormDataFiles(res);
    return res;
  };
}
function millisFromHRTime([seconds, nanoseconds]) {
  return `${((seconds * 1e9 + nanoseconds) / 1e6).toFixed(2)}ms`;
}
function millisFromCPUTime(microseconds) {
  return `${(microseconds / 1e3).toFixed(2)}ms`;
}
function colourFromHTTPStatus(status) {
  if (200 <= status && status < 300)
    return import_colors.green;
  if (400 <= status && status < 500)
    return import_colors.yellow;
  if (500 <= status)
    return import_colors.red;
  return import_colors.blue;
}
async function logResponse(log, {
  start,
  startCpu,
  method,
  url,
  status,
  waitUntil
}) {
  const cpuParts = [];
  const responseTime = millisFromHRTime(process.hrtime(start));
  if (startCpu !== void 0) {
    const responseTimeCpu = millisFromCPUTime(process.cpuUsage(startCpu).user);
    cpuParts.push((0, import_colors.dim)((0, import_colors.grey)(` (CPU: ~${responseTimeCpu}`)));
  }
  let waitUntilResponse;
  try {
    waitUntilResponse = await waitUntil;
  } catch (e) {
    waitUntilResponse = [""];
    log.error(e);
  }
  const waitUntilTime = millisFromHRTime(process.hrtime(start));
  if (startCpu !== void 0) {
    if (waitUntilResponse?.length) {
      const waitUntilTimeCpu = millisFromCPUTime(process.cpuUsage(startCpu).user);
      cpuParts.push((0, import_colors.dim)((0, import_colors.grey)(`, waitUntil: ~${waitUntilTimeCpu}`)));
    }
    cpuParts.push((0, import_colors.dim)((0, import_colors.grey)(")")));
  }
  log.log([
    `${(0, import_colors.bold)(method)} ${url} `,
    status ? colourFromHTTPStatus(status)(`${(0, import_colors.bold)(status)} ${import_http.default.STATUS_CODES[status]} `) : "",
    (0, import_colors.grey)(`(${responseTime}`),
    waitUntilResponse?.length ? (0, import_colors.grey)(`, waitUntil: ${waitUntilTime}`) : "",
    (0, import_colors.grey)(")"),
    ...cpuParts
  ].join(""));
}

// packages/core/src/standards/event.ts
var FetchError = class extends import_shared6.MiniflareError {
};
var SUGGEST_HANDLER = 'calling addEventListener("fetch", ...)';
var SUGGEST_HANDLER_MODULES = "exporting a default object containing a `fetch` function property";
var SUGGEST_RES = "calling `event.respondWith()` with a `Response` or `Promise<Response>` in your handler";
var SUGGEST_RES_MODULES = "returning a `Response` in your handler";
var SUGGEST_GLOBAL_BINDING_MODULES = "Attempted to access binding using global in modules.\nYou must use the 2nd `env` parameter passed to exported handlers/Durable Object constructors, or `context.env` with Pages Functions.";
var kResponse = Symbol("kResponse");
var kPassThrough = Symbol("kPassThrough");
var kWaitUntil2 = Symbol("kWaitUntil");
var kSent = Symbol("kSent");
var FetchEvent = class extends Event {
  request;
  [kResponse];
  [kPassThrough] = false;
  [kWaitUntil2] = [];
  [kSent] = false;
  constructor(type, init) {
    super(type);
    this.request = init.request;
  }
  respondWith(response) {
    if (!(this instanceof FetchEvent)) {
      throw new TypeError("Illegal invocation");
    }
    if (this[kResponse]) {
      throw new DOMException2("FetchEvent.respondWith() has already been called; it can only be called once.", "InvalidStateError");
    }
    if (this[kSent]) {
      throw new DOMException2("Too late to call FetchEvent.respondWith(). It must be called synchronously in the event handler.", "InvalidStateError");
    }
    this.stopImmediatePropagation();
    this[kResponse] = Promise.resolve(response);
  }
  passThroughOnException() {
    if (!(this instanceof FetchEvent)) {
      throw new TypeError("Illegal invocation");
    }
    this[kPassThrough] = true;
  }
  waitUntil(promise) {
    if (!(this instanceof FetchEvent)) {
      throw new TypeError("Illegal invocation");
    }
    this[kWaitUntil2].push(Promise.resolve(promise));
  }
};
var ScheduledEvent = class extends Event {
  scheduledTime;
  cron;
  [kWaitUntil2] = [];
  constructor(type, init) {
    super(type);
    this.scheduledTime = init.scheduledTime;
    this.cron = init.cron;
  }
  waitUntil(promise) {
    if (!(this instanceof ScheduledEvent)) {
      throw new TypeError("Illegal invocation");
    }
    this[kWaitUntil2].push(promise);
  }
};
var QueueEvent = class extends Event {
  batch;
  [kWaitUntil2] = [];
  constructor(type, init) {
    super(type);
    this.batch = init.batch;
  }
  waitUntil(promise) {
    if (!(this instanceof QueueEvent)) {
      throw new TypeError("Illegal invocation");
    }
    this[kWaitUntil2].push(promise);
  }
};
var ExecutionContext = class {
  #event;
  constructor(event) {
    this.#event = event;
  }
  passThroughOnException() {
    if (!(this instanceof ExecutionContext)) {
      throw new TypeError("Illegal invocation");
    }
    if (this.#event instanceof FetchEvent)
      this.#event.passThroughOnException();
  }
  waitUntil(promise) {
    if (!(this instanceof ExecutionContext)) {
      throw new TypeError("Illegal invocation");
    }
    this.#event.waitUntil(promise);
  }
};
var ScheduledController = class {
  constructor(scheduledTime, cron) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
  }
};
var kAddModuleFetchListener = Symbol("kAddModuleFetchListener");
var kAddModuleScheduledListener = Symbol("kAddModuleScheduledListener");
var kAddModuleQueueListener = Symbol("kAddModuleQueueListener");
var kDispatchFetch = Symbol("kDispatchFetch");
var kDispatchScheduled = Symbol("kDispatchScheduled");
var kDispatchQueue = Symbol("kDispatchQueue");
var kDispose = Symbol("kDispose");
var PromiseRejectionEvent = class extends Event {
  promise;
  reason;
  constructor(type, init) {
    super(type, { cancelable: true });
    this.promise = init.promise;
    this.reason = init.reason;
  }
};
function isSpecialEventType(type) {
  return type === "fetch" || type === "scheduled" || type === "trace" || type === "queue";
}
var WorkerGlobalScope = class extends import_shared6.ThrowingEventTarget {
};
var ServiceWorkerGlobalScope = class extends WorkerGlobalScope {
  #log;
  #bindings;
  #modules;
  #logUnhandledRejections;
  #calledAddFetchEventListener = false;
  #unhandledRejection;
  #rejectionHandled;
  global = this;
  self = this;
  constructor(log, globals, bindings, modules, logUnhandledRejections) {
    super();
    this.#log = log;
    this.#bindings = bindings;
    this.#modules = modules;
    this.#logUnhandledRejections = logUnhandledRejections;
    this.#unhandledRejection = {
      name: "unhandledRejection",
      set: new Set(),
      listener: this.#unhandledRejectionListener
    };
    this.#rejectionHandled = {
      name: "rejectionHandled",
      set: new Set(),
      listener: this.#rejectionHandledListener
    };
    if (this.#logUnhandledRejections) {
      this.#maybeAddPromiseListener(this.#unhandledRejection, true);
    }
    Object.assign(this, globals);
    if (modules) {
      for (const key of Object.keys(bindings)) {
        if (key === "__STATIC_CONTENT" || key === "__STATIC_CONTENT_MANIFEST") {
          break;
        }
        Object.defineProperty(this, key, {
          get() {
            throw new ReferenceError(`${key} is not defined.
${SUGGEST_GLOBAL_BINDING_MODULES}`);
          }
        });
      }
    } else {
      Object.assign(this, bindings);
    }
  }
  addEventListener = (type, listener, options) => {
    if (this.#modules && isSpecialEventType(type)) {
      return this.#log.warn(`When using module syntax, the '${type}' event handler should be declared as an exported function on the root module as opposed to using the global addEventListener().`);
    }
    if (type === "fetch")
      this.#calledAddFetchEventListener = true;
    if (type === "unhandledrejection" && listener) {
      this.#maybeAddPromiseListener(this.#unhandledRejection, listener);
    }
    if (type === "rejectionhandled" && listener) {
      this.#maybeAddPromiseListener(this.#rejectionHandled, listener);
    }
    super.addEventListener(type, listener, options);
  };
  removeEventListener = (type, listener, options) => {
    if (this.#modules && isSpecialEventType(type))
      return;
    if (type === "unhandledrejection" && listener) {
      this.#maybeRemovePromiseListener(this.#unhandledRejection, listener);
    }
    if (type === "rejectionhandled" && listener) {
      this.#maybeRemovePromiseListener(this.#rejectionHandled, listener);
    }
    super.removeEventListener(type, listener, options);
  };
  [kAddModuleFetchListener](listener) {
    this.#calledAddFetchEventListener = true;
    super.addEventListener("fetch", (e) => {
      const ctx = new ExecutionContext(e);
      const res = listener(e.request, this.#bindings, ctx);
      e.respondWith(res);
    });
  }
  [kAddModuleScheduledListener](listener) {
    super.addEventListener("scheduled", (e) => {
      const controller = new ScheduledController(e.scheduledTime, e.cron);
      const ctx = new ExecutionContext(e);
      const res = listener(controller, this.#bindings, ctx);
      if (res !== void 0)
        e.waitUntil(Promise.resolve(res));
    });
  }
  [kAddModuleQueueListener](listener) {
    super.addEventListener("queue", (e) => {
      const res = listener(e.batch, this.#bindings, new ExecutionContext(e));
      if (res !== void 0)
        e.waitUntil(Promise.resolve(res));
    });
  }
  async [kDispatchFetch](request, proxy = false) {
    const event = new FetchEvent("fetch", {
      request: proxy ? request.clone() : request
    });
    let res;
    try {
      super.dispatchEvent(event);
      res = await event[kResponse];
    } catch (e) {
      if (event[kPassThrough]) {
        this.#log.warn(e.stack);
      } else {
        throw e;
      }
    } finally {
      event[kSent] = true;
    }
    if (res !== void 0) {
      const validRes = res instanceof Response || res instanceof import_undici3.Response;
      if (!validRes) {
        const suggestion = this.#modules ? SUGGEST_RES_MODULES : SUGGEST_RES;
        throw new FetchError("ERR_RESPONSE_TYPE", `Fetch handler didn't respond with a Response object.
Make sure you're ${suggestion}.`);
      }
      const waitUntil2 = Promise.all(event[kWaitUntil2]);
      return withWaitUntil(res, waitUntil2);
    }
    if (!proxy) {
      if (event[kPassThrough]) {
        throw new FetchError("ERR_NO_UPSTREAM", "No upstream to pass-through to specified.\nMake sure you've set the `upstream` option.");
      } else if (this.#calledAddFetchEventListener) {
        const suggestion = this.#modules ? SUGGEST_RES_MODULES : SUGGEST_RES;
        throw new FetchError("ERR_NO_RESPONSE", `No fetch handler responded and no upstream to proxy to specified.
Make sure you're ${suggestion}.`);
      } else {
        const suggestion = this.#modules ? SUGGEST_HANDLER_MODULES : SUGGEST_HANDLER;
        throw new FetchError("ERR_NO_HANDLER", `No fetch handler defined and no upstream to proxy to specified.
Make sure you're ${suggestion}.`);
      }
    }
    const waitUntil = Promise.all(event[kWaitUntil2]);
    return withWaitUntil(await fetch(request), waitUntil);
  }
  async [kDispatchScheduled](scheduledTime, cron) {
    const event = new ScheduledEvent("scheduled", {
      scheduledTime: scheduledTime ?? Date.now(),
      cron: cron ?? ""
    });
    super.dispatchEvent(event);
    return await Promise.all(event[kWaitUntil2]);
  }
  async [kDispatchQueue](batch) {
    const event = new QueueEvent("queue", { batch });
    super.dispatchEvent(event);
    return await Promise.all(event[kWaitUntil2]);
  }
  #maybeAddPromiseListener(listener, member) {
    if (listener.set.size === 0) {
      this.#log.verbose(`Adding process ${listener.name} listener...`);
      process.prependListener(listener.name, listener.listener);
    }
    listener.set.add(member);
  }
  #maybeRemovePromiseListener(listener, member) {
    const registered = listener.set.size > 0;
    listener.set.delete(member);
    if (registered && listener.set.size === 0) {
      this.#log.verbose(`Removing process ${listener.name} listener...`);
      process.removeListener(listener.name, listener.listener);
    }
  }
  #resetPromiseListener(listener) {
    if (listener.set.size > 0) {
      this.#log.verbose(`Removing process ${listener.name} listener...`);
      process.removeListener(listener.name, listener.listener);
    }
    listener.set.clear();
  }
  #unhandledRejectionListener = (reason, promise) => {
    const event = new PromiseRejectionEvent("unhandledrejection", {
      reason,
      promise
    });
    const notCancelled = super.dispatchEvent(event);
    if (notCancelled) {
      if (this.#logUnhandledRejections) {
        this.#log.error((0, import_shared6.prefixError)("Unhandled Promise Rejection", reason));
      } else {
        this.#resetPromiseListener(this.#unhandledRejection);
        Promise.reject(reason);
      }
    }
  };
  #rejectionHandledListener = (promise) => {
    const event = new PromiseRejectionEvent("rejectionhandled", { promise });
    super.dispatchEvent(event);
  };
  [kDispose]() {
    this.#resetPromiseListener(this.#unhandledRejection);
    this.#resetPromiseListener(this.#rejectionHandled);
  }
};

// packages/core/src/standards/navigator.ts
var Navigator = class {
  userAgent = "Cloudflare-Workers";
};

// packages/core/src/standards/timers.ts
var import_core3 = __toModule(require("@miniflare/core"));
var import_shared7 = __toModule(require("@miniflare/shared"));
function createTimer(func, blockGlobalTimers = false) {
  return (callback, ms, ...args) => {
    if (blockGlobalTimers)
      (0, import_shared7.assertInRequest)();
    return func(callback ? async (...args2) => {
      await (0, import_shared7.waitForOpenInputGate)();
      callback?.(...args2);
    } : callback, ms, ...args);
  };
}
var AbortSignal = globalThis.AbortSignal ?? Object.getPrototypeOf(new AbortController().signal).constructor;
AbortSignal.timeout = function(ms) {
  if (arguments.length === 0) {
    throw new TypeError("Failed to execute 'timeout' on 'AbortSignal': parameter 1 is not of type 'integer'.");
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};
var Scheduler = class {
  #blockGlobalTimers;
  constructor(blockGlobalTimers = false) {
    this.#blockGlobalTimers = blockGlobalTimers;
  }
  wait(ms, options) {
    if (this.#blockGlobalTimers)
      (0, import_shared7.assertInRequest)();
    if (arguments.length === 0) {
      throw new TypeError("Failed to execute 'wait' on 'Scheduler': parameter 1 is not of type 'integer'.");
    }
    return new Promise((resolve, reject) => {
      let resolved = false;
      const timeout = setTimeout(() => (resolved = true) && resolve(), ms);
      options?.signal?.addEventListener("abort", () => {
        if (resolved)
          return;
        clearTimeout(timeout);
        reject(new import_core3.DOMException("The operation was aborted", "AbortError"));
      });
    });
  }
};

// packages/core/src/plugins/bindings.ts
var kWranglerBindings = Symbol("kWranglerBindings");
var Fetcher = class {
  #service;
  #getServiceFetch;
  #defaultUsageModel;
  constructor(service, getServiceFetch, defaultUsageModel) {
    this.#service = service;
    this.#getServiceFetch = getServiceFetch;
    this.#defaultUsageModel = defaultUsageModel;
  }
  async fetch(input, init) {
    if (!(this instanceof Fetcher)) {
      throw new TypeError("Illegal invocation");
    }
    const req = new Request(input, init);
    let fetch2;
    let usageModel = this.#defaultUsageModel;
    if (typeof this.#service === "function") {
      fetch2 = this.#service;
    } else {
      const serviceFetch = await this.#getServiceFetch(this.#service);
      fetch2 = serviceFetch.fetch;
      usageModel = serviceFetch.usageModel;
    }
    const parentCtx = (0, import_shared8.getRequestContext)();
    const requestDepth = parentCtx?.requestDepth ?? 1;
    const pipelineDepth = (parentCtx?.pipelineDepth ?? 0) + 1;
    const ctx = new import_shared8.RequestContext({
      requestDepth,
      pipelineDepth,
      externalSubrequestLimit: (0, import_shared8.usageModelExternalSubrequestLimit)(usageModel)
    });
    const res = await ctx.runWith(() => fetch2(req));
    return withImmutableHeaders(res);
  }
};
function getServiceBindingName(log, service, { name, binding }) {
  if (name !== void 0 && binding !== void 0 && name !== binding) {
    throw new MiniflareCoreError("ERR_SERVICE_NAME_MISMATCH", `Service "${service}" declared with \`name\`="${name}" and \`binding\`="${binding}".
The \`binding\` key should be used to define binding names.`);
  }
  if (name !== void 0) {
    log.warn(`Service "${service}" declared using deprecated syntax.
The \`name\` key should be removed and renamed to \`binding\`.`);
    return name;
  }
  if (binding !== void 0)
    return binding;
  throw new MiniflareCoreError("ERR_SERVICE_NO_NAME", `Service "${service}" declared with neither \`binding\` nor \`name\` keys.
The \`binding\` key should be used to define binding names.`);
}
var _a;
var BindingsPlugin = class extends import_shared8.Plugin {
  envPath;
  [_a = kWranglerBindings];
  envPathDefaultFallback;
  bindings;
  globals;
  wasmBindings;
  textBlobBindings;
  dataBlobBindings;
  serviceBindings;
  #processedServiceBindings;
  #contextPromise;
  #contextResolve;
  #mounts;
  constructor(ctx, options) {
    super(ctx);
    this.assignOptions(options);
    if (this.envPathDefaultFallback && this.envPath === void 0) {
      this.envPath = true;
    }
    this.#processedServiceBindings = Object.entries(this.serviceBindings ?? {}).map(([name, options2]) => {
      const service = typeof options2 === "object" ? options2.service : options2;
      const environment = typeof options2 === "object" && options2.environment || "production";
      return { name, service, environment };
    });
    if (this.#processedServiceBindings.length) {
      ctx.log.warn("Service bindings are experimental. There may be breaking changes in the future.");
    }
  }
  #getServiceFetch = async (service) => {
    (0, import_assert2.default)(this.#contextPromise, "beforeReload() must be called before #getServiceFetch()");
    await this.#contextPromise;
    const mount = this.#mounts?.get(service);
    (0, import_assert2.default)(mount?.dispatchFetch);
    return { fetch: mount.dispatchFetch, usageModel: mount.usageModel };
  };
  async setup() {
    const bindings = {};
    const watch = [];
    Object.assign(bindings, this[kWranglerBindings]);
    let envPath = this.envPath === true ? ".env" : this.envPath;
    if (envPath) {
      envPath = import_path2.default.resolve(this.ctx.rootPath, envPath);
      try {
        Object.assign(bindings, import_dotenv.default.parse(await import_promises.default.readFile(envPath, "utf8")));
      } catch (e) {
        if (!(e.code === "ENOENT" && this.envPath === true))
          throw e;
      }
      watch.push(envPath);
    }
    if (this.wasmBindings) {
      for (let [name, wasmPath] of Object.entries(this.wasmBindings)) {
        wasmPath = import_path2.default.resolve(this.ctx.rootPath, wasmPath);
        bindings[name] = new WebAssembly.Module(await import_promises.default.readFile(wasmPath));
        watch.push(wasmPath);
      }
    }
    if (this.textBlobBindings) {
      for (let [name, textPath] of Object.entries(this.textBlobBindings)) {
        textPath = import_path2.default.resolve(this.ctx.rootPath, textPath);
        bindings[name] = await import_promises.default.readFile(textPath, "utf-8");
        watch.push(textPath);
      }
    }
    if (this.dataBlobBindings) {
      for (let [name, dataPath] of Object.entries(this.dataBlobBindings)) {
        dataPath = import_path2.default.resolve(this.ctx.rootPath, dataPath);
        const fileContent = await import_promises.default.readFile(dataPath);
        bindings[name] = (0, import_shared8.viewToBuffer)(fileContent);
        watch.push(dataPath);
      }
    }
    for (const { name, service } of this.#processedServiceBindings) {
      bindings[name] = new Fetcher(service, this.#getServiceFetch, this.ctx.usageModel);
    }
    Object.assign(bindings, this.bindings);
    return { globals: this.globals, bindings, watch };
  }
  beforeReload() {
    this.#mounts = void 0;
    this.#contextPromise = new Promise((resolve) => this.#contextResolve = resolve);
  }
  reload(bindings, moduleExports, mounts) {
    for (const { name, service } of this.#processedServiceBindings) {
      if (typeof service === "string" && !mounts.has(service)) {
        throw new MiniflareCoreError("ERR_SERVICE_NOT_MOUNTED", `Service "${service}" for binding "${name}" not found.
Make sure "${service}" is mounted so Miniflare knows where to find it.`);
      }
    }
    this.#mounts = mounts;
    (0, import_assert2.default)(this.#contextResolve, "beforeReload() must be called before reload()");
    this.#contextResolve();
  }
  dispose() {
    return this.beforeReload();
  }
};
__decorateClass([
  (0, import_shared8.Option)({
    type: import_shared8.OptionType.STRING,
    name: "env",
    alias: "e",
    description: "Path to .env file",
    logValue(value) {
      if (value === true)
        return ".env";
      if (value === false)
        return void 0;
      return import_path2.default.relative("", value);
    },
    fromWrangler: ({ miniflare }) => miniflare?.env_path
  })
], BindingsPlugin.prototype, "envPath", 2);
__decorateClass([
  (0, import_shared8.Option)({
    type: import_shared8.OptionType.OBJECT,
    logName: "Wrangler Variables",
    fromWrangler: ({ vars }) => {
      if (!vars)
        return;
      return Object.fromEntries(Object.entries(vars).map(([key, value]) => [key, String(value)]));
    }
  })
], BindingsPlugin.prototype, _a, 2);
__decorateClass([
  (0, import_shared8.Option)({ type: import_shared8.OptionType.NONE })
], BindingsPlugin.prototype, "envPathDefaultFallback", 2);
__decorateClass([
  (0, import_shared8.Option)({
    type: import_shared8.OptionType.OBJECT,
    alias: "b",
    description: "Binds variable/secret to environment",
    logName: "Custom Bindings"
  })
], BindingsPlugin.prototype, "bindings", 2);
__decorateClass([
  (0, import_shared8.Option)({
    type: import_shared8.OptionType.OBJECT,
    description: "Binds variable/secret to global scope",
    logName: "Custom Globals",
    fromWrangler: ({ miniflare }) => miniflare?.globals
  })
], BindingsPlugin.prototype, "globals", 2);
__decorateClass([
  (0, import_shared8.Option)({
    type: import_shared8.OptionType.OBJECT,
    typeFormat: "NAME=PATH",
    name: "wasm",
    description: "WASM module to bind",
    logName: "WASM Bindings",
    fromWrangler: ({ wasm_modules }) => wasm_modules
  })
], BindingsPlugin.prototype, "wasmBindings", 2);
__decorateClass([
  (0, import_shared8.Option)({
    type: import_shared8.OptionType.OBJECT,
    typeFormat: "NAME=PATH",
    name: "text-blob",
    description: "Text blob to bind",
    logName: "Text Blob Bindings",
    fromWrangler: ({ text_blobs }) => text_blobs
  })
], BindingsPlugin.prototype, "textBlobBindings", 2);
__decorateClass([
  (0, import_shared8.Option)({
    type: import_shared8.OptionType.OBJECT,
    typeFormat: "NAME=PATH",
    name: "data-blob",
    description: "Data blob to bind",
    logName: "Data Blob Bindings",
    fromWrangler: ({ data_blobs }) => data_blobs
  })
], BindingsPlugin.prototype, "dataBlobBindings", 2);
__decorateClass([
  (0, import_shared8.Option)({
    type: import_shared8.OptionType.OBJECT,
    typeFormat: "NAME=MOUNT[@ENV]",
    name: "service",
    alias: "S",
    description: "Mounted service to bind",
    fromEntries: (entries) => Object.fromEntries(entries.map(([name, serviceEnvironment]) => {
      const atIndex = serviceEnvironment.indexOf("@");
      if (atIndex === -1) {
        return [name, serviceEnvironment];
      } else {
        const service = serviceEnvironment.substring(0, atIndex);
        const environment = serviceEnvironment.substring(atIndex + 1);
        return [name, { service, environment }];
      }
    })),
    fromWrangler: ({ services, experimental_services }, configDir, log) => {
      if (experimental_services) {
        log.warn("Using the `experimental_services` key is deprecated. This key should be renamed to `services`.");
      }
      const allServices = [];
      if (services)
        allServices.push(...services);
      if (experimental_services)
        allServices.push(...experimental_services);
      return allServices?.reduce((services2, { name, binding, service, environment }) => {
        services2[getServiceBindingName(log, service, { name, binding })] = {
          service,
          environment
        };
        return services2;
      }, {});
    }
  })
], BindingsPlugin.prototype, "serviceBindings", 2);

// packages/core/src/plugins/build.ts
var import_assert3 = __toModule(require("assert"));
var import_child_process = __toModule(require("child_process"));
var import_path3 = __toModule(require("path"));
var import_shared9 = __toModule(require("@miniflare/shared"));
var BuildError = class extends import_shared9.MiniflareError {
};
var BuildPlugin = class extends import_shared9.Plugin {
  buildCommand;
  buildBasePath;
  buildWatchPaths;
  constructor(ctx, options) {
    super(ctx);
    this.assignOptions(options);
  }
  beforeSetup() {
    const buildCommand = this.buildCommand;
    if (!buildCommand)
      return {};
    return new Promise((resolve, reject) => {
      const build = import_child_process.default.spawn(buildCommand, {
        cwd: this.buildBasePath ? import_path3.default.resolve(this.ctx.rootPath, this.buildBasePath) : this.ctx.rootPath,
        shell: true,
        stdio: "inherit",
        env: { ...process.env, MINIFLARE: "1" }
      });
      build.on("exit", (exitCode) => {
        if (exitCode !== 0) {
          const error = new BuildError(exitCode ?? 0, `Build failed with exit code ${exitCode}`);
          return reject(error);
        }
        this.ctx.log.info("Build succeeded");
        const watch = this.buildWatchPaths?.map((watchPath) => import_path3.default.resolve(this.ctx.rootPath, watchPath));
        resolve({ watch });
      });
    });
  }
};
__decorateClass([
  (0, import_shared9.Option)({
    type: import_shared9.OptionType.STRING,
    alias: "B",
    description: "Command to build project",
    fromWrangler: ({ build }) => build?.command
  })
], BuildPlugin.prototype, "buildCommand", 2);
__decorateClass([
  (0, import_shared9.Option)({
    type: import_shared9.OptionType.STRING,
    description: "Working directory for build command",
    fromWrangler: ({ build }) => build?.cwd
  })
], BuildPlugin.prototype, "buildBasePath", 2);
__decorateClass([
  (0, import_shared9.Option)({
    type: import_shared9.OptionType.ARRAY,
    description: "Directory to watch for rebuilding on changes",
    fromWrangler: ({ build, miniflare }) => {
      const watchPaths = miniflare?.build_watch_dirs ?? [];
      if (build?.watch_dir)
        watchPaths.push(build.watch_dir);
      if (watchPaths.length)
        return watchPaths;
      if (build?.command)
        return ["src"];
    }
  })
], BuildPlugin.prototype, "buildWatchPaths", 2);
function _populateBuildConfig(config, configDir, configEnv) {
  if (config.build || config.type !== "webpack" && config.type !== "rust") {
    return;
  }
  config.build = { cwd: configDir, upload: { dir: "" } };
  (0, import_assert3.default)(config.build.upload);
  const env = configEnv ? ` --env ${configEnv}` : "";
  if (config.type === "webpack") {
    let packageDir = "";
    if (config.site) {
      packageDir = config.site["entry-point"] ?? "workers-site";
    }
    config.build.command = `wrangler build${env}`;
    config.build.upload.main = import_path3.default.join(packageDir, "worker", "script.js");
    config.miniflare ??= {};
    config.miniflare.build_watch_dirs = ["src", "index.js"];
  } else if (config.type === "rust") {
    const rustScript = import_path3.default.join(__dirname, "plugins", "rust.js");
    config.build.command = `wrangler build${env} && ${process.execPath} ${rustScript}`;
    config.build.upload.main = import_path3.default.join("worker", "generated", "script.js");
    config.wasm_modules ??= {};
    config.wasm_modules.wasm = import_path3.default.join(configDir, "worker", "generated", "script.wasm");
  }
}

// packages/core/src/plugins/core.ts
var import_buffer = __toModule(require("buffer"));
var import_promises2 = __toModule(require("fs/promises"));
var import_path4 = __toModule(require("path"));
var import_web4 = __toModule(require("stream/web"));
var import_web5 = __toModule(require("stream/web"));
var import_url2 = __toModule(require("url"));
var import_util = __toModule(require("util"));
var import_shared10 = __toModule(require("@miniflare/shared"));
var import_undici4 = __toModule(require("undici"));
var import_urlpattern_polyfill = __toModule(require("urlpattern-polyfill"));
var DEFAULT_MODULE_RULES = [
  { type: "ESModule", include: ["**/*.mjs"] },
  { type: "CommonJS", include: ["**/*.js", "**/*.cjs"] }
];
function proxyStringFormDataFiles(klass) {
  return new Proxy(klass, {
    construct(target, args, newTarget) {
      const value = Reflect.construct(target, args, newTarget);
      return withStringFormDataFiles(value);
    }
  });
}
function proxyDisableStreamConstructor(klass) {
  return new Proxy(klass, {
    construct() {
      throw new Error(`To use the new ${klass.name}() constructor, enable the streams_enable_constructors feature flag.`);
    }
  });
}
function mapMountEntries([name, pathEnv], relativeTo) {
  let wranglerConfigEnv;
  const atIndex = pathEnv.lastIndexOf("@");
  if (atIndex !== -1) {
    wranglerConfigEnv = pathEnv.substring(atIndex + 1);
    pathEnv = pathEnv.substring(0, atIndex);
  }
  if (relativeTo)
    pathEnv = import_path4.default.resolve(relativeTo, pathEnv);
  return [
    name,
    {
      rootPath: pathEnv,
      wranglerConfigEnv,
      packagePath: true,
      envPathDefaultFallback: true,
      wranglerConfigPath: true
    }
  ];
}
var CorePlugin = class extends import_shared10.Plugin {
  script;
  scriptPath;
  wranglerConfigPath;
  wranglerConfigEnv;
  packagePath;
  modules;
  modulesRules;
  compatibilityDate;
  compatibilityFlags;
  usageModel;
  upstream;
  watch;
  debug;
  verbose;
  updateCheck;
  repl;
  rootPath;
  mounts;
  name;
  routes;
  logUnhandledRejections;
  fetchMock;
  globalAsyncIO;
  globalTimers;
  globalRandom;
  actualTime;
  inaccurateCpu;
  processedModuleRules = [];
  upstreamURL;
  #globals;
  constructor(ctx, options) {
    super(ctx);
    this.assignOptions(options);
    if (this.mounts && Object.keys(this.mounts).length) {
      ctx.log.warn("Mounts are experimental. There may be breaking changes in the future.");
    }
    const extraGlobals = {};
    let CompatRequest = Request;
    let CompatResponse = Response;
    if (!ctx.compat.isEnabled("formdata_parser_supports_files")) {
      CompatRequest = proxyStringFormDataFiles(Request);
      CompatResponse = proxyStringFormDataFiles(Response);
    }
    if (ctx.compat.isEnabled("global_navigator")) {
      extraGlobals.navigator = new Navigator();
      extraGlobals.Navigator = Navigator;
    }
    const enableStreamConstructors = ctx.compat.isEnabled("streams_enable_constructors");
    const enableTransformStreamConstructor = ctx.compat.isEnabled("transformstream_enable_standard_constructor");
    let CompatReadableStream = import_web4.ReadableStream;
    let CompatWritableStream = import_web4.WritableStream;
    let CompatTransformStream = import_web4.TransformStream;
    if (!enableStreamConstructors) {
      CompatReadableStream = proxyDisableStreamConstructor(import_web4.ReadableStream);
      CompatWritableStream = proxyDisableStreamConstructor(import_web4.WritableStream);
      if (enableTransformStreamConstructor) {
        CompatTransformStream = proxyDisableStreamConstructor(import_web4.TransformStream);
      }
    }
    if (!enableTransformStreamConstructor) {
      CompatTransformStream = new Proxy(IdentityTransformStream, {
        construct(target, args, newTarget) {
          if (args.length > 0) {
            ctx.log.warn("To use the new TransformStream() constructor with a custom transformer, enable the transformstream_enable_standard_constructor feature flag.");
          }
          return Reflect.construct(target, args, newTarget);
        }
      });
    }
    if (enableStreamConstructors) {
      extraGlobals.ReadableByteStreamController = import_web4.ReadableByteStreamController;
      extraGlobals.ReadableStreamBYOBRequest = import_web4.ReadableStreamBYOBRequest;
      extraGlobals.ReadableStreamDefaultController = import_web4.ReadableStreamDefaultController;
      extraGlobals.WritableStreamDefaultController = import_web4.WritableStreamDefaultController;
      if (enableTransformStreamConstructor) {
        extraGlobals.TransformStreamDefaultController = import_web4.TransformStreamDefaultController;
      }
    }
    try {
      this.upstreamURL = this.upstream === void 0 ? void 0 : new import_url2.URL(this.upstream);
    } catch (e) {
      throw new MiniflareCoreError("ERR_INVALID_UPSTREAM", `Invalid upstream URL: "${this.upstream}". Make sure you've included the protocol.`);
    }
    const blockGlobalTimers = !this.globalTimers;
    const crypto = createCrypto(!this.globalRandom);
    const CompressionStreamImpl = import_web5.default.CompressionStream ?? CompressionStream;
    const DecompressionStreamImpl = import_web5.default.DecompressionStream ?? DecompressionStream;
    if (this.inaccurateCpu) {
      ctx.log.warn("CPU time measurements are experimental, highly inaccurate and not representative of deployed worker performance.\nThey should only be used for relative comparisons and may be removed in the future.");
    }
    this.#globals = {
      console,
      setTimeout: createTimer(setTimeout, blockGlobalTimers),
      setInterval: createTimer(setInterval, blockGlobalTimers),
      clearTimeout: assertsInRequest(clearTimeout, blockGlobalTimers),
      clearInterval: assertsInRequest(clearInterval, blockGlobalTimers),
      queueMicrotask,
      scheduler: new Scheduler(blockGlobalTimers),
      atob,
      btoa,
      Math,
      crypto,
      CryptoKey: crypto.CryptoKey,
      TextDecoder: import_util.TextDecoder,
      TextEncoder: import_util.TextEncoder,
      fetch: createCompatFetch(ctx, fetch.bind(this.fetchMock)),
      Headers: import_undici4.Headers,
      Request: CompatRequest,
      Response: CompatResponse,
      FormData: import_undici4.FormData,
      Blob: import_buffer.Blob,
      File: import_undici4.File,
      URL: import_url2.URL,
      URLSearchParams: import_url2.URLSearchParams,
      URLPattern: import_urlpattern_polyfill.URLPattern,
      ReadableStream: CompatReadableStream,
      WritableStream: CompatWritableStream,
      TransformStream: CompatTransformStream,
      ReadableStreamBYOBReader: import_web4.ReadableStreamBYOBReader,
      ReadableStreamDefaultReader: import_web4.ReadableStreamDefaultReader,
      WritableStreamDefaultWriter: import_web4.WritableStreamDefaultWriter,
      ByteLengthQueuingStrategy: import_web4.ByteLengthQueuingStrategy,
      CountQueuingStrategy: import_web4.CountQueuingStrategy,
      IdentityTransformStream,
      FixedLengthStream,
      CompressionStream: CompressionStreamImpl,
      DecompressionStream: DecompressionStreamImpl,
      TextEncoderStream: import_web4.TextEncoderStream,
      TextDecoderStream: import_web4.TextDecoderStream,
      Event,
      EventTarget,
      AbortController,
      AbortSignal,
      FetchEvent,
      ScheduledEvent,
      DOMException: DOMException2,
      WorkerGlobalScope,
      structuredClone: globalThis.structuredClone ?? import_shared10.structuredCloneBuffer,
      Date: createDate(this.actualTime),
      ...extraGlobals,
      ArrayBuffer,
      Atomics,
      BigInt64Array,
      BigUint64Array,
      DataView,
      Float32Array,
      Float64Array,
      Int8Array,
      Int16Array,
      Int32Array,
      Map,
      Set,
      SharedArrayBuffer,
      Uint8Array,
      Uint8ClampedArray,
      Uint16Array,
      Uint32Array,
      WeakMap,
      WeakSet,
      WebAssembly,
      MINIFLARE: true
    };
    if (!this.modules)
      return;
    const finalisedTypes = new Set();
    for (const rule of [
      ...this.modulesRules ?? [],
      ...DEFAULT_MODULE_RULES
    ]) {
      if (finalisedTypes.has(rule.type))
        continue;
      this.processedModuleRules.push({
        type: rule.type,
        include: (0, import_shared10.globsToMatcher)(rule.include)
      });
      if (!rule.fallthrough)
        finalisedTypes.add(rule.type);
    }
  }
  async setup() {
    const globals = this.#globals;
    if (this.script !== void 0) {
      return {
        globals,
        script: { filePath: import_shared10.STRING_SCRIPT_PATH, code: this.script }
      };
    }
    const watch = [];
    let scriptPath = this.scriptPath;
    if (scriptPath === void 0) {
      let packagePath = this.packagePath === true ? "package.json" : this.packagePath;
      if (packagePath) {
        packagePath = import_path4.default.resolve(this.ctx.rootPath, packagePath);
        try {
          const pkg = JSON.parse(await import_promises2.default.readFile(packagePath, "utf8"));
          scriptPath = this.modules ? pkg.module : pkg.main;
          scriptPath &&= import_path4.default.resolve(import_path4.default.dirname(packagePath), scriptPath);
        } catch (e) {
          if (!(e.code === "ENOENT" && this.packagePath === true))
            throw e;
        }
        watch.push(packagePath);
      }
    }
    if (scriptPath !== void 0) {
      scriptPath = import_path4.default.resolve(this.ctx.rootPath, scriptPath);
      const code = await import_promises2.default.readFile(scriptPath, "utf8");
      watch.push(scriptPath);
      return { globals, script: { filePath: scriptPath, code }, watch };
    }
    return { globals, watch };
  }
};
__decorateClass([
  (0, import_shared10.Option)({ type: import_shared10.OptionType.NONE, logValue: () => import_shared10.STRING_SCRIPT_PATH })
], CorePlugin.prototype, "script", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.STRING_POSITIONAL,
    name: "script",
    fromWrangler: ({ build }, configDir) => build?.upload?.main ? import_path4.default.resolve(configDir, build?.upload?.dir ?? "dist", build.upload.main) : void 0
  })
], CorePlugin.prototype, "scriptPath", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.STRING,
    name: "wrangler-config",
    alias: "c",
    description: "Path to wrangler.toml",
    logValue(value) {
      if (value === true)
        return "wrangler.toml";
      if (value === false)
        return void 0;
      return import_path4.default.relative("", value);
    }
  })
], CorePlugin.prototype, "wranglerConfigPath", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.STRING,
    name: "wrangler-env",
    description: "Environment in wrangler.toml to use",
    logName: "Wrangler Environment"
  })
], CorePlugin.prototype, "wranglerConfigEnv", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.STRING,
    name: "package",
    description: "Path to package.json",
    logValue(value) {
      if (value === true)
        return "package.json";
      if (value === false)
        return void 0;
      return import_path4.default.relative("", value);
    }
  })
], CorePlugin.prototype, "packagePath", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.BOOLEAN,
    alias: "m",
    description: "Enable modules",
    fromWrangler: ({ build }) => build?.upload?.format && build.upload.format === "modules"
  })
], CorePlugin.prototype, "modules", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.OBJECT,
    typeFormat: "TYPE=GLOB",
    description: "Modules import rule",
    logValue: (value) => value.map((rule) => `{${rule.type}: ${rule.include.join(", ")}}`).join(", "),
    fromEntries: (entries) => entries.map(([type, include]) => ({
      type,
      include: [include],
      fallthrough: true
    })),
    fromWrangler: ({ build }) => build?.upload?.rules?.map(({ type, globs, fallthrough }) => ({
      type,
      include: globs,
      fallthrough
    }))
  })
], CorePlugin.prototype, "modulesRules", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.STRING,
    name: "compat-date",
    description: "Opt into backwards-incompatible changes from",
    fromWrangler: ({ compatibility_date }) => compatibility_date
  })
], CorePlugin.prototype, "compatibilityDate", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.ARRAY,
    name: "compat-flag",
    description: "Control specific backwards-incompatible changes",
    fromWrangler: ({ compatibility_flags }) => compatibility_flags
  })
], CorePlugin.prototype, "compatibilityFlags", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.STRING,
    name: "usage-model",
    description: "Usage model (bundled by default)",
    fromWrangler: ({ usage_model }) => usage_model
  })
], CorePlugin.prototype, "usageModel", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.STRING,
    alias: "u",
    description: "URL of upstream origin",
    fromWrangler: ({ miniflare }) => miniflare?.upstream
  })
], CorePlugin.prototype, "upstream", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.BOOLEAN,
    alias: "w",
    description: "Watch files for changes",
    fromWrangler: ({ miniflare }) => {
      if (miniflare?.watch !== void 0)
        return miniflare.watch;
      if (miniflare?.live_reload)
        return true;
    }
  })
], CorePlugin.prototype, "watch", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.BOOLEAN,
    alias: "d",
    description: "Enable debug logging"
  })
], CorePlugin.prototype, "debug", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.BOOLEAN,
    alias: "V",
    description: "Enable verbose logging"
  })
], CorePlugin.prototype, "verbose", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.BOOLEAN,
    description: "Enable update checker (enabled by default)",
    negatable: true,
    fromWrangler: ({ miniflare }) => miniflare?.update_check
  })
], CorePlugin.prototype, "updateCheck", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.BOOLEAN,
    logName: "REPL",
    description: "Enable interactive REPL"
  })
], CorePlugin.prototype, "repl", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.STRING,
    name: "root",
    description: "Path to resolve files relative to"
  })
], CorePlugin.prototype, "rootPath", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.OBJECT,
    typeFormat: "NAME=PATH[@ENV]",
    description: "Mount additional named workers",
    fromEntries: (entries) => Object.fromEntries(entries.map((entry) => mapMountEntries(entry))),
    fromWrangler: ({ miniflare }, configDir) => miniflare?.mounts && Object.fromEntries(Object.entries(miniflare.mounts).map((entry) => mapMountEntries(entry, configDir)))
  })
], CorePlugin.prototype, "mounts", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.STRING,
    description: "Name of service",
    fromWrangler: ({ name }) => name
  })
], CorePlugin.prototype, "name", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.ARRAY,
    description: "Route to respond with this worker on",
    fromWrangler: ({ route, routes, miniflare }) => {
      const result = [];
      const toPattern = (route2) => typeof route2 === "string" ? route2 : route2.pattern;
      if (route)
        result.push(route);
      if (routes)
        result.push(...routes);
      if (miniflare?.route)
        result.push(miniflare.route);
      if (miniflare?.routes)
        result.push(...miniflare.routes);
      return result.length ? result.map(toPattern) : void 0;
    }
  })
], CorePlugin.prototype, "routes", 2);
__decorateClass([
  (0, import_shared10.Option)({ type: import_shared10.OptionType.NONE })
], CorePlugin.prototype, "logUnhandledRejections", 2);
__decorateClass([
  (0, import_shared10.Option)({ type: import_shared10.OptionType.NONE })
], CorePlugin.prototype, "fetchMock", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.BOOLEAN,
    name: "global-async-io",
    description: "Allow async I/O outside handlers",
    logName: "Allow Global Async I/O",
    fromWrangler: ({ miniflare }) => miniflare?.global_async_io
  })
], CorePlugin.prototype, "globalAsyncIO", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.BOOLEAN,
    description: "Allow setting timers outside handlers",
    logName: "Allow Global Timers",
    fromWrangler: ({ miniflare }) => miniflare?.global_timers
  })
], CorePlugin.prototype, "globalTimers", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.BOOLEAN,
    description: "Allow secure random generation outside handlers",
    logName: "Allow Global Secure Random",
    fromWrangler: ({ miniflare }) => miniflare?.global_random
  })
], CorePlugin.prototype, "globalRandom", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.BOOLEAN,
    description: "Always return correct time from Date methods",
    fromWrangler: ({ miniflare }) => miniflare?.actual_time
  })
], CorePlugin.prototype, "actualTime", 2);
__decorateClass([
  (0, import_shared10.Option)({
    type: import_shared10.OptionType.BOOLEAN,
    description: "Log inaccurate CPU time measurements",
    logName: "Inaccurate CPU Time Measurements",
    fromWrangler: ({ miniflare }) => miniflare?.inaccurate_cpu
  })
], CorePlugin.prototype, "inaccurateCpu", 2);

// packages/core/src/router.ts
var import_url3 = __toModule(require("url"));
var import_shared11 = __toModule(require("@miniflare/shared"));
var RouterError = class extends import_shared11.MiniflareError {
};
var A_MORE_SPECIFIC = -1;
var B_MORE_SPECIFIC = 1;
var Router = class {
  routes = [];
  update(allRoutes) {
    const newRoutes = [];
    for (const [target, routes] of allRoutes) {
      for (const route of routes) {
        const hasProtocol = /^[a-z0-9+\-.]+:\/\//i.test(route);
        let urlInput = route;
        if (!hasProtocol)
          urlInput = `https://${urlInput}`;
        const url = new import_url3.URL(urlInput);
        const protocol = hasProtocol ? url.protocol : void 0;
        const internationalisedAllowHostnamePrefix = url.hostname.startsWith("xn--*");
        const allowHostnamePrefix = url.hostname.startsWith("*") || internationalisedAllowHostnamePrefix;
        const anyHostname = url.hostname === "*";
        if (allowHostnamePrefix && !anyHostname) {
          let hostname = url.hostname;
          if (internationalisedAllowHostnamePrefix) {
            hostname = (0, import_url3.domainToUnicode)(hostname);
          }
          url.hostname = hostname.substring(1);
        }
        const allowPathSuffix = url.pathname.endsWith("*");
        if (allowPathSuffix) {
          url.pathname = url.pathname.substring(0, url.pathname.length - 1);
        }
        if (url.search) {
          throw new RouterError("ERR_QUERY_STRING", `Route "${route}" for "${target}" contains a query string. This is not allowed.`);
        }
        if (url.toString().includes("*") && !anyHostname) {
          throw new RouterError("ERR_INFIX_WILDCARD", `Route "${route}" for "${target}" contains an infix wildcard. This is not allowed.`);
        }
        newRoutes.push({
          target,
          route,
          protocol,
          allowHostnamePrefix,
          hostname: anyHostname ? "" : url.hostname,
          path: url.pathname,
          allowPathSuffix
        });
      }
    }
    newRoutes.sort((a, b) => {
      const aHasProtocol = a.protocol !== void 0;
      const bHasProtocol = b.protocol !== void 0;
      if (aHasProtocol && !bHasProtocol)
        return A_MORE_SPECIFIC;
      if (!aHasProtocol && bHasProtocol)
        return B_MORE_SPECIFIC;
      if (!a.allowHostnamePrefix && b.allowHostnamePrefix)
        return A_MORE_SPECIFIC;
      if (a.allowHostnamePrefix && !b.allowHostnamePrefix)
        return B_MORE_SPECIFIC;
      if (!a.allowPathSuffix && b.allowPathSuffix)
        return A_MORE_SPECIFIC;
      if (a.allowPathSuffix && !b.allowPathSuffix)
        return B_MORE_SPECIFIC;
      const aPathSegments = a.path.split("/");
      const bPathSegments = b.path.split("/");
      const aLastSegmentEmpty = aPathSegments[aPathSegments.length - 1] === "";
      const bLastSegmentEmpty = bPathSegments[bPathSegments.length - 1] === "";
      if (aLastSegmentEmpty && !bLastSegmentEmpty)
        return B_MORE_SPECIFIC;
      if (!aLastSegmentEmpty && bLastSegmentEmpty)
        return A_MORE_SPECIFIC;
      if (aPathSegments.length !== bPathSegments.length)
        return bPathSegments.length - aPathSegments.length;
      if (a.path.length !== b.path.length)
        return b.path.length - a.path.length;
      return b.hostname.length - a.hostname.length;
    });
    this.routes = newRoutes;
  }
  match(url) {
    for (const route of this.routes) {
      if (route.protocol && route.protocol !== url.protocol)
        continue;
      if (route.allowHostnamePrefix) {
        if (!url.hostname.endsWith(route.hostname))
          continue;
      } else {
        if (url.hostname !== route.hostname)
          continue;
      }
      const path7 = url.pathname + url.search;
      if (route.allowPathSuffix) {
        if (!path7.startsWith(route.path))
          continue;
      } else {
        if (path7 !== route.path)
          continue;
      }
      return route.target;
    }
    return null;
  }
};

// packages/core/src/storage.ts
var import_path5 = __toModule(require("path"));
var PluginStorageFactory = class {
  constructor(inner, pluginName, defaultPersistRoot = ".mf") {
    this.inner = inner;
    this.defaultPersistRoot = defaultPersistRoot;
    this.pluginName = pluginName.substring(0, pluginName.length - 6).toLowerCase();
  }
  pluginName;
  storage(namespace, persist) {
    if (persist === void 0 || persist === false) {
      return this.inner.storage(`${this.pluginName}:` + namespace);
    } else if (persist === true) {
      return this.inner.storage(namespace, import_path5.default.join(this.defaultPersistRoot, this.pluginName));
    } else {
      return this.inner.storage(namespace, persist);
    }
  }
  dispose() {
    return this.inner.dispose?.();
  }
};

// packages/core/src/index.ts
function _deepEqual(a, b) {
  if (!dequal(a, b))
    return false;
  if (typeof a === "object") {
    const aSymbols = Object.getOwnPropertySymbols(a);
    for (const aSymbol of aSymbols) {
      if (!(aSymbol in b) || !dequal(a[aSymbol], b[aSymbol]))
        return false;
    }
    return aSymbols.length === Object.getOwnPropertySymbols(b).length;
  }
  return true;
}
function getPluginEntries(plugins) {
  const entries = Object.entries(plugins);
  let coreIndex = -1;
  let bindingsIndex = -1;
  for (let i = 0; i < entries.length; i++) {
    const [, plugin] = entries[i];
    if (plugin === CorePlugin)
      coreIndex = i;
    else if (plugin === BindingsPlugin)
      bindingsIndex = i;
  }
  if (coreIndex > 0) {
    entries.unshift(...entries.splice(coreIndex, 1));
  }
  if (bindingsIndex !== -1 && bindingsIndex !== entries.length - 1) {
    entries.push(...entries.splice(bindingsIndex, 1));
  }
  return entries;
}
function splitPluginOptions(plugins, options) {
  const result = {};
  for (const [name, plugin] of plugins) {
    const pluginResult = {};
    for (const key of plugin.prototype.opts?.keys() ?? []) {
      if (key in options) {
        pluginResult[key] = options[key];
      }
    }
    result[name] = pluginResult;
  }
  return result;
}
function splitWranglerConfig(plugins, overrides, config, configDir, log) {
  const result = {};
  for (const [name, plugin] of plugins) {
    const pluginResult = {};
    const pluginOverrides = overrides[name];
    for (const [key, meta] of plugin.prototype.opts?.entries() ?? []) {
      if (key in pluginOverrides) {
        pluginResult[key] = pluginOverrides[key];
      } else {
        pluginResult[key] = meta.fromWrangler?.(config, configDir, log);
      }
    }
    result[name] = pluginResult;
  }
  return result;
}
var pathResolve = (p) => import_path6.default.resolve(p);
function throwNoScriptError(modules) {
  const execName = process.env.MINIFLARE_EXEC_NAME ?? "miniflare";
  const script = modules ? "worker.mjs" : "worker.js";
  const format = modules ? "modules" : "service-worker";
  const pkgScriptField = modules ? "module" : "main";
  const lines = [
    "No script defined, either:",
    "- Pass it as a positional argument, if you're using the CLI",
    (0, import_colors2.dim)(`    $ ${execName} dist/${script}`),
    "- Set the script or scriptPath option, if you're using the API",
    (0, import_colors2.dim)(`    new Miniflare({ scriptPath: "dist/${script}" })`),
    `- Set ${pkgScriptField} in package.json`,
    (0, import_colors2.dim)(`    { "${pkgScriptField}": "dist/${script}" }`)
  ];
  if (modules) {
    lines.push("- Set build.upload.main in wrangler.toml", (0, import_colors2.dim)("    [build.upload]"), (0, import_colors2.dim)(`    format = "${format}"`), (0, import_colors2.dim)(`    dir = "dist"`), (0, import_colors2.dim)(`    main = "${script}"`));
  }
  lines.push("");
  throw new MiniflareCoreError("ERR_NO_SCRIPT", lines.join("\n"));
}
var ReloadEvent = class extends Event {
  plugins;
  initial;
  constructor(type, init) {
    super(type);
    this.plugins = init.plugins;
    this.initial = init.initial;
  }
};
var MiniflareCore = class extends import_shared12.TypedEventTarget {
  #originalPlugins;
  #plugins;
  #previousSetOptions;
  #overrides;
  #previousOptions;
  #ctx;
  #pluginStorages;
  #compat;
  #previousRootPath;
  #previousUsageModel;
  #previousGlobalAsyncIO;
  #instances;
  #mounts;
  #router;
  #wranglerConfigPath;
  #watching;
  #beforeSetupWatch;
  #setupWatch;
  #setupResults;
  #scriptWatchPaths = new Set();
  #reloaded = false;
  #globalScope;
  #bindings;
  #moduleExports;
  #watcher;
  #watcherCallbackMutex;
  #previousWatchPaths;
  #previousFetchMock;
  constructor(plugins, ctx, options = {}) {
    super();
    this.#originalPlugins = plugins;
    this.#plugins = getPluginEntries(plugins);
    this.#previousSetOptions = options;
    this.#overrides = splitPluginOptions(this.#plugins, options);
    this.#ctx = ctx;
    this.#pluginStorages = new Map();
    this.#initPromise = this.#init().then(() => this.#reload());
  }
  #updateWatch(data, name, result) {
    if (this.#watching && result?.watch) {
      const resolved = result.watch.map(pathResolve);
      data.set(name, new Set(resolved));
    } else {
      data.delete(name);
    }
  }
  async #runBeforeSetup(name) {
    const instance = this.#instances[name];
    if (!instance.beforeSetup)
      return false;
    this.#ctx.log.verbose(`- beforeSetup(${name})`);
    const result = await instance.beforeSetup();
    this.#updateWatch(this.#beforeSetupWatch, name, result);
    return true;
  }
  async #runSetup(name) {
    const instance = this.#instances[name];
    if (!instance.setup)
      return false;
    this.#ctx.log.verbose(`- setup(${name})`);
    const result = await instance.setup(this.getPluginStorage(name));
    this.#updateWatch(this.#setupWatch, name, result);
    this.#setupResults.set(name, result ?? {});
    return true;
  }
  #initPromise;
  async #init(reloadAll = false) {
    this.#ctx.log.debug("Initialising worker...");
    const previous = this.#previousOptions;
    let options = this.#overrides;
    const rootPath = options.CorePlugin.rootPath ?? process.cwd();
    const originalConfigPath = options.CorePlugin.wranglerConfigPath;
    const configEnv = options.CorePlugin.wranglerConfigEnv;
    let configPath = originalConfigPath === true ? "wrangler.toml" : originalConfigPath;
    if (configPath) {
      configPath = import_path6.default.resolve(rootPath, configPath);
      this.#wranglerConfigPath = configPath;
      try {
        const configData = await import_promises3.default.readFile(configPath, "utf8");
        const toml = require("@iarna/toml");
        const config = toml.parse(configData);
        if (configEnv && config.env && configEnv in config.env) {
          Object.assign(config, config.env[configEnv]);
        }
        const configDir = import_path6.default.dirname(configPath);
        _populateBuildConfig(config, configDir, configEnv);
        options = splitWranglerConfig(this.#plugins, this.#overrides, config, configDir, this.#ctx.log);
      } catch (e) {
        if (!(e.code === "ENOENT" && originalConfigPath === true)) {
          throw e;
        }
      }
    }
    this.#watching ??= options.CorePlugin.watch ?? false;
    const {
      compatibilityDate,
      compatibilityFlags,
      usageModel,
      globalAsyncIO,
      fetchMock
    } = options.CorePlugin;
    let ctxUpdate = this.#previousRootPath && this.#previousRootPath !== rootPath || this.#previousUsageModel !== usageModel || this.#previousGlobalAsyncIO !== globalAsyncIO || this.#previousFetchMock !== fetchMock || reloadAll;
    this.#previousRootPath = rootPath;
    if (this.#compat) {
      if (this.#compat.update(compatibilityDate, compatibilityFlags)) {
        ctxUpdate = true;
      }
    } else {
      this.#compat = new import_shared12.Compatibility(compatibilityDate, compatibilityFlags);
    }
    const queueBroker = this.#ctx.queueBroker;
    const queueEventDispatcher = async (batch) => {
      await this.dispatchQueue(batch);
      this.#ctx.log.info(`${batch.queue} (${batch.messages.length} Messages) OK`);
    };
    const ctx = {
      log: this.#ctx.log,
      compat: this.#compat,
      rootPath,
      usageModel,
      globalAsyncIO,
      fetchMock,
      queueEventDispatcher,
      queueBroker
    };
    (0, import_shared12.logOptions)(this.#plugins, this.#ctx.log, options);
    const enabled = this.#compat.enabled;
    this.#ctx.log.debug(`Enabled Compatibility Flags:${enabled.length === 0 ? " <none>" : ""}`);
    for (const flag of enabled)
      this.#ctx.log.debug(`- ${flag}`);
    this.#instances ??= {};
    this.#beforeSetupWatch ??= new Map();
    let ranBeforeSetup = false;
    for (const [name, plugin] of this.#plugins) {
      if (previous !== void 0 && !ctxUpdate && _deepEqual(previous[name], options[name])) {
        continue;
      }
      const existingInstance = this.#instances[name];
      if (existingInstance?.dispose) {
        this.#ctx.log.verbose(`- dispose(${name})`);
        await existingInstance.dispose();
      }
      const instance = new plugin(ctx, options[name]);
      this.#instances[name] = instance;
      if (await this.#runBeforeSetup(name))
        ranBeforeSetup = true;
    }
    this.#setupWatch ??= new Map();
    this.#setupResults ??= new Map();
    for (const [name] of this.#plugins) {
      if (previous !== void 0 && !ctxUpdate && _deepEqual(previous[name], options[name]) && !(ranBeforeSetup && this.#setupResults.get(name)?.script)) {
        continue;
      }
      await this.#runSetup(name);
    }
    this.#previousOptions = options;
    this.#mounts ??= new Map();
    const mounts = options.CorePlugin.mounts;
    if (mounts) {
      const defaultMountOptions = { watch: this.#watching || void 0 };
      const kvPersist = (0, import_shared12.resolveStoragePersist)(rootPath, options.KVPlugin?.kvPersist);
      const cachePersist = (0, import_shared12.resolveStoragePersist)(rootPath, options.CachePlugin?.cachePersist);
      const durableObjectsPersist = (0, import_shared12.resolveStoragePersist)(rootPath, options.DurableObjectsPlugin?.durableObjectsPersist);
      if (kvPersist !== void 0) {
        defaultMountOptions.kvPersist = kvPersist;
      }
      if (cachePersist !== void 0) {
        defaultMountOptions.cachePersist = cachePersist;
      }
      if (durableObjectsPersist !== void 0) {
        defaultMountOptions.durableObjectsPersist = durableObjectsPersist;
      }
      for (const [name, rawOptions] of Object.entries(mounts)) {
        if (name === "") {
          throw new MiniflareCoreError("ERR_MOUNT_NO_NAME", "Mount name cannot be empty");
        }
        const mountOptions = typeof rawOptions === "string" ? {
          ...defaultMountOptions,
          rootPath: rawOptions,
          packagePath: true,
          envPathDefaultFallback: true,
          wranglerConfigPath: true
        } : {
          ...defaultMountOptions,
          ...rawOptions
        };
        if ("mounts" in mountOptions || this.#ctx.isMount) {
          throw new MiniflareCoreError("ERR_MOUNT_NESTED", "Nested mounts are unsupported");
        }
        let mount = this.#mounts.get(name);
        if (mount) {
          this.#ctx.log.verbose(`Updating mount "${name}"...`);
          await mount.setOptions(mountOptions, false);
        } else {
          this.#ctx.log.debug(`Mounting "${name}"...`);
          let log = this.#ctx.log;
          if (Object.getPrototypeOf(this.#ctx.log) === import_shared12.Log.prototype) {
            log = new import_shared12.Log(this.#ctx.log.level, { suffix: name });
          }
          const ctx2 = {
            ...this.#ctx,
            log,
            scriptRunForModuleExports: false,
            isMount: true
          };
          mount = new MiniflareCore(this.#originalPlugins, ctx2, mountOptions);
          mount.addEventListener("reload", async (event) => {
            if (!event.initial) {
              try {
                await this.#updateRouter();
                await this.#reload();
              } catch (e) {
                this.#ctx.log.error(e);
              }
            }
          });
          try {
            await mount.getPlugins();
          } catch (e) {
            throw new MiniflareCoreError("ERR_MOUNT", `Error mounting "${name}"`, e);
          }
          this.#mounts.set(name, mount);
        }
      }
    }
    for (const [name, mount] of [...this.#mounts]) {
      if (mounts === void 0 || !(name in mounts)) {
        this.#ctx.log.debug(`Unmounting "${name}"...`);
        await mount.dispose();
        this.#mounts.delete(name);
      }
    }
    await this.#updateRouter();
    if (this.#ctx.scriptRequired && !this.#setupResults.get("CorePlugin")?.script && this.#mounts.size === 0) {
      throwNoScriptError(options.CorePlugin.modules);
    }
  }
  async #updateRouter() {
    const allRoutes = new Map();
    const { CorePlugin: CorePlugin2 } = this.#instances;
    if (CorePlugin2.name) {
      const routes = CorePlugin2.routes;
      if (routes)
        allRoutes.set(CorePlugin2.name, routes);
    }
    for (const [name, mount] of this.#mounts) {
      const { CorePlugin: CorePlugin3 } = await mount.getPlugins();
      if (CorePlugin3.name !== void 0 && CorePlugin3.name !== name) {
        throw new MiniflareCoreError("ERR_MOUNT_NAME_MISMATCH", `Mounted name "${name}" must match service name "${CorePlugin3.name}"`);
      }
      const routes = CorePlugin3.routes;
      if (routes)
        allRoutes.set(name, routes);
    }
    this.#router ??= new Router();
    this.#router.update(allRoutes);
    if (this.#mounts.size) {
      this.#ctx.log.debug(`Mount Routes:${this.#router.routes.length === 0 ? " <none>" : ""}`);
      for (let i = 0; i < this.#router.routes.length; i++) {
        const route = this.#router.routes[i];
        this.#ctx.log.debug(`${i + 1}. ${route.route} => ${route.target}`);
      }
    }
  }
  async #runAllBeforeReloads() {
    for (const [name] of this.#plugins) {
      const instance = this.#instances[name];
      if (instance.beforeReload) {
        this.#ctx.log.verbose(`- beforeReload(${name})`);
        await instance.beforeReload();
      }
    }
  }
  async #runAllReloads(mounts) {
    const bindings = this.#bindings;
    const exports = this.#moduleExports;
    for (const [name] of this.#plugins) {
      const instance = this.#instances[name];
      if (instance.reload) {
        this.#ctx.log.verbose(`- reload(${name})`);
        await instance.reload(bindings ?? {}, exports ?? {}, mounts);
      }
    }
  }
  async #reload(dispatchReloadEvent = true) {
    this.#ctx.log.debug("Reloading worker...");
    const globals = {};
    const bindings = {};
    const newWatchPaths = new Set();
    if (this.#wranglerConfigPath)
      newWatchPaths.add(this.#wranglerConfigPath);
    await this.#runAllBeforeReloads();
    if (!this.#ctx.isMount) {
      for (const mount of this.#mounts.values()) {
        await mount.#runAllBeforeReloads();
      }
    }
    let script = void 0;
    let requiresModuleExports = false;
    const additionalModules = {};
    for (const [name] of this.#plugins) {
      const result = this.#setupResults.get(name);
      Object.assign(globals, result?.globals);
      Object.assign(bindings, result?.bindings);
      if (result?.script) {
        if (script) {
          throw new TypeError("Multiple plugins returned a script");
        }
        script = result.script;
      }
      if (result?.requiresModuleExports)
        requiresModuleExports = true;
      if (result?.additionalModules) {
        Object.assign(additionalModules, result.additionalModules);
      }
      const beforeSetupWatch = this.#beforeSetupWatch.get(name);
      if (beforeSetupWatch)
        (0, import_shared12.addAll)(newWatchPaths, beforeSetupWatch);
      const setupWatch = this.#setupWatch.get(name);
      if (setupWatch)
        (0, import_shared12.addAll)(newWatchPaths, setupWatch);
    }
    const { modules, processedModuleRules, logUnhandledRejections } = this.#instances.CorePlugin;
    this.#globalScope?.[kDispose]();
    const globalScope = new ServiceWorkerGlobalScope(this.#ctx.log, globals, bindings, modules, logUnhandledRejections);
    this.#globalScope = globalScope;
    this.#bindings = bindings;
    this.#moduleExports = {};
    const rules = modules ? processedModuleRules : void 0;
    let res = void 0;
    if (script && (!this.#ctx.scriptRunForModuleExports || modules && requiresModuleExports)) {
      if (!this.#ctx.scriptRunner) {
        throw new TypeError("Running scripts requires a script runner");
      }
      this.#ctx.log.verbose("Running script...");
      res = await this.#ctx.scriptRunner.run(globalScope, script, rules, additionalModules);
      this.#scriptWatchPaths.clear();
      this.#scriptWatchPaths.add(script.filePath);
      if (res.watch) {
        (0, import_shared12.addAll)(newWatchPaths, res.watch);
        (0, import_shared12.addAll)(this.#scriptWatchPaths, res.watch);
      }
      this.#moduleExports = res.exports;
      if (res.exports) {
        const defaults = res.exports.default;
        const fetchListener = defaults?.fetch?.bind(defaults);
        if (fetchListener) {
          globalScope[kAddModuleFetchListener](fetchListener);
        }
        const scheduledListener = defaults?.scheduled?.bind(defaults);
        if (scheduledListener) {
          globalScope[kAddModuleScheduledListener](scheduledListener);
        }
        const queueListener = defaults?.queue?.bind(defaults);
        if (queueListener) {
          globalScope[kAddModuleQueueListener](queueListener);
        }
      }
    }
    if (!this.#ctx.isMount) {
      const mounts = new Map();
      const name = this.#instances.CorePlugin.name;
      if (name) {
        mounts.set(name, {
          moduleExports: this.#moduleExports,
          dispatchFetch: (request) => this[kDispatchFetch](request, true),
          usageModel: this.#instances.CorePlugin.usageModel
        });
      }
      for (const [name2, mount] of this.#mounts) {
        mounts.set(name2, {
          moduleExports: await mount.getModuleExports(),
          dispatchFetch: (request) => mount[kDispatchFetch](request, true),
          usageModel: mount.#instances.CorePlugin.usageModel
        });
      }
      await this.#runAllReloads(mounts);
      for (const mount of this.#mounts.values()) {
        await mount.#runAllReloads(mounts);
      }
    }
    if (dispatchReloadEvent) {
      const reloadEvent = new ReloadEvent("reload", {
        plugins: this.#instances,
        initial: !this.#reloaded
      });
      this.dispatchEvent(reloadEvent);
    }
    this.#reloaded = true;
    if (res) {
      this.#ctx.log.info(`Worker reloaded!${res.bundleSize !== void 0 ? ` (${formatSize(res.bundleSize)})` : ""}`);
      if (res.bundleSize !== void 0 && res.bundleSize > 1048576) {
        this.#ctx.log.warn("Worker's uncompressed size exceeds the 1MiB limit! Note that your worker will be compressed during upload so you may still be able to deploy it.");
      }
    }
    if (this.#watching) {
      let watcher = this.#watcher;
      if (!watcher) {
        const {
          Watcher
        } = require("@miniflare/watcher");
        this.#watcherCallbackMutex = new import_shared12.Mutex();
        watcher = new Watcher(this.#watcherCallback.bind(this));
        this.#watcher = watcher;
      }
      const unwatchedPaths = new Set();
      const watchedPaths = new Set();
      for (const watchedPath of this.#previousWatchPaths ?? []) {
        if (!newWatchPaths.has(watchedPath)) {
          unwatchedPaths.add(watchedPath);
        }
      }
      for (const newWatchedPath of newWatchPaths) {
        if (!this.#previousWatchPaths?.has(newWatchedPath)) {
          watchedPaths.add(newWatchedPath);
        }
      }
      if (unwatchedPaths.size > 0) {
        this.#ctx.log.debug(`Unwatching ${pathsToString(unwatchedPaths)}...`);
        watcher.unwatch(unwatchedPaths);
      }
      if (watchedPaths.size > 0) {
        this.#ctx.log.debug(`Watching ${pathsToString(newWatchPaths)}...`);
        watcher.watch(watchedPaths);
      }
      this.#previousWatchPaths = newWatchPaths;
    }
  }
  #ignoreScriptUpdates = false;
  #ignoreScriptUpdatesTimeout;
  #watcherCallback(eventPath) {
    this.#ctx.log.debug(`${import_path6.default.relative("", eventPath)} changed...`);
    if (this.#ignoreScriptUpdates && this.#scriptWatchPaths.has(eventPath)) {
      this.#ctx.log.verbose("Ignoring script change after build...");
      return;
    }
    const promise = this.#watcherCallbackMutex.runWith(async () => {
      if (eventPath === this.#wranglerConfigPath) {
        await this.#init();
      }
      let ranBeforeSetup = false;
      for (const [name] of this.#plugins) {
        if (this.#beforeSetupWatch.get(name)?.has(eventPath)) {
          await this.#runBeforeSetup(name);
          ranBeforeSetup = true;
          this.#ignoreScriptUpdates = true;
          clearTimeout(this.#ignoreScriptUpdatesTimeout);
          this.#ignoreScriptUpdatesTimeout = setTimeout(() => this.#ignoreScriptUpdates = false, 1e3);
        }
        if (this.#setupWatch.get(name)?.has(eventPath)) {
          await this.#runSetup(name);
        }
      }
      if (ranBeforeSetup) {
        for (const [name] of this.#plugins) {
          if (this.#setupResults.get(name)?.script) {
            await this.#runSetup(name);
          }
        }
      }
      if (!this.#watcherCallbackMutex.hasWaiting) {
        await this.#reload();
      }
    });
    promise.catch((e) => this.#ctx.log.error(e));
  }
  get log() {
    return this.#ctx.log;
  }
  async reload() {
    await this.#initPromise;
    await this.#init(true);
    await this.#reload();
  }
  async setOptions(options, dispatchReloadEvent = true) {
    await this.#initPromise;
    options = { ...this.#previousSetOptions, ...options };
    this.#previousSetOptions = options;
    this.#overrides = splitPluginOptions(this.#plugins, options);
    await this.#init();
    await this.#reload(dispatchReloadEvent);
  }
  getPluginStorage(name) {
    let storage = this.#pluginStorages.get(name);
    if (storage)
      return storage;
    this.#pluginStorages.set(name, storage = new PluginStorageFactory(this.#ctx.storageFactory, name));
    return storage;
  }
  async getPlugins() {
    await this.#initPromise;
    return this.#instances;
  }
  async getGlobalScope() {
    await this.#initPromise;
    return this.#globalScope;
  }
  async getBindings() {
    await this.#initPromise;
    return this.#bindings;
  }
  async getModuleExports() {
    await this.#initPromise;
    return this.#moduleExports;
  }
  async getMount(name) {
    await this.#initPromise;
    return this.#mounts.get(name);
  }
  #matchMount(url) {
    if (this.#mounts?.size) {
      const mountMatch = this.#router.match(url);
      const name = this.#instances.CorePlugin.name;
      if (mountMatch !== null && mountMatch !== name) {
        return this.#mounts.get(mountMatch);
      }
    }
  }
  async dispatchFetch(input, init) {
    await this.#initPromise;
    let request = input instanceof Request && !init ? input : new Request(input, init);
    const url = new import_url4.URL(request.url);
    const mount = this.#matchMount(url);
    if (mount)
      return mount.dispatchFetch(request);
    const { upstreamURL, usageModel } = this.#instances.CorePlugin;
    if (upstreamURL && !url.toString().startsWith(upstreamURL.toString())) {
      let path7 = url.pathname + url.search;
      if (path7.startsWith("/"))
        path7 = path7.substring(1);
      const newURL = new import_url4.URL(path7, upstreamURL);
      request = new Request(newURL, request);
    }
    const requestDepth = (parseInt(request.headers.get(_kLoopHeader)) || 0) + 1;
    request.headers.delete(_kLoopHeader);
    return new import_shared12.RequestContext({
      requestDepth,
      pipelineDepth: 1,
      externalSubrequestLimit: (0, import_shared12.usageModelExternalSubrequestLimit)(usageModel)
    }).runWith(() => this[kDispatchFetch](request, !!upstreamURL));
  }
  async [kDispatchFetch](request, proxy) {
    await this.#initPromise;
    if (!this.#compat.isEnabled("formdata_parser_supports_files")) {
      request = withStringFormDataFiles(request);
    }
    request = withImmutableHeaders(request);
    return this.#globalScope[kDispatchFetch](request, proxy);
  }
  async dispatchScheduled(scheduledTime, cron, url) {
    await this.#initPromise;
    if (url !== void 0) {
      if (typeof url === "string")
        url = new import_url4.URL(url);
      const mount = this.#matchMount(url);
      if (mount)
        return mount.dispatchScheduled(scheduledTime, cron);
    }
    const { usageModel } = this.#instances.CorePlugin;
    const globalScope = this.#globalScope;
    return new import_shared12.RequestContext({
      externalSubrequestLimit: (0, import_shared12.usageModelExternalSubrequestLimit)(usageModel)
    }).runWith(() => globalScope[kDispatchScheduled](scheduledTime, cron));
  }
  async dispatchQueue(batch) {
    await this.#initPromise;
    const { usageModel } = this.#instances.CorePlugin;
    const globalScope = this.#globalScope;
    return new import_shared12.RequestContext({
      externalSubrequestLimit: (0, import_shared12.usageModelExternalSubrequestLimit)(usageModel)
    }).runWith(() => {
      const result = globalScope[kDispatchQueue](batch);
      return result;
    });
  }
  async dispose() {
    await this.#initPromise;
    for (const [name] of this.#plugins) {
      const instance = this.#instances?.[name];
      if (instance?.dispose) {
        this.#ctx.log.verbose(`- dispose(${name})`);
        await instance.dispose();
      }
    }
    this.#watcher?.dispose();
    if (this.#mounts) {
      for (const [name, mount] of this.#mounts) {
        this.#ctx.log.debug(`Unmounting "${name}"...`);
        await mount.dispose();
      }
      this.#mounts.clear();
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AbortSignal,
  BindingsPlugin,
  Body,
  BuildError,
  BuildPlugin,
  CompressionStream,
  CorePlugin,
  DOMException,
  DOM_EXCEPTION_NAMES,
  DecompressionStream,
  DigestStream,
  ExecutionContext,
  FetchError,
  FetchEvent,
  Fetcher,
  FixedLengthStream,
  Headers,
  IdentityTransformStream,
  MiniflareCore,
  MiniflareCoreError,
  Navigator,
  PluginStorageFactory,
  PromiseRejectionEvent,
  QueueEvent,
  ReloadEvent,
  Request,
  Response,
  Router,
  RouterError,
  ScheduledController,
  ScheduledEvent,
  Scheduler,
  ServiceWorkerGlobalScope,
  WorkerGlobalScope,
  _buildUnknownProtocolWarning,
  _deepEqual,
  _getBodyLength,
  _getURLList,
  _headersFromIncomingRequest,
  _isByteStream,
  _kInner,
  _kLoopHeader,
  _populateBuildConfig,
  _urlFromRequestInput,
  atob,
  btoa,
  createCompatFetch,
  createCrypto,
  createDate,
  createFetchMock,
  createTimer,
  fetch,
  kAddModuleFetchListener,
  kAddModuleQueueListener,
  kAddModuleScheduledListener,
  kDispatchFetch,
  kDispatchQueue,
  kDispatchScheduled,
  kDispose,
  kWaitUntil,
  logResponse,
  withImmutableHeaders,
  withInputGating,
  withStringFormDataFiles,
  withWaitUntil
});
//# sourceMappingURL=index.js.map
