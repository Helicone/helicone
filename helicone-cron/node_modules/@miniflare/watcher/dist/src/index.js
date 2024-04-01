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

// packages/watcher/src/index.ts
__export(exports, {
  Watcher: () => Watcher
});
var import_assert = __toModule(require("assert"));
var import_fs = __toModule(require("fs"));
var import_path = __toModule(require("path"));
var import_util = __toModule(require("util"));
var log = (0, import_util.debuglog)("mf-watch");
function withinDir(dir, file) {
  const rel = import_path.default.relative(dir, file);
  return !!rel && !rel.startsWith("..") && !import_path.default.isAbsolute(rel);
}
function walkDirs(root, callback) {
  callback(root);
  for (const name of import_fs.default.readdirSync(root)) {
    const filePath = import_path.default.join(root, name);
    if (!import_fs.default.statSync(filePath).isDirectory())
      continue;
    walkDirs(filePath, callback);
  }
}
var PathWatcher = class {
  constructor(options, filePath, callback) {
    this.options = options;
    this.filePath = filePath;
    this.callback = callback;
  }
  watchFileListener;
  watcher;
  watchers;
  lastMtimes;
  get watching() {
    return !!(this.watchFileListener || this.watcher || this.watchers || this.lastMtimes);
  }
  startCreateWatcher() {
    (0, import_assert.default)(!this.watching);
    log(`${this.filePath}: polling for create...`);
    this.watchFileListener = (curr) => {
      if (curr.mtimeMs === 0)
        return;
      log(`${this.filePath}: created, tidying up temporary watcher...`);
      import_fs.default.unwatchFile(this.filePath, this.watchFileListener);
      this.watchFileListener = void 0;
      this.callback();
      void this.start();
    };
    import_fs.default.watchFile(this.filePath, { interval: this.options.createPollInterval }, this.watchFileListener);
  }
  startPollingWatcher() {
    (0, import_assert.default)(!this.watching);
    log(`${this.filePath}: polling...`);
    this.watchFileListener = (curr, prev) => {
      log(`${this.filePath}: ${prev.mtimeMs} -> ${curr.mtimeMs}`);
      if (curr.mtimeMs === 0) {
        this.callback();
        this.dispose();
        this.startCreateWatcher();
      } else if (curr.mtimeMs !== prev.mtimeMs) {
        this.callback();
      }
    };
    import_fs.default.watchFile(this.filePath, { interval: this.options.pollInterval }, this.watchFileListener);
  }
  listener = (event, fileName) => {
    log(`${this.filePath}: ${event}: ${fileName}`);
    if (fileName) {
      try {
        const resolved = import_path.default.resolve(this.filePath, fileName);
        const mtime = import_fs.default.statSync(resolved).mtimeMs;
        const previousMtime = this.lastMtimes?.get(resolved);
        if (previousMtime === mtime) {
          log(`${this.filePath}: ${resolved}: ignored spurious event`);
          return;
        }
        this.lastMtimes?.set(resolved, mtime);
      } catch {
      }
    }
    this.callback();
    if (!import_fs.default.existsSync(this.filePath)) {
      this.dispose();
      this.startCreateWatcher();
    }
  };
  startDeletedWatcher() {
    this.watchFileListener = (curr) => {
      if (curr.mtimeMs === 0) {
        this.callback();
        this.dispose();
        this.startCreateWatcher();
      }
    };
    import_fs.default.watchFile(this.filePath, { interval: this.options.pollInterval }, this.watchFileListener);
  }
  startPlatformRecursiveWatcher() {
    (0, import_assert.default)(!this.watching);
    log(`${this.filePath}: recursively watching with platform...`);
    this.lastMtimes = new Map();
    this.watcher = import_fs.default.watch(this.filePath, { recursive: true }, this.listener);
    this.startDeletedWatcher();
  }
  startRecursiveWatcher() {
    (0, import_assert.default)(!this.watching);
    log(`${this.filePath}: recursively watching...`);
    const watchers = this.watchers = new Map();
    this.lastMtimes = new Map();
    const update = (dir, event, fileName) => {
      let dirIsDirectory = false;
      try {
        dirIsDirectory = import_fs.default.statSync(dir).isDirectory();
      } catch {
      }
      if (!dirIsDirectory) {
        log(`${this.filePath}: ${dir} is no longer a directory, resetting...`);
        this.callback();
        this.dispose();
        this.start();
        return;
      }
      const filePath = import_path.default.join(dir, fileName);
      this.listener(event, filePath);
      try {
        if (import_fs.default.statSync(filePath).isDirectory()) {
          walkDirs(filePath, walkCallback);
        }
      } catch (e) {
        if (e.code !== "ENOENT")
          throw e;
        for (const [watchedPath, watcher] of watchers.entries()) {
          if (filePath === watchedPath || withinDir(filePath, watchedPath)) {
            watcher.close();
            watchers.delete(watchedPath);
          }
        }
      }
      log(`${this.filePath}: watching ${[...watchers.keys()].join(",")}`);
    };
    const walkCallback = (dir) => {
      if (!watchers.has(dir)) {
        watchers.set(dir, import_fs.default.watch(dir, update.bind(this, dir)));
      }
    };
    try {
      walkDirs(this.filePath, walkCallback);
      this.startDeletedWatcher();
    } catch (e) {
      if (e.code !== "ENOENT")
        throw e;
      this.dispose();
      this.startCreateWatcher();
    }
  }
  start() {
    try {
      if (import_fs.default.statSync(this.filePath).isDirectory()) {
        if (this.options.forceRecursive) {
          return this.startRecursiveWatcher();
        } else {
          return this.startPlatformRecursiveWatcher();
        }
      } else {
        return this.startPollingWatcher();
      }
    } catch (e) {
      this.dispose();
      if (e.code === "ENOENT") {
        return this.startCreateWatcher();
      }
      if (e.code === "ERR_FEATURE_UNAVAILABLE_ON_PLATFORM") {
        return this.startRecursiveWatcher();
      }
      throw e;
    }
  }
  dispose() {
    log(`${this.filePath}: disposing...`);
    if (this.watchFileListener) {
      import_fs.default.unwatchFile(this.filePath, this.watchFileListener);
      this.watchFileListener = void 0;
    }
    this.watcher?.close();
    this.watcher = void 0;
    if (this.watchers) {
      for (const watcher of this.watchers.values())
        watcher.close();
      this.watchers = void 0;
    }
    this.lastMtimes = void 0;
    (0, import_assert.default)(!this.watching);
  }
};
var Watcher = class {
  #watchers = new Map();
  #callback;
  #options;
  constructor(callback, options) {
    this.#callback = callback;
    this.#options = {
      debounce: options?.debounce ?? 50,
      pollInterval: options?.pollInterval ?? 250,
      createPollInterval: options?.createPollInterval ?? 1e3,
      forceRecursive: options?.forceRecursive ?? false
    };
  }
  watch(paths) {
    if (typeof paths === "string")
      paths = [paths];
    for (const rawPath of paths) {
      const resolved = import_path.default.resolve(rawPath);
      if (this.#watchers.has(resolved)) {
        log(`${resolved}: already watching`);
        continue;
      }
      log(`${resolved}: watching...`);
      let debounceHandle;
      const callback = () => {
        clearTimeout(debounceHandle);
        debounceHandle = setTimeout(this.#callback, this.#options.debounce, resolved);
      };
      const watcher = new PathWatcher(this.#options, resolved, callback);
      this.#watchers.set(resolved, watcher);
      watcher.start();
    }
  }
  unwatch(paths) {
    if (typeof paths === "string")
      paths = [paths];
    for (const rawPath of paths) {
      const resolved = import_path.default.resolve(rawPath);
      log(`${resolved}: unwatching...`);
      this.#watchers.get(resolved)?.dispose();
      this.#watchers.delete(resolved);
    }
  }
  dispose() {
    for (const watcher of this.#watchers.values())
      watcher.dispose();
    this.#watchers.clear();
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Watcher
});
//# sourceMappingURL=index.js.map
