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

// packages/shared/src/index.ts
__export(exports, {
  Compatibility: () => Compatibility,
  EXTERNAL_SUBREQUEST_LIMIT_BUNDLED: () => EXTERNAL_SUBREQUEST_LIMIT_BUNDLED,
  EXTERNAL_SUBREQUEST_LIMIT_UNBOUND: () => EXTERNAL_SUBREQUEST_LIMIT_UNBOUND,
  INTERNAL_SUBREQUEST_LIMIT: () => INTERNAL_SUBREQUEST_LIMIT,
  InputGate: () => InputGate,
  InputGatedEventTarget: () => InputGatedEventTarget,
  Log: () => Log,
  LogLevel: () => LogLevel,
  MiniflareError: () => MiniflareError,
  Mutex: () => Mutex,
  NoOpLog: () => NoOpLog,
  Option: () => Option,
  OptionType: () => OptionType,
  OutputGate: () => OutputGate,
  Plugin: () => Plugin,
  RequestContext: () => RequestContext,
  SITES_NO_CACHE_PREFIX: () => SITES_NO_CACHE_PREFIX,
  STRING_SCRIPT_PATH: () => STRING_SCRIPT_PATH,
  Storage: () => Storage,
  ThrowingEventTarget: () => ThrowingEventTarget,
  TypedEventTarget: () => TypedEventTarget,
  addAll: () => addAll,
  arrayCompare: () => arrayCompare,
  assertInRequest: () => assertInRequest,
  base64Decode: () => base64Decode,
  base64Encode: () => base64Encode,
  createSQLiteDB: () => createSQLiteDB,
  defaultClock: () => defaultClock,
  getRequestContext: () => getRequestContext,
  getSQLiteNativeBindingLocation: () => getSQLiteNativeBindingLocation,
  globsToMatcher: () => globsToMatcher,
  kGetConsumer: () => kGetConsumer,
  kSetConsumer: () => kSetConsumer,
  kWrapListener: () => kWrapListener,
  kebabCase: () => kebabCase,
  lexicographicCompare: () => lexicographicCompare,
  logOptions: () => logOptions,
  millisToSeconds: () => millisToSeconds,
  nonCircularClone: () => nonCircularClone,
  numericCompare: () => numericCompare,
  prefixError: () => prefixError,
  randomHex: () => randomHex,
  resolveStoragePersist: () => resolveStoragePersist,
  runWithInputGateClosed: () => runWithInputGateClosed,
  sanitisePath: () => sanitisePath,
  spaceCase: () => spaceCase,
  structuredCloneBuffer: () => structuredCloneBuffer,
  titleCase: () => titleCase,
  usageModelExternalSubrequestLimit: () => usageModelExternalSubrequestLimit,
  viewToArray: () => viewToArray,
  viewToBuffer: () => viewToBuffer,
  waitForOpenInputGate: () => waitForOpenInputGate,
  waitForOpenOutputGate: () => waitForOpenOutputGate,
  waitUntilOnOutputGate: () => waitUntilOnOutputGate
});

