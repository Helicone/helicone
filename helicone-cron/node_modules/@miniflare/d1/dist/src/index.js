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

// packages/d1/src/index.ts
__export(exports, {
  BetaDatabase: () => BetaDatabase,
  D1Plugin: () => D1Plugin,
  Statement: () => Statement
});

// packages/d1/src/database.ts
var import_node_perf_hooks2 = __toModule(require("node:perf_hooks"));

// packages/d1/src/statement.ts
var import_node_perf_hooks = __toModule(require("node:perf_hooks"));
function errorWithCause(message, e) {
  return new Error(message, { cause: e });
}
var Statement = class {
  #db;
  #query;
  #bindings;
  constructor(db, query, bindings) {
    this.#db = db;
    this.#query = query;
    this.#bindings = bindings;
  }
  bind(...params) {
    if (this.#bindings !== void 0) {
      throw new TypeError("The bind() method can only be invoked once per statement object");
    }
    return new Statement(this.#db, this.#query, params);
  }
  #prepareAndBind() {
    const prepared = this.#db.prepare(this.#query);
    if (this.#bindings === void 0)
      return prepared;
    try {
      return prepared.bind(this.#bindings);
    } catch (e) {
      if (this.#bindings.length > 0 && typeof this.#bindings[0] !== "object") {
        return prepared.bind(Object.fromEntries(this.#bindings.map((v, i) => [i + 1, v])));
      } else {
        throw e;
      }
    }
  }
  async all() {
    const start = import_node_perf_hooks.performance.now();
    const statementWithBindings = this.#prepareAndBind();
    try {
      const results = this.#all(statementWithBindings);
      return {
        results,
        duration: import_node_perf_hooks.performance.now() - start,
        lastRowId: null,
        changes: null,
        success: true,
        served_by: "x-miniflare.db3"
      };
    } catch (e) {
      throw errorWithCause("D1_ALL_ERROR", e);
    }
  }
  #all(statementWithBindings) {
    try {
      return statementWithBindings.all();
    } catch (e) {
      if (/This statement does not return data\. Use run\(\) instead/.exec(e.message)) {
        return this.#run(statementWithBindings);
      }
      throw e;
    }
  }
  async first(col) {
    const statementWithBindings = this.#prepareAndBind();
    try {
      const data = this.#first(statementWithBindings);
      return typeof col === "string" ? data[col] : data;
    } catch (e) {
      throw errorWithCause("D1_FIRST_ERROR", e);
    }
  }
  #first(statementWithBindings) {
    return statementWithBindings.get();
  }
  async run() {
    const start = import_node_perf_hooks.performance.now();
    const statementWithBindings = this.#prepareAndBind();
    try {
      const { changes, lastInsertRowid } = this.#run(statementWithBindings);
      return {
        results: null,
        duration: import_node_perf_hooks.performance.now() - start,
        lastRowId: lastInsertRowid,
        changes,
        success: true,
        served_by: "x-miniflare.db3"
      };
    } catch (e) {
      throw errorWithCause("D1_RUN_ERROR", e);
    }
  }
  #run(statementWithBindings) {
    return statementWithBindings.run();
  }
  async raw() {
    const statementWithBindings = this.#prepareAndBind();
    return this.#raw(statementWithBindings);
  }
  #raw(statementWithBindings) {
    return statementWithBindings.raw();
  }
};

// packages/d1/src/database.ts
var BetaDatabase = class {
  #db;
  constructor(db) {
    this.#db = db;
  }
  prepare(source) {
    return new Statement(this.#db, source);
  }
  async batch(statements) {
    return await Promise.all(statements.map((s) => s.all()));
  }
  async exec(multiLineStatements) {
    const statements = multiLineStatements.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    const start = import_node_perf_hooks2.performance.now();
    for (const statement of statements) {
      await new Statement(this.#db, statement).all();
    }
    return {
      count: statements.length,
      duration: import_node_perf_hooks2.performance.now() - start
    };
  }
  async dump() {
    throw new Error("DB.dump() not implemented locally!");
  }
};

// packages/d1/src/plugin.ts
var import_shared = __toModule(require("@miniflare/shared"));
var D1_BETA_PREFIX = `__D1_BETA__`;
var D1Plugin = class extends import_shared.Plugin {
  d1Databases;
  d1Persist;
  #persist;
  constructor(ctx, options) {
    super(ctx);
    this.assignOptions(options);
    this.#persist = (0, import_shared.resolveStoragePersist)(ctx.rootPath, this.d1Persist);
  }
  async getBetaDatabase(storageFactory, dbName) {
    const storage = await storageFactory.storage(dbName, this.#persist);
    return new BetaDatabase(await storage.getSqliteDatabase());
  }
  async setup(storageFactory) {
    const bindings = {};
    for (const dbName of this.d1Databases ?? []) {
      if (dbName.startsWith(D1_BETA_PREFIX)) {
        bindings[dbName] = await this.getBetaDatabase(storageFactory, dbName.slice(D1_BETA_PREFIX.length));
      } else {
        console.warn(`Not injecting D1 Database for '${dbName}' as this version of Miniflare only supports D1 beta bindings. Upgrade Wrangler and/or Miniflare and try again.`);
      }
    }
    return { bindings };
  }
};
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.ARRAY,
    name: "d1",
    description: "D1 namespace to bind",
    logName: "D1 Namespaces",
    fromWrangler: ({ d1_databases }) => d1_databases?.map(({ binding }) => binding)
  })
], D1Plugin.prototype, "d1Databases", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.BOOLEAN_STRING,
    description: "Persist D1 data (to optional path)",
    logName: "D1 Persistence",
    fromWrangler: ({ miniflare }) => miniflare?.d1_persist
  })
], D1Plugin.prototype, "d1Persist", 2);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BetaDatabase,
  D1Plugin,
  Statement
});
//# sourceMappingURL=index.js.map
