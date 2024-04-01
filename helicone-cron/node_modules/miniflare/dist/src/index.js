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

// packages/miniflare/src/index.ts
__export(exports, {
  Log: () => import_shared4.Log,
  LogLevel: () => import_shared4.LogLevel,
  Miniflare: () => Miniflare,
  PLUGINS: () => PLUGINS,
  Request: () => import_core2.Request,
  Response: () => import_core2.Response,
  VariedStorageFactory: () => VariedStorageFactory,
  startREPL: () => startREPL,
  updateCheck: () => updateCheck
});

// packages/miniflare/src/api.ts
var import_cache = __toModule(require("@miniflare/cache"));
var import_core = __toModule(require("@miniflare/core"));
var import_d1 = __toModule(require("@miniflare/d1"));
var import_durable_objects = __toModule(require("@miniflare/durable-objects"));
var import_html_rewriter = __toModule(require("@miniflare/html-rewriter"));
var import_http_server = __toModule(require("@miniflare/http-server"));
var import_kv = __toModule(require("@miniflare/kv"));
var import_queues = __toModule(require("@miniflare/queues"));
var import_queues2 = __toModule(require("@miniflare/queues"));
var import_r2 = __toModule(require("@miniflare/r2"));
var import_runner_vm = __toModule(require("@miniflare/runner-vm"));
var import_scheduler = __toModule(require("@miniflare/scheduler"));
var import_shared2 = __toModule(require("@miniflare/shared"));
var import_sites = __toModule(require("@miniflare/sites"));
var import_web_sockets = __toModule(require("@miniflare/web-sockets"));
var import_source_map_support = __toModule(require("source-map-support"));

// packages/miniflare/src/repl.ts
var import_os = __toModule(require("os"));
var import_path = __toModule(require("path"));
var import_repl = __toModule(require("repl"));
var import_vm = __toModule(require("vm"));
var defaultReplHistory = import_path.default.join(import_os.default.homedir(), ".mf_repl_history");
async function startREPL(mf) {
  const historyPath = process.env.MINIFLARE_REPL_HISTORY ?? defaultReplHistory;
  let historySize = Number(process.env.MINIFLARE_REPL_HISTORY_SIZE);
  if (isNaN(historySize) || historySize <= 0)
    historySize = 1e3;
  const replMode = process.env.MINIFLARE_REPL_MODE?.toLowerCase().trim() === "strict" ? import_repl.default.REPL_MODE_STRICT : import_repl.default.REPL_MODE_SLOPPY;
  const globalScope = await mf.getGlobalScope();
  const bindings = await mf.getBindings();
  const context = import_vm.default.createContext(globalScope, {
    codeGeneration: { strings: false, wasm: false }
  });
  context.env = bindings;
  const replServer = import_repl.default.start({ replMode, historySize });
  replServer.context = context;
  if (historyPath !== "") {
    replServer.setupHistory(historyPath, (err) => {
      if (err)
        mf.log.error(err);
    });
  }
}

// packages/miniflare/src/storage.ts
var import_assert = __toModule(require("assert"));
var import_path2 = __toModule(require("path"));
var import_shared = __toModule(require("@miniflare/shared"));
var redisConnectionStringRegexp = /^rediss?:\/\//;
var VariedStorageFactory = class {
  constructor(memoryStorages = new Map(), redisConnections = new Map()) {
    this.memoryStorages = memoryStorages;
    this.redisConnections = redisConnections;
  }
  storage(namespace, persist) {
    (0, import_assert.default)(typeof persist !== "boolean");
    if (persist === void 0) {
      let storage = this.memoryStorages.get(namespace);
      if (storage)
        return storage;
      const {
        MemoryStorage
      } = require("@miniflare/storage-memory");
      this.memoryStorages.set(namespace, storage = new MemoryStorage());
      return storage;
    }
    if (redisConnectionStringRegexp.test(persist)) {
      const {
        RedisStorage
      } = require("@miniflare/storage-redis");
      const IORedis = require("ioredis");
      let connection = this.redisConnections.get(persist);
      if (!connection) {
        this.redisConnections.set(persist, connection = new IORedis(persist));
      }
      return new RedisStorage(connection, namespace);
    }
    const root = import_path2.default.join(persist, (0, import_shared.sanitisePath)(namespace));
    const {
      FileStorage
    } = require("@miniflare/storage-file");
    return new FileStorage(root);
  }
  async dispose() {
    for (const redisConnection of this.redisConnections.values()) {
      redisConnection.disconnect();
    }
  }
};