// packages/shared/src/data.ts
var import_path = __toModule(require("path"));
var import_util = __toModule(require("util"));
var import_v8 = __toModule(require("v8"));
var import_picomatch = __toModule(require("picomatch"));
var encoder = new import_util.TextEncoder();
var numericCompare = new Intl.Collator(void 0, { numeric: true }).compare;
function arrayCompare(a, b) {
  const minLength = Math.min(a.length, b.length);
  for (let i = 0; i < minLength; i++) {
    const aElement = a[i];
    const bElement = b[i];
    if (aElement < bElement)
      return -1;
    if (aElement > bElement)
      return 1;
  }
  return a.length - b.length;
}
function lexicographicCompare(x, y) {
  const xEncoded = encoder.encode(x);
  const yEncoded = encoder.encode(y);
  return arrayCompare(xEncoded, yEncoded);
}
function nonCircularClone(value) {
  return JSON.parse(JSON.stringify(value));
}
function structuredCloneBuffer(value) {
  return (0, import_v8.deserialize)((0, import_v8.serialize)(value));
}
function addAll(set, values) {
  for (const value of values)
    set.add(value);
}
function viewToArray(view) {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}
function viewToBuffer(view) {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}
function base64Encode(value) {
  return Buffer.from(value, "utf8").toString("base64");
}
function base64Decode(encoded) {
  return Buffer.from(encoded, "base64").toString("utf8");
}
function randomHex(digits = 8) {
  return Array.from(Array(digits)).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
}
var SITES_NO_CACHE_PREFIX = "$__MINIFLARE_SITES__$/";
function globsToMatcher(globs = []) {
  const matchGlobs = [];
  const ignoreGlobs = [];
  for (const glob of globs) {
    if (glob.startsWith("!")) {
      ignoreGlobs.push(glob.slice(1));
    } else {
      matchGlobs.push(glob);
    }
  }
  const isMatch = (0, import_picomatch.default)(matchGlobs, {
    dot: true,
    bash: true,
    contains: true,
    ignore: ignoreGlobs
  });
  return {
    test: (string) => isMatch(string),
    toString: () => globs.join(", ")
  };
}
function kebabCase(s) {
  return s.replace(/[A-Z]/g, (sub) => `-${sub.toLowerCase()}`);
}
function spaceCase(s) {
  s = s.replace(/(.)([A-Z][a-z]+)/g, "$1 $2");
  return s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}
