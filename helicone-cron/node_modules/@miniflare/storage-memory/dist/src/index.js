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

// packages/storage-memory/src/index.ts
__export(exports, {
  LocalStorage: () => LocalStorage,
  MemoryStorage: () => MemoryStorage,
  cloneMetadata: () => cloneMetadata,
  listFilterMatch: () => listFilterMatch,
  listPaginate: () => listPaginate
});

// packages/storage-memory/src/helpers.ts
var import_shared = __toModule(require("@miniflare/shared"));
function cloneMetadata(metadata) {
  return metadata && (0, import_shared.nonCircularClone)(metadata);
}
function listFilterMatch(options, name) {
  return !(options?.prefix && !name.startsWith(options.prefix) || options?.start && (0, import_shared.lexicographicCompare)(name, options.start) < 0 || options?.end && (0, import_shared.lexicographicCompare)(name, options.end) >= 0);
}
function listPaginate(options, keys) {
  const resKeys = [];
  const direction = options?.reverse ? -1 : 1;
  keys.sort((a, b) => direction * (0, import_shared.lexicographicCompare)(a.name, b.name));
  const startAfter = options?.cursor ? (0, import_shared.base64Decode)(options.cursor) : "";
  let startIndex = 0;
  if (startAfter !== "") {
    startIndex = keys.findIndex(({ name }) => name === startAfter);
    if (startIndex === -1)
      startIndex = keys.length;
    startIndex++;
  }
  let endIndex = startIndex;
  const prefix = options?.prefix ?? "";
  const delimitedPrefixes = new Set();
  for (let i = startIndex; i < keys.length; i++) {
    const key = keys[i];
    const { name } = key;
    endIndex = i;
    if (options?.delimiter !== void 0 && name.startsWith(prefix) && name.slice(prefix.length).includes(options.delimiter)) {
      const { delimiter } = options;
      const objectKey = name.slice(prefix.length);
      const delimitedPrefix = prefix + objectKey.split(delimiter)[0] + delimiter;
      delimitedPrefixes.add(delimitedPrefix);
      while (i < keys.length) {
        const nextKey = keys[i];
        const nextName = nextKey.name;
        if (!nextName.startsWith(delimitedPrefix))
          break;
        endIndex = i;
        i++;
      }
      i--;
    } else {
      resKeys.push(key);
    }
    if (options?.limit !== void 0 && resKeys.length + delimitedPrefixes.size >= options.limit) {
      break;
    }
  }
  const nextCursor = endIndex < keys.length - 1 ? (0, import_shared.base64Encode)(keys[endIndex].name) : "";
  const res = {
    keys: resKeys,
    cursor: nextCursor
  };
  if (options?.delimiter !== void 0) {
    res.delimitedPrefixes = Array.from(delimitedPrefixes);
  }
  return res;
}

// packages/storage-memory/src/local.ts
var import_shared2 = __toModule(require("@miniflare/shared"));
var LocalStorage = class extends import_shared2.Storage {
  constructor(clock = import_shared2.defaultClock) {
    super();
    this.clock = clock;
  }
  expired({ expiration }, time = this.clock()) {
    return expiration !== void 0 && expiration <= (0, import_shared2.millisToSeconds)(time);
  }
  async has(key) {
    const stored = await this.hasMaybeExpired(key);
    if (stored === void 0)
      return false;
    if (this.expired(stored)) {
      await this.deleteMaybeExpired(key);
      return false;
    }
    return true;
  }
  async head(key) {
    const stored = await this.headMaybeExpired(key);
    if (stored === void 0)
      return void 0;
    if (this.expired(stored)) {
      await this.deleteMaybeExpired(key);
      return void 0;
    }
    return stored;
  }
  async get(key) {
    const stored = await this.getMaybeExpired(key);
    if (stored === void 0)
      return void 0;
    if (this.expired(stored)) {
      await this.deleteMaybeExpired(key);
      return void 0;
    }
    return stored;
  }
  async getRange(key, range = {}) {
    const stored = await this.getRangeMaybeExpired(key, range);
    if (stored === void 0)
      return void 0;
    if (this.expired(stored)) {
      await this.deleteMaybeExpired(key);
      return void 0;
    }
    return stored;
  }
  async delete(key) {
    const stored = await this.hasMaybeExpired(key);
    const expired = stored !== void 0 && this.expired(stored);
    const deleted = await this.deleteMaybeExpired(key);
    if (!deleted)
      return false;
    return !expired;
  }
  async list(options) {
    const time = this.clock();
    const deletePromises = [];
    let keys = await this.listAllMaybeExpired();
    keys = keys.filter((stored) => {
      if (this.expired(stored, time)) {
        deletePromises.push(this.deleteMaybeExpired(stored.name));
        return false;
      }
      return listFilterMatch(options, stored.name);
    });
    const res = listPaginate(options, keys);
    await Promise.all(deletePromises);
    return res;
  }
};

// packages/storage-memory/src/memory.ts
var import_shared3 = __toModule(require("@miniflare/shared"));
var MemoryStorage = class extends LocalStorage {
  constructor(map = new Map(), clock = import_shared3.defaultClock) {
    super(clock);
    this.map = map;
  }
  sqliteDB;
  hasMaybeExpired(key) {
    const stored = this.map.get(key);
    return stored && {
      expiration: stored.expiration,
      metadata: cloneMetadata(stored.metadata)
    };
  }
  headMaybeExpired(key) {
    const stored = this.map.get(key);
    return stored && {
      expiration: stored.expiration,
      metadata: cloneMetadata(stored.metadata)
    };
  }
  getMaybeExpired(key) {
    const stored = this.map.get(key);
    return stored && {
      value: stored.value.slice(),
      expiration: stored.expiration,
      metadata: cloneMetadata(stored.metadata)
    };
  }
  getRangeMaybeExpired(key, { offset, length, suffix }) {
    const stored = this.map.get(key);
    if (stored === void 0)
      return;
    const { value } = stored;
    const size = value.byteLength;
    if (suffix !== void 0) {
      if (suffix <= 0) {
        throw new Error("Suffix must be > 0");
      }
      if (suffix > size)
        suffix = size;
      offset = size - suffix;
      length = size - offset;
    }
    if (offset === void 0)
      offset = 0;
    if (length === void 0)
      length = size - offset;
    if (offset < 0)
      throw new Error("Offset must be >= 0");
    if (offset > size)
      throw new Error("Offset must be < size");
    if (length <= 0)
      throw new Error("Length must be > 0");
    if (offset + length > size)
      length = size - offset;
    return {
      value: value.slice(offset, offset + length),
      expiration: stored.expiration,
      metadata: cloneMetadata(stored.metadata),
      range: {
        offset,
        length
      }
    };
  }
  put(key, value) {
    this.map.set(key, {
      value: value.value.slice(),
      expiration: value.expiration,
      metadata: cloneMetadata(value.metadata)
    });
  }
  deleteMaybeExpired(key) {
    return this.map.delete(key);
  }
  static entryToStoredKey([name, { expiration, metadata }]) {
    return {
      name,
      expiration,
      metadata: cloneMetadata(metadata)
    };
  }
  listAllMaybeExpired() {
    return Array.from(this.map.entries()).map(MemoryStorage.entryToStoredKey);
  }
  async getSqliteDatabase() {
    if (this.sqliteDB)
      return this.sqliteDB;
    this.sqliteDB = await (0, import_shared3.createSQLiteDB)(":memory:");
    return this.sqliteDB;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LocalStorage,
  MemoryStorage,
  cloneMetadata,
  listFilterMatch,
  listPaginate
});
//# sourceMappingURL=index.js.map
