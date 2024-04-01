var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
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

// packages/core/src/plugins/rust.ts
var import_assert = __toModule(require("assert"));
var import_promises = __toModule(require("fs/promises"));
var import_path = __toModule(require("path"));
(async () => {
  const pkg = JSON.parse(await import_promises.default.readFile(import_path.default.join("pkg", "package.json"), "utf8"));
  const glueName = pkg.files.find((file) => file.endsWith(".js"));
  (0, import_assert.default)(glueName);
  const glueCode = await import_promises.default.readFile(import_path.default.join("pkg", glueName), "utf8");
  const code = await import_promises.default.readFile(import_path.default.join("worker", "worker.js"), "utf8");
  const generatedDir = import_path.default.join("worker", "generated");
  await import_promises.default.mkdir(generatedDir, { recursive: true });
  await import_promises.default.writeFile(import_path.default.join(generatedDir, "script.js"), `${glueCode} ${code}`, "utf8");
  const wasmName = pkg.files.find((file) => file.endsWith(".wasm"));
  (0, import_assert.default)(wasmName);
  await import_promises.default.copyFile(import_path.default.join("pkg", wasmName), import_path.default.join(generatedDir, "script.wasm"));
})();
//# sourceMappingURL=rust.js.map