// packages/miniflare/src/api.ts
var PLUGINS = {
  CorePlugin: import_core.CorePlugin,
  HTTPPlugin: import_http_server.HTTPPlugin,
  SchedulerPlugin: import_scheduler.SchedulerPlugin,
  BuildPlugin: import_core.BuildPlugin,
  KVPlugin: import_kv.KVPlugin,
  D1Plugin: import_d1.D1Plugin,
  R2Plugin: import_r2.R2Plugin,
  DurableObjectsPlugin: import_durable_objects.DurableObjectsPlugin,
  CachePlugin: import_cache.CachePlugin,
  SitesPlugin: import_sites.SitesPlugin,
  QueuesPlugin: import_queues.QueuesPlugin,
  HTMLRewriterPlugin: import_html_rewriter.HTMLRewriterPlugin,
  WebSocketPlugin: import_web_sockets.WebSocketPlugin,
  BindingsPlugin: import_core.BindingsPlugin
};
var Miniflare = class extends import_core.MiniflareCore {
  #storageFactory;
  constructor(options) {
    if (options?.sourceMap) {
      import_source_map_support.default.install({ emptyCacheBetweenOperations: true });
    }
    const log = options?.log ?? new import_shared2.NoOpLog();
    const storageFactory = new VariedStorageFactory();
    const queueBroker = new import_queues2.QueueBroker(log);
    super(PLUGINS, {
      log,
      storageFactory,
      queueBroker,
      scriptRunner: new import_runner_vm.VMScriptRunner(),
      scriptRequired: options?.scriptRequired ?? true
    }, options);
    this.#storageFactory = storageFactory;
  }
  async dispose() {
    await super.dispose();
    await this.#storageFactory.dispose();
  }
  async getKVNamespace(namespace) {
    const plugin = (await this.getPlugins()).KVPlugin;
    const storage = this.getPluginStorage("KVPlugin");
    return plugin.getNamespace(storage, namespace);
  }
  async getR2Bucket(bucket) {
    const plugin = (await this.getPlugins()).R2Plugin;
    const storage = this.getPluginStorage("R2Plugin");
    return plugin.getBucket(storage, bucket);
  }
  async getCaches() {
    const plugin = (await this.getPlugins()).CachePlugin;
    return plugin.getCaches();
  }
  async getDurableObjectNamespace(objectName) {
    const plugin = (await this.getPlugins()).DurableObjectsPlugin;
    const storage = this.getPluginStorage("DurableObjectsPlugin");
    return plugin.getNamespace(storage, objectName);
  }
  async getDurableObjectStorage(id) {
    const plugin = (await this.getPlugins()).DurableObjectsPlugin;
    const storage = this.getPluginStorage("DurableObjectsPlugin");
    return plugin.getStorage(storage, id);
  }
  createServer(options) {
    return (0, import_http_server.createServer)(this, options);
  }
  startServer(options) {
    return (0, import_http_server.startServer)(this, options);
  }
  startScheduler() {
    return (0, import_scheduler.startScheduler)(this);
  }
  startREPL() {
    return startREPL(this);
  }
  async getOpenURL() {
    const {
      open,
      httpsEnabled,
      host = "localhost",
      port = import_http_server.DEFAULT_PORT
    } = (await this.getPlugins()).HTTPPlugin;
    if (!open)
      return;
    if (typeof open === "string")
      return open;
    const protocol = httpsEnabled ? "https" : "http";
    return `${protocol}://${host}:${port}/`;
  }
};

// packages/miniflare/src/updater.ts
var import_promises = __toModule(require("fs/promises"));
var import_shared3 = __toModule(require("@miniflare/shared"));
var import_semiver = __toModule(require("semiver"));
var import_undici = __toModule(require("undici"));
async function updateCheck({
  pkg,
  lastCheckFile,
  log,
  now = Date.now(),
  registry = "https://registry.npmjs.org/"
}) {
  let lastCheck = 0;
  try {
    lastCheck = parseInt(await import_promises.default.readFile(lastCheckFile, "utf8"));
  } catch {
  }
  if (now - lastCheck < 864e5)
    return;
  const res = await (0, import_undici.fetch)(`${registry}${pkg.name}/latest`, {
    headers: { Accept: "application/json" }
  });
  const registryVersion = (await res.json()).version;
  if (!registryVersion)
    return;
  await import_promises.default.writeFile(lastCheckFile, now.toString(), "utf8");
  if ((0, import_semiver.default)(registryVersion, pkg.version) > 0) {
    log.warn(`Miniflare ${registryVersion} is available, but you're using ${pkg.version}. Update for improved compatibility with Cloudflare Workers.`);
    const registryMajor = registryVersion.split(".")[0];
    const pkgMajor = pkg.version.split(".")[0];
    if ((0, import_shared3.numericCompare)(registryMajor, pkgMajor) > 0) {
      log.warn(`${registryVersion} includes breaking changes.Make sure you check the changelog before upgrading.`);
    }
  }
}

// packages/miniflare/src/index.ts
var import_shared4 = __toModule(require("@miniflare/shared"));
var import_core2 = __toModule(require("@miniflare/core"));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Log,
  LogLevel,
  Miniflare,
  PLUGINS,
  Request,
  Response,
  VariedStorageFactory,
  startREPL,
  updateCheck
});
//# sourceMappingURL=index.js.map
