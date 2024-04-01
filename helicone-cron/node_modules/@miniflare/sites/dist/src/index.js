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

// packages/sites/src/index.ts
__export(exports, {
  FilteredKVNamespace: () => FilteredKVNamespace,
  SitesPlugin: () => SitesPlugin
});

// packages/sites/src/filtered.ts
var import_kv = __toModule(require("@miniflare/kv"));
var FilteredKVNamespace = class extends import_kv.KVNamespace {
  #options;
  constructor(storage, options = {}, internalOptions) {
    super(storage, internalOptions);
    this.#options = options;
  }
  #included(key) {
    const options = this.#options;
    if (options.include !== void 0)
      return options.include.test(key);
    if (options.exclude !== void 0)
      return !options.exclude.test(key);
    return true;
  }
  get(key, options) {
    key = this.#options.map?.lookup(key) ?? key;
    if (!this.#included(key))
      return Promise.resolve(null);
    return super.get(key, options);
  }
  getWithMetadata(key, options) {
    key = this.#options.map?.lookup(key) ?? key;
    if (!this.#included(key)) {
      return Promise.resolve({ value: null, metadata: null });
    }
    return super.getWithMetadata(key, options);
  }
  async put(key, value, options) {
    if (this.#options.readOnly) {
      throw new TypeError("Unable to put into read-only namespace");
    }
    key = this.#options.map?.lookup(key) ?? key;
    return super.put(key, value, options);
  }
  async delete(key) {
    if (this.#options.readOnly) {
      throw new TypeError("Unable to delete from read-only namespace");
    }
    key = this.#options.map?.lookup(key) ?? key;
    return super.delete(key);
  }
  async list(options) {
    const { keys, list_complete, cursor } = await super.list(options);
    return {
      keys: keys.filter((key) => {
        if (!this.#included(key.name))
          return false;
        if (this.#options.map !== void 0) {
          key.name = this.#options.map.reverseLookup(key.name);
        }
        return true;
      }),
      list_complete,
      cursor
    };
  }
};

// packages/sites/src/plugin.ts
var import_assert = __toModule(require("assert"));
var import_path = __toModule(require("path"));
var import_shared = __toModule(require("@miniflare/shared"));
var SITES_KEY_MAPPER = {
  lookup(key) {
    return key.startsWith(import_shared.SITES_NO_CACHE_PREFIX) ? decodeURIComponent(key.substring(import_shared.SITES_NO_CACHE_PREFIX.length)) : key;
  },
  reverseLookup(key) {
    return import_shared.SITES_NO_CACHE_PREFIX + encodeURIComponent(key);
  }
};
var SitesPlugin = class extends import_shared.Plugin {
  sitePath;
  siteInclude;
  siteExclude;
  #include;
  #exclude;
  #resolvedSitePath;
  #storage;
  #__STATIC_CONTENT;
  constructor(ctx, options) {
    super(ctx);
    this.assignOptions(options);
    if (!this.sitePath)
      return;
    this.#include = this.siteInclude && (0, import_shared.globsToMatcher)(this.siteInclude);
    this.#exclude = this.siteExclude && (0, import_shared.globsToMatcher)(this.siteExclude);
    const {
      FileStorage
    } = require("@miniflare/storage-file");
    this.#resolvedSitePath = import_path.default.resolve(this.ctx.rootPath, this.sitePath);
    this.#storage = new FileStorage(this.#resolvedSitePath, false);
    this.#__STATIC_CONTENT = new FilteredKVNamespace(this.#storage, {
      readOnly: true,
      map: SITES_KEY_MAPPER,
      include: this.#include,
      exclude: this.#exclude
    });
  }
  async setup() {
    if (!this.sitePath)
      return {};
    (0, import_assert.default)(this.#resolvedSitePath !== void 0 && this.#storage !== void 0 && this.#__STATIC_CONTENT !== void 0);
    const staticContentManifest = {};
    const result = await this.#storage.list();
    import_assert.default.strictEqual(result.cursor, "");
    for (const { name } of result.keys) {
      if (this.#include !== void 0 && !this.#include.test(name))
        continue;
      if (this.#exclude !== void 0 && this.#exclude.test(name))
        continue;
      staticContentManifest[name] = SITES_KEY_MAPPER.reverseLookup(name);
    }
    const __STATIC_CONTENT_MANIFEST = JSON.stringify(staticContentManifest);
    const bindings = {
      __STATIC_CONTENT: this.#__STATIC_CONTENT,
      __STATIC_CONTENT_MANIFEST
    };
    const additionalModules = {
      __STATIC_CONTENT_MANIFEST: { default: __STATIC_CONTENT_MANIFEST }
    };
    return { bindings, watch: [this.#resolvedSitePath], additionalModules };
  }
};
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.STRING,
    name: "site",
    alias: "s",
    description: "Path to serve Workers Site files from",
    logName: "Workers Site Path",
    fromWrangler: ({ site }) => site?.bucket
  })
], SitesPlugin.prototype, "sitePath", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.ARRAY,
    description: "Glob pattern of site files to serve",
    logName: "Workers Site Include",
    fromWrangler: ({ site }) => site?.include
  })
], SitesPlugin.prototype, "siteInclude", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.ARRAY,
    description: "Glob pattern of site files not to serve",
    logName: "Workers Site Exclude",
    fromWrangler: ({ site }) => site?.exclude
  })
], SitesPlugin.prototype, "siteExclude", 2);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FilteredKVNamespace,
  SitesPlugin
});
//# sourceMappingURL=index.js.map