function titleCase(s) {
  return spaceCase(s).split(" ").map((s2) => s2 ? s2[0].toUpperCase() + s2.substring(1) : s2).join(" ");
}
var urlRegexp = /^([a-z]+:)?\/\//i;
function resolveStoragePersist(rootPath, persist) {
  if (typeof persist === "string") {
    if (urlRegexp.test(persist))
      return persist;
    return import_path.default.resolve(rootPath, persist);
  }
  return persist;
}
var namespaceRegexp = /[/\\:|]/g;
var dotRegexp = /(^|\/|\\)(\.+)(\/|\\|$)/g;
var illegalRegexp = /[?<>*"'^\x00-\x1f\x80-\x9f]/g;
var windowsReservedRegexp = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
var leadingRegexp = /^[ /\\]+/;
var trailingRegexp = /[ /\\]+$/;
function dotReplacement(match, g1, g2, g3) {
  return `${g1}${"".padStart(g2.length, "_")}${g3}`;
}
function underscoreReplacement(match) {
  return "".padStart(match.length, "_");
}
function sanitisePath(unsafe) {
  return unsafe.replace(namespaceRegexp, import_path.default.sep).replace(dotRegexp, dotReplacement).replace(dotRegexp, dotReplacement).replace(illegalRegexp, "_").replace(windowsReservedRegexp, "_").replace(leadingRegexp, underscoreReplacement).replace(trailingRegexp, underscoreReplacement).substring(0, 255);
}

// packages/shared/src/compat.ts
var FEATURES = [
  {
    enableFlag: "streams_enable_constructors",
    disableFlag: "streams_disable_constructors"
  },
  {
    enableFlag: "transformstream_enable_standard_constructor",
    disableFlag: "transformstream_disable_standard_constructor"
  },
  {
    defaultAsOf: "2022-03-21",
    enableFlag: "global_navigator",
    disableFlag: "no_global_navigator"
  },
  {
    defaultAsOf: "2021-11-10",
    enableFlag: "durable_object_fetch_requires_full_url",
    disableFlag: "durable_object_fetch_allows_relative_url"
  },
  {
    defaultAsOf: "2021-11-10",
    enableFlag: "fetch_refuses_unknown_protocols",
    disableFlag: "fetch_treats_unknown_protocols_as_http"
  },
  {
    defaultAsOf: "2021-11-03",
    enableFlag: "formdata_parser_supports_files",
    disableFlag: "formdata_parser_converts_files_to_strings"
  },
  {
    enableFlag: "html_rewriter_treats_esi_include_as_void_tag"
  }
];
var Compatibility = class {
  constructor(compatibilityDate = "1970-01-01", compatibilityFlags = []) {
    this.compatibilityDate = compatibilityDate;
    this.compatibilityFlags = compatibilityFlags;
    this.#rebuildEnabled();
  }
  #enabled = new Set();
  #rebuildEnabled() {
    this.#enabled.clear();
    const flags = new Set(this.compatibilityFlags);
    for (const { defaultAsOf, enableFlag, disableFlag } of FEATURES) {
      const disabledExplicitly = disableFlag && flags.has(disableFlag);
      if (disabledExplicitly)
        continue;
      const enabledExplicitly = flags.has(enableFlag);
      const enabledAutomatically = defaultAsOf && numericCompare(defaultAsOf, this.compatibilityDate) <= 0;
      if (enabledExplicitly || enabledAutomatically) {
        this.#enabled.add(enableFlag);
      }
    }
  }
  isEnabled(flag) {
    return this.#enabled.has(flag);
  }
  update(compatibilityDate = "1970-01-01", compatibilityFlags = []) {
    if (this.compatibilityDate === compatibilityDate && this.compatibilityFlags.length === compatibilityFlags.length && this.compatibilityFlags.every((flag, i) => compatibilityFlags[i] === flag)) {
      return false;
    }
    this.compatibilityDate = compatibilityDate;
    this.compatibilityFlags = compatibilityFlags;
    this.#rebuildEnabled();
    return true;
  }
  get enabled() {
    return [...this.#enabled];
  }
};

// packages/shared/src/context.ts
var import_assert = __toModule(require("assert"));
var import_async_hooks = __toModule(require("async_hooks"));
function parseSubrequestOverride(limit) {
  const parsed = parseInt(limit);
  if (Number.isNaN(parsed))
    return void 0;
  if (parsed < 0)
    return false;
  return parsed;
}
var EXTERNAL_SUBREQUEST_LIMIT_OVERRIDE = parseSubrequestOverride(process.env.MINIFLARE_SUBREQUEST_LIMIT);
var INTERNAL_SUBREQUEST_LIMIT_OVERRIDE = parseSubrequestOverride(process.env.MINIFLARE_INTERNAL_SUBREQUEST_LIMIT);
var EXTERNAL_SUBREQUEST_LIMIT_BUNDLED = 50;
var EXTERNAL_SUBREQUEST_LIMIT_UNBOUND = 1e3;
var INTERNAL_SUBREQUEST_LIMIT = 1e3;
function usageModelExternalSubrequestLimit(model) {
  return model === "unbound" ? EXTERNAL_SUBREQUEST_LIMIT_UNBOUND : EXTERNAL_SUBREQUEST_LIMIT_BUNDLED;
}
var MAX_REQUEST_DEPTH = 16;
var MAX_PIPELINE_DEPTH = 32;
var depthError = "Subrequest depth limit exceeded. This request recursed through Workers too many times. This can happen e.g. if you have a Worker or Durable Object that calls other Workers or objects recursively.";
var requestContextStorage = new import_async_hooks.AsyncLocalStorage();
function getRequestContext() {
  return requestContextStorage.getStore();
}
function assertInRequest() {
  if (!getRequestContext()) {
    throw new Error("Some functionality, such as asynchronous I/O (fetch, Cache API, KV), timeouts (setTimeout, setInterval), and generating random values (crypto.getRandomValues, crypto.subtle.generateKey), can only be performed while handling a request.");
  }
}
var RequestContext = class {
  requestDepth;
  pipelineDepth;
  durableObject;
  externalSubrequestLimit;
  internalSubrequestLimit;
  #internalSubrequests = 0;
  #externalSubrequests = 0;
  #currentTime;
  constructor({
    requestDepth = 1,
    pipelineDepth = 1,
    durableObject = false,
    externalSubrequestLimit = EXTERNAL_SUBREQUEST_LIMIT_BUNDLED,
    internalSubrequestLimit = INTERNAL_SUBREQUEST_LIMIT
  } = {}) {
    (0, import_assert.default)(requestDepth >= 1);
    (0, import_assert.default)(pipelineDepth >= 1);
    if (requestDepth > MAX_REQUEST_DEPTH) {
      throw new Error(`${depthError}
Workers and objects can recurse up to ${MAX_REQUEST_DEPTH} times.
If you're trying to fetch from an origin server, make sure you've set the \`upstream\` option.`);
    }
    if (pipelineDepth > MAX_PIPELINE_DEPTH) {
      throw new Error(`${depthError}
Service bindings can recurse up to ${MAX_PIPELINE_DEPTH} times.`);
    }
    this.requestDepth = requestDepth;
    this.pipelineDepth = pipelineDepth;
    this.durableObject = durableObject;
    this.externalSubrequestLimit = EXTERNAL_SUBREQUEST_LIMIT_OVERRIDE !== void 0 ? EXTERNAL_SUBREQUEST_LIMIT_OVERRIDE : externalSubrequestLimit;
    this.internalSubrequestLimit = INTERNAL_SUBREQUEST_LIMIT_OVERRIDE !== void 0 ? INTERNAL_SUBREQUEST_LIMIT_OVERRIDE : internalSubrequestLimit;
    this.#currentTime = Date.now();
  }
  runWith(closure) {
    return requestContextStorage.run(this, closure);
  }
  get externalSubrequests() {
    return this.#externalSubrequests;
  }
  get internalSubrequests() {
    return this.#internalSubrequests;
  }
  incrementExternalSubrequests(count = 1) {
    this.#externalSubrequests += count;
    if (this.externalSubrequestLimit !== false && this.#externalSubrequests > this.externalSubrequestLimit) {
      throw new Error(`Too many subrequests. Workers can make up to ${this.externalSubrequestLimit} subrequests per request.
A subrequest is a call to fetch(), a redirect, or a call to any Cache API method.`);
    }
  }
  incrementInternalSubrequests(count = 1) {
    this.#internalSubrequests += count;
    if (this.internalSubrequestLimit !== false && this.#internalSubrequests > this.internalSubrequestLimit) {
      throw new Error(`Too many API requests by single worker invocation. Workers can make up to ${this.internalSubrequestLimit} KV and Durable Object requests per invocation.`);
    }
  }
  get currentTime() {
    return this.#currentTime;
  }
  advanceCurrentTime() {
    this.#currentTime = Date.now();
  }
};

// packages/shared/src/error.ts
var MiniflareError = class extends Error {
  constructor(code, message, cause) {
    super(message);
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = `${new.target.name} [${code}]`;
  }
};
function prefixError(prefix, e) {
  if (e.stack) {
    return new Proxy(e, {
      get(target, propertyKey, receiver) {
        const value = Reflect.get(target, propertyKey, receiver);
        return propertyKey === "stack" ? `${prefix}: ${value}` : value;
      }
    });
  }
  return e;
}

// packages/shared/src/event.ts
var kWrapListener = Symbol("kWrapListener");
var TypedEventTarget = class extends EventTarget {
  #wrappedListeners = new WeakMap();
  #wrap(listener) {
    if (!listener)
      return null;
    let wrappedListener = this.#wrappedListeners.get(listener);
    if (wrappedListener)
      return wrappedListener;
    wrappedListener = this[kWrapListener]((event) => {
      if (typeof listener === "function") {
        listener(event);
      } else {
        listener.handleEvent(event);
      }
    });
    this.#wrappedListeners.set(listener, wrappedListener);
    return wrappedListener;
  }
  addEventListener(type, listener, options) {
    super.addEventListener(type, this[kWrapListener] ? this.#wrap(listener) : listener, options);
  }
  removeEventListener(type, listener, options) {
    super.removeEventListener(type, this[kWrapListener] ? this.#wrap(listener) : listener, options);
  }
  dispatchEvent(event) {
    return super.dispatchEvent(event);
  }
};
var ThrowingEventTarget = class extends TypedEventTarget {
  #wrappedError;
  [kWrapListener](listener) {
    return (event) => {
      try {
        listener(event);
      } catch (error) {
        event.stopImmediatePropagation();
        this.#wrappedError = error;
      }
    };
  }
  dispatchEvent(event) {
    this.#wrappedError = void 0;
    const result = super.dispatchEvent(event);
    if (this.#wrappedError !== void 0)
      throw this.#wrappedError;
    return result;
  }
};

// packages/shared/src/log.ts
var import_path2 = __toModule(require("path"));
var import_colors = __toModule(require("kleur/colors"));
var cwd = process.cwd();
var cwdNodeModules = import_path2.default.join(cwd, "node_modules");
var LogLevel;
(function(LogLevel2) {
  LogLevel2[LogLevel2["NONE"] = 0] = "NONE";
  LogLevel2[LogLevel2["ERROR"] = 1] = "ERROR";
  LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
  LogLevel2[LogLevel2["INFO"] = 3] = "INFO";
  LogLevel2[LogLevel2["DEBUG"] = 4] = "DEBUG";
  LogLevel2[LogLevel2["VERBOSE"] = 5] = "VERBOSE";
})(LogLevel || (LogLevel = {}));
var LEVEL_PREFIX = {
  [0]: "",
  [1]: "err",
  [2]: "wrn",
  [3]: "inf",
  [4]: "dbg",
  [5]: "vrb"
};
var LEVEL_COLOUR = {
  [0]: import_colors.reset,
  [1]: import_colors.red,
  [2]: import_colors.yellow,
  [3]: import_colors.green,
  [4]: import_colors.grey,
  [5]: (input) => (0, import_colors.dim)((0, import_colors.grey)(input))
};
function dimInternalStackLine(line) {
  if (line.startsWith("    at") && (!line.includes(cwd) || line.includes(cwdNodeModules))) {
    return (0, import_colors.dim)(line);
  }
  return line;
}
var Log = class {
  constructor(level = 3, opts = {}) {
    this.level = level;
    const prefix = opts.prefix ?? "mf";
    const suffix = opts.suffix ?? "";
    this.#prefix = prefix ? prefix + ":" : "";
    this.#suffix = suffix ? ":" + suffix : "";
  }
  #prefix;
  #suffix;
  log(message) {
    console.log(message);
  }
  logWithLevel(level, message) {
    if (level <= this.level) {
      const prefix = `[${this.#prefix}${LEVEL_PREFIX[level]}${this.#suffix}]`;
      this.log(LEVEL_COLOUR[level](`${prefix} ${message}`));
    }
  }
  error(message) {
    if (this.level < 1) {
      throw message;
    } else if (message.stack) {
      const lines = message.stack.split("\n").map(dimInternalStackLine);
      this.logWithLevel(1, lines.join("\n"));
    } else {
      this.logWithLevel(1, message.toString());
    }
    if (message.cause) {
      this.error(prefixError("Cause", message.cause));
    }
  }
  warn(message) {
    this.logWithLevel(2, message);
  }
  info(message) {
    this.logWithLevel(3, message);
  }
  debug(message) {
    this.logWithLevel(4, message);
  }
  verbose(message) {
    this.logWithLevel(5, message);
  }
};
var NoOpLog = class extends Log {
  log() {
  }
  error(message) {
    throw message;
  }
};

// packages/shared/src/plugin.ts
var OptionType;
(function(OptionType2) {
  OptionType2[OptionType2["NONE"] = 0] = "NONE";
  OptionType2[OptionType2["BOOLEAN"] = 1] = "BOOLEAN";
  OptionType2[OptionType2["NUMBER"] = 2] = "NUMBER";
  OptionType2[OptionType2["STRING"] = 3] = "STRING";
  OptionType2[OptionType2["STRING_POSITIONAL"] = 4] = "STRING_POSITIONAL";
  OptionType2[OptionType2["BOOLEAN_STRING"] = 5] = "BOOLEAN_STRING";
  OptionType2[OptionType2["BOOLEAN_NUMBER"] = 6] = "BOOLEAN_NUMBER";
  OptionType2[OptionType2["ARRAY"] = 7] = "ARRAY";
  OptionType2[OptionType2["OBJECT"] = 8] = "OBJECT";
})(OptionType || (OptionType = {}));
function Option(metadata) {
  return function(prototype, key) {
    (prototype.opts ??= new Map()).set(key, metadata);
  };
}
var Plugin = class {
  constructor(ctx) {
    this.ctx = ctx;
    this.opts = new.target.prototype.opts;
  }
  #phantom;
  opts;
  assignOptions(options) {
    if (options === void 0 || this.opts === void 0)
      return;
    for (const key of this.opts.keys()) {
      this[key] = options[key];
    }
  }
};
function logOptions(plugins, log, options) {
  log.debug("Options:");
  for (const [name, plugin] of plugins) {
    const pluginOptions = options[name];
    for (const [key, meta] of plugin.prototype.opts?.entries() ?? []) {
      const value = pluginOptions[key];
      if (value === void 0 || meta.type === 0)
        continue;
      const keyName = meta?.logName ?? titleCase(typeof key === "symbol" ? "<symbol>" : key);
      let str;
      if (meta.logValue) {
        str = meta.logValue(value);
        if (str === void 0)
          continue;
      } else if (meta.type === 8) {
        str = Object.keys(value).join(", ");
      } else if (meta.type === 7) {
        str = value.join(", ");
      } else {
        str = value.toString();
      }
      log.debug(`- ${keyName}: ${str}`);
    }
  }
}

// packages/shared/src/queues.ts
var kGetConsumer = Symbol("kGetConsumer");
var kSetConsumer = Symbol("kSetConsumer");

// packages/shared/src/runner.ts
var STRING_SCRIPT_PATH = "<script>";

// packages/shared/src/storage.ts
var Storage = class {
  async getSqliteDatabase() {
    throw new Error("D1 not implemented for this Storage class");
  }
  async hasMany(keys) {
    const results = keys.map(this.has.bind(this));
    let count = 0;
    for (const result of await Promise.all(results))
      if (result)
        count++;
    return count;
  }
  getMany(keys, skipMetadata) {
    return Promise.all(keys.map((key) => this.get(key, skipMetadata)));
  }
  async putMany(data) {
    await Promise.all(data.map(([key, value]) => this.put(key, value)));
  }
  async deleteMany(keys) {
    const results = keys.map(this.delete.bind(this));
    let count = 0;
    for (const result of await Promise.all(results))
      if (result)
        count++;
    return count;
  }
};

// packages/shared/src/sync/clock.ts
var defaultClock = () => Date.now();
function millisToSeconds(millis) {
  return Math.floor(millis / 1e3);
}

// packages/shared/src/sync/gate.ts
var import_assert2 = __toModule(require("assert"));
var import_async_hooks2 = __toModule(require("async_hooks"));
var import_timers = __toModule(require("timers"));
var import_promises = __toModule(require("timers/promises"));
var inputGateStorage = new import_async_hooks2.AsyncLocalStorage();
var outputGateStorage = new import_async_hooks2.AsyncLocalStorage();
function waitForOpenInputGate() {
  const inputGate = inputGateStorage.getStore();
  return inputGate?.waitForOpen();
}
function runWithInputGateClosed(closure, allowConcurrency = false) {
  if (allowConcurrency)
    return closure();
  const inputGate = inputGateStorage.getStore();
  if (inputGate === void 0)
    return closure();
  return inputGate.runWithClosed(closure);
}
function waitForOpenOutputGate() {
  const outputGate = outputGateStorage.getStore();
  return outputGate?.waitForOpen();
}
function waitUntilOnOutputGate(promise, allowUnconfirmed = false) {
  if (allowUnconfirmed)
    return promise;
  const outputGate = outputGateStorage.getStore();
  outputGate?.waitUntil(promise);
  return promise;
}
var InputGate = class {
  #lockCount = 0;
  #resolveQueue = [];
  #parent;
  constructor(parent) {
    this.#parent = parent;
  }
  async runWith(closure) {
    await this.waitForOpen();
    return inputGateStorage.run(this, closure);
  }
  async waitForOpen() {
    await (0, import_promises.setImmediate)();
    if (this.#lockCount === 0)
      return;
    return new Promise((resolve) => this.#resolveQueue.push(resolve));
  }
  async runWithClosed(closure) {
    this.#lock();
    await Promise.resolve();
    const childInputGate = new InputGate(this);
    try {
      return await inputGateStorage.run(childInputGate, closure);
    } finally {
      (0, import_timers.setImmediate)(this.#unlock);
    }
  }
  #lock() {
    this.#lockCount++;
    if (this.#parent)
      this.#parent.#lock();
  }
  #unlock = async () => {
    (0, import_assert2.default)(this.#lockCount > 0);
    this.#lockCount--;
    while (this.#lockCount === 0 && this.#resolveQueue.length) {
      this.#resolveQueue.shift()();
      await (0, import_promises.setImmediate)();
    }
    if (this.#parent)
      return this.#parent.#unlock();
  };
};
var OutputGate = class {
  #waitUntil = [];
  async runWith(closure) {
    try {
      return await outputGateStorage.run(this, closure);
    } finally {
      await this.waitForOpen();
    }
  }
  async waitForOpen() {
    await Promise.all(this.#waitUntil);
  }
  waitUntil(promise) {
    this.#waitUntil.push(promise);
  }
};
var InputGatedEventTarget = class extends TypedEventTarget {
  [kWrapListener](listener) {
    const inputGate = inputGateStorage.getStore();
    return inputGate ? async (event) => {
      await inputGate.waitForOpen();
      listener(event);
    } : listener;
  }
};

// packages/shared/src/sync/mutex.ts
var import_assert3 = __toModule(require("assert"));
var Mutex = class {
  locked = false;
  resolveQueue = [];
  lock() {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise((resolve) => this.resolveQueue.push(resolve));
  }
  unlock() {
    (0, import_assert3.default)(this.locked);
    if (this.resolveQueue.length > 0) {
      this.resolveQueue.shift()?.();
    } else {
      this.locked = false;
    }
  }
  get hasWaiting() {
    return this.resolveQueue.length > 0;
  }
  async runWith(closure) {
    const acquireAwaitable = this.lock();
    if (acquireAwaitable instanceof Promise)
      await acquireAwaitable;
    try {
      const awaitable = closure();
      if (awaitable instanceof Promise)
        return await awaitable;
      return awaitable;
    } finally {
      this.unlock();
    }
  }
};

// packages/shared/src/sqlite.ts
var import_node_path = __toModule(require("node:path"));
async function createSQLiteDB(dbPath) {
  const { npxImport, npxResolve } = await import("npx-import");
  const { default: DatabaseConstructor } = await npxImport("better-sqlite3@7.6.2");
  return new DatabaseConstructor(dbPath, {
    nativeBinding: getSQLiteNativeBindingLocation(npxResolve("better-sqlite3"))
  });
}
function getSQLiteNativeBindingLocation(sqliteResolvePath) {
  return import_node_path.default.resolve(import_node_path.default.dirname(sqliteResolvePath), "../build/Release/better_sqlite3.node");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Compatibility,
  EXTERNAL_SUBREQUEST_LIMIT_BUNDLED,
  EXTERNAL_SUBREQUEST_LIMIT_UNBOUND,
  INTERNAL_SUBREQUEST_LIMIT,
  InputGate,
  InputGatedEventTarget,
  Log,
  LogLevel,
  MiniflareError,
  Mutex,
  NoOpLog,
  Option,
  OptionType,
  OutputGate,
  Plugin,
  RequestContext,
  SITES_NO_CACHE_PREFIX,
  STRING_SCRIPT_PATH,
  Storage,
  ThrowingEventTarget,
  TypedEventTarget,
  addAll,
  arrayCompare,
  assertInRequest,
  base64Decode,
  base64Encode,
  createSQLiteDB,
  defaultClock,
  getRequestContext,
  getSQLiteNativeBindingLocation,
  globsToMatcher,
  kGetConsumer,
  kSetConsumer,
  kWrapListener,
  kebabCase,
  lexicographicCompare,
  logOptions,
  millisToSeconds,
  nonCircularClone,
  numericCompare,
  prefixError,
  randomHex,
  resolveStoragePersist,
  runWithInputGateClosed,
  sanitisePath,
  spaceCase,
  structuredCloneBuffer,
  titleCase,
  usageModelExternalSubrequestLimit,
  viewToArray,
  viewToBuffer,
  waitForOpenInputGate,
  waitForOpenOutputGate,
  waitUntilOnOutputGate
});
/*! Path sanitisation regexps adapted from node-sanitize-filename:
 * https://github.com/parshap/node-sanitize-filename/blob/209c39b914c8eb48ee27bcbde64b2c7822fdf3de/index.js#L4-L37
 *
 * Licensed under the ISC license:
 *
 * Copyright Parsha Pourkhomami <parshap@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the
 * above copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY
 * DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
 * ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
//# sourceMappingURL=index.js.map
