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

// packages/storage-file/src/index.ts
__export(exports, {
  FileStorage: () => FileStorage,
  FileStorageError: () => FileStorageError
});
var import_fs = __toModule(require("fs"));
var import_path2 = __toModule(require("path"));
var import_shared = __toModule(require("@miniflare/shared"));
var import_storage_memory = __toModule(require("@miniflare/storage-memory"));

// packages/storage-file/src/helpers.ts
var import_promises = __toModule(require("fs/promises"));
var import_path = __toModule(require("path"));
async function onNotFound(promise, value) {
  try {
    return await promise;
  } catch (e) {
    if (e.code === "ENOENT")
      return value;
    throw e;
  }
}
function readFile(filePath, decode) {
  return onNotFound(import_promises.default.readFile(filePath, decode && "utf8"), void 0);
}
async function readFileRange(filePath, offset, length, suffix) {
  let fd = null;
  let res;
  try {
    filePath = await import_promises.default.realpath(filePath);
    const { size } = await import_promises.default.lstat(filePath);
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
    if (length === void 0) {
      length = size - offset;
    }
    if (offset < 0)
      throw new Error("Offset must be >= 0");
    if (offset >= size)
      throw new Error("Offset must be < size");
    if (length <= 0)
      throw new Error("Length must be > 0");
    if (offset + length > size)
      length = size - offset;
    fd = await import_promises.default.open(filePath, "r");
    res = Buffer.alloc(length);
    await fd.read(res, 0, length, offset);
  } catch (e) {
    if (e.code === "ENOENT")
      return void 0;
    throw e;
  } finally {
    await fd?.close();
  }
  return { value: res, offset, length };
}
async function writeFile(filePath, data) {
  await import_promises.default.mkdir(import_path.default.dirname(filePath), { recursive: true });
  await import_promises.default.writeFile(filePath, data, typeof data === "string" ? "utf8" : void 0);
}
function deleteFile(filePath) {
  return onNotFound(import_promises.default.unlink(filePath).then(() => true), false);
}
function readDir(filePath) {
  return onNotFound(import_promises.default.readdir(filePath), []);
}
async function* walk(rootPath) {
  const fileNames = await readDir(rootPath);
  for (const fileName of fileNames) {
    const filePath = import_path.default.join(rootPath, fileName);
    if ((await import_promises.default.stat(filePath)).isDirectory()) {
      yield* walk(filePath);
    } else {
      yield filePath;
    }
  }
}

// packages/storage-file/src/index.ts
var metaSuffix = ".meta.json";
var FileStorageError = class extends import_shared.MiniflareError {
};
var FileStorage = class extends import_storage_memory.LocalStorage {
  constructor(root, sanitise = true, clock = import_shared.defaultClock) {
    super(clock);
    this.sanitise = sanitise;
    this.root = import_path2.default.resolve(root);
  }
  root;
  sqliteDB;
  keyPath(key) {
    const sanitisedKey = this.sanitise ? (0, import_shared.sanitisePath)(key) : key;
    const filePath = import_path2.default.join(this.root, sanitisedKey);
    return [
      filePath.startsWith(this.root) ? filePath : void 0,
      sanitisedKey !== key
    ];
  }
  async meta(keyFilePath) {
    const metaString = await readFile(keyFilePath + metaSuffix, true);
    return metaString ? JSON.parse(metaString) : { expiration: void 0, metadata: void 0 };
  }
  async hasMaybeExpired(key) {
    const [filePath] = this.keyPath(key);
    if (!filePath)
      return;
    if (!(0, import_fs.existsSync)(filePath))
      return;
    const meta = await this.meta(filePath);
    return { expiration: meta.expiration, metadata: meta.metadata };
  }
  async headMaybeExpired(key) {
    const [filePath] = this.keyPath(key);
    if (!filePath)
      return;
    if (!(0, import_fs.existsSync)(filePath))
      return;
    return await this.meta(filePath);
  }
  async getMaybeExpired(key) {
    const [filePath] = this.keyPath(key);
    if (!filePath)
      return;
    try {
      const value = await readFile(filePath);
      if (value === void 0)
        return;
      const meta = await this.meta(filePath);
      return {
        value: (0, import_shared.viewToArray)(value),
        expiration: meta.expiration,
        metadata: meta.metadata
      };
    } catch (e) {
      if (e.code === "ENOTDIR")
        return;
      throw e;
    }
  }
  async getSqliteDatabase() {
    if (this.sqliteDB)
      return this.sqliteDB;
    import_fs.default.mkdirSync(import_path2.default.dirname(this.root), { recursive: true });
    this.sqliteDB = await (0, import_shared.createSQLiteDB)(this.root + ".sqlite3");
    return this.sqliteDB;
  }
  async getRangeMaybeExpired(key, { offset: _offset, length: _length, suffix }) {
    const [filePath] = this.keyPath(key);
    if (!filePath)
      return;
    try {
      const res = await readFileRange(filePath, _offset, _length, suffix);
      if (res === void 0)
        return;
      const { value, offset, length } = res;
      const meta = await this.meta(filePath);
      return {
        value: (0, import_shared.viewToArray)(value),
        expiration: meta.expiration,
        metadata: meta.metadata,
        range: { offset, length }
      };
    } catch (e) {
      if (e.code === "ENOTDIR")
        return;
      throw e;
    }
  }
  async put(key, { value, expiration, metadata }) {
    const [filePath, sanitised] = this.keyPath(key);
    if (!filePath) {
      throw new FileStorageError("ERR_TRAVERSAL", "Cannot store values outside of storage root directory");
    }
    try {
      await writeFile(filePath, value);
    } catch (e) {
      if (e.code !== "EEXIST")
        throw e;
      throw new FileStorageError("ERR_NAMESPACE_KEY_CHILD", 'Cannot put key "' + key + `" as a parent namespace is also a key.
This is a limitation of Miniflare's file-system storage. Please use in-memory/Redis storage instead, or change your key layout.`, e);
    }
    const metaFilePath = filePath + metaSuffix;
    if (expiration !== void 0 || metadata !== void 0 || sanitised) {
      await writeFile(metaFilePath, JSON.stringify({ key, expiration, metadata }));
    } else {
      await deleteFile(metaFilePath);
    }
  }
  async deleteMaybeExpired(key) {
    const [filePath] = this.keyPath(key);
    if (!filePath)
      return false;
    try {
      const existed = await deleteFile(filePath);
      await deleteFile(filePath + metaSuffix);
      return existed;
    } catch (e) {
      if (e.code === "ENOTDIR")
        return false;
      throw e;
    }
  }
  async listAllMaybeExpired() {
    const keys = [];
    for await (const filePath of walk(this.root)) {
      if (filePath.endsWith(metaSuffix))
        continue;
      const name = filePath.substring(this.root.length + 1);
      const meta = await this.meta(filePath);
      const realName = meta?.key ?? (this.sanitise ? name : name.split(import_path2.default.sep).join(import_path2.default.posix.sep));
      keys.push({
        name: realName,
        expiration: meta.expiration,
        metadata: meta.metadata
      });
    }
    return keys;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FileStorage,
  FileStorageError
});
//# sourceMappingURL=index.js.map
