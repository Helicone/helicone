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

// packages/runner-vm/src/index.ts
__export(exports, {
  VMScriptRunner: () => VMScriptRunner,
  VMScriptRunnerError: () => VMScriptRunnerError,
  defineHasInstances: () => defineHasInstances
});
var import_vm3 = __toModule(require("vm"));

// packages/runner-vm/src/error.ts
var import_shared = __toModule(require("@miniflare/shared"));
var VMScriptRunnerError = class extends import_shared.MiniflareError {
};

// packages/runner-vm/src/instanceof.ts
var import_vm = __toModule(require("vm"));
function ordinaryHasInstance(C, O) {
  if (typeof C !== "function")
    return false;
  if (typeof O !== "object" && typeof O !== "function")
    return false;
  if (O === null)
    return false;
  const P = C.prototype;
  if (typeof P !== "object" && typeof P !== "function") {
    throw new TypeError(`Function has non-object prototype '${P}' in instanceof check`);
  }
  while ((O = Object.getPrototypeOf(O)) !== null) {
    if (P === O)
      return true;
  }
  return false;
}
function instanceOf(V, insideTarget, outsideTarget) {
  return ordinaryHasInstance(insideTarget, V) || ordinaryHasInstance(outsideTarget, V);
}
var outsideTargets = {
  Object,
  Function,
  Array,
  Promise,
  RegExp,
  Error,
  EvalError,
  RangeError,
  ReferenceError,
  SyntaxError,
  TypeError,
  URIError
};
function defineHasInstance(insideTarget) {
  Object.defineProperty(insideTarget, Symbol.hasInstance, {
    value(value) {
      const outsideTarget = outsideTargets[this.name];
      return instanceOf(value, this, outsideTarget);
    }
  });
}
var defineHasInstancesScript = new import_vm.default.Script(`(function(defineHasInstance) {
  // Only define properties once, would throw if we tried doing this twice
  if (Object.hasOwnProperty(Symbol.hasInstance)) return;
  defineHasInstance(Object);
  defineHasInstance(Function);
  defineHasInstance(Array);
  defineHasInstance(Promise);
  defineHasInstance(RegExp);
  defineHasInstance(Error);
})`, { filename: "<defineHasInstancesScript>" });
function defineHasInstances(ctx) {
  defineHasInstancesScript.runInContext(ctx)(defineHasInstance);
}

// packages/runner-vm/src/linker.ts
var import_fs = __toModule(require("fs"));
var import_promises = __toModule(require("fs/promises"));
var import_module = __toModule(require("module"));
var import_path = __toModule(require("path"));
var import_vm2 = __toModule(require("vm"));
var import_shared2 = __toModule(require("@miniflare/shared"));
var SUGGEST_BUNDLE = "If you're trying to import an npm package, you'll need to bundle your Worker first.";
var SUGGEST_NODE = "If you're trying to import a Node.js built-in module, or an npm package that uses Node.js built-ins, you'll either need to:\n- Bundle your Worker, configuring your bundler to polyfill Node.js built-ins\n- Configure your bundler to load Workers-compatible builds by changing the main fields/conditions\n- Find an alternative package that doesn't require Node.js built-ins";
var ModuleLinker = class {
  constructor(moduleRules, additionalModules) {
    this.moduleRules = moduleRules;
    this.additionalModules = additionalModules;
    this.linker = this.linker.bind(this);
  }
  #referencedPathSizes = new Map();
  #moduleCache = new Map();
  #cjsModuleCache = new Map();
  get referencedPaths() {
    return this.#referencedPathSizes.keys();
  }
  get referencedPathsTotalSize() {
    const sizes = Array.from(this.#referencedPathSizes.values());
    return sizes.reduce((total, size) => total + size, 0);
  }
  async linker(spec, referencing) {
    const relative = import_path.default.relative("", referencing.identifier);
    const errorBase = `Unable to resolve "${relative}" dependency "${spec}"`;
    if (referencing.identifier === import_shared2.STRING_SCRIPT_PATH) {
      throw new VMScriptRunnerError("ERR_MODULE_STRING_SCRIPT", `${errorBase}: imports unsupported with string script`);
    }
    const additionalModule = this.additionalModules[spec];
    const identifier = additionalModule ? spec : import_path.default.resolve(import_path.default.dirname(referencing.identifier), spec);
    const cached = this.#moduleCache.get(identifier);
    if (cached)
      return cached;
    const moduleOptions = { identifier, context: referencing.context };
    let module2;
    if (additionalModule) {
      module2 = new import_vm2.default.SyntheticModule(Object.keys(additionalModule), function() {
        for (const [key, value] of Object.entries(additionalModule)) {
          this.setExport(key, value);
        }
      }, moduleOptions);
      this.#moduleCache.set(identifier, module2);
      return module2;
    }
    const rule = this.moduleRules.find((rule2) => rule2.include.test(identifier));
    if (rule === void 0) {
      const isBuiltin = import_module.builtinModules.includes(spec);
      const suggestion = isBuiltin ? SUGGEST_NODE : SUGGEST_BUNDLE;
      throw new VMScriptRunnerError("ERR_MODULE_RULE", `${errorBase}: no matching module rules.
${suggestion}`);
    }
    const data = await import_promises.default.readFile(identifier);
    this.#referencedPathSizes.set(identifier, data.byteLength);
    switch (rule.type) {
      case "ESModule":
        module2 = new import_vm2.default.SourceTextModule(data.toString("utf8"), moduleOptions);
        break;
      case "CommonJS":
        const exports = this.loadCommonJSModule(errorBase, identifier, spec, referencing.context);
        module2 = new import_vm2.default.SyntheticModule(["default"], function() {
          this.setExport("default", exports);
        }, moduleOptions);
        break;
      case "Text":
        module2 = new import_vm2.default.SyntheticModule(["default"], function() {
          this.setExport("default", data.toString("utf8"));
        }, moduleOptions);
        break;
      case "Data":
        module2 = new import_vm2.default.SyntheticModule(["default"], function() {
          this.setExport("default", (0, import_shared2.viewToBuffer)(data));
        }, moduleOptions);
        break;
      case "CompiledWasm":
        module2 = new import_vm2.default.SyntheticModule(["default"], function() {
          this.setExport("default", new WebAssembly.Module(data));
        }, moduleOptions);
        break;
      default:
        throw new VMScriptRunnerError("ERR_MODULE_UNSUPPORTED", `${errorBase}: ${rule.type} modules are unsupported`);
    }
    this.#moduleCache.set(identifier, module2);
    return module2;
  }
  loadCommonJSModule(errorBase, identifier, spec, context) {
    const cached = this.#cjsModuleCache.get(identifier);
    if (cached)
      return cached.exports;
    const additionalModule = this.additionalModules[spec];
    const module2 = { exports: {} };
    if (additionalModule) {
      module2.exports.default = additionalModule.default;
      this.#cjsModuleCache.set(identifier, module2);
      return module2.exports;
    }
    const rule = this.moduleRules.find((rule2) => rule2.include.test(identifier));
    if (rule === void 0) {
      const isBuiltin = import_module.builtinModules.includes(spec);
      const suggestion = isBuiltin ? SUGGEST_NODE : SUGGEST_BUNDLE;
      throw new VMScriptRunnerError("ERR_MODULE_RULE", `${errorBase}: no matching module rules.
${suggestion}`);
    }
    this.#cjsModuleCache.set(identifier, module2);
    const data = (0, import_fs.readFileSync)(identifier);
    this.#referencedPathSizes.set(identifier, data.byteLength);
    switch (rule.type) {
      case "ESModule":
        throw new VMScriptRunnerError("ERR_CJS_MODULE_UNSUPPORTED", `${errorBase}: CommonJS modules cannot require ES modules`);
      case "CommonJS":
        const code = data.toString("utf8");
        const wrapped = `(function(exports, require, module) {
${code}
});`;
        const script = new import_vm2.default.Script(wrapped, {
          filename: identifier,
          lineOffset: -1
        });
        const moduleWrapper = script.runInContext(context);
        const require2 = this.createRequire(identifier, context);
        moduleWrapper(module2.exports, require2, module2);
        break;
      case "Text":
        module2.exports.default = data.toString("utf8");
        break;
      case "Data":
        module2.exports.default = (0, import_shared2.viewToBuffer)(data);
        break;
      case "CompiledWasm":
        module2.exports.default = new WebAssembly.Module(data);
        break;
      default:
        throw new VMScriptRunnerError("ERR_MODULE_UNSUPPORTED", `${errorBase}: ${rule.type} modules are unsupported`);
    }
    return module2.exports;
  }
  createRequire(referencingIdentifier, context) {
    const relative = import_path.default.relative("", referencingIdentifier);
    const referencingDirname = import_path.default.dirname(referencingIdentifier);
    return (spec) => {
      const errorBase = `Unable to resolve "${relative}" dependency "${spec}"`;
      const identifier = import_path.default.resolve(referencingDirname, spec);
      return this.loadCommonJSModule(errorBase, identifier, spec, context);
    };
  }
};

// packages/runner-vm/src/index.ts
var VMScriptRunner = class {
  constructor(context) {
    this.context = context;
  }
  runAsScript(context, blueprint) {
    const script = new import_vm3.default.Script(blueprint.code, {
      filename: blueprint.filePath
    });
    script.runInContext(context);
  }
  async runAsModule(context, blueprint, linker) {
    const module2 = new import_vm3.default.SourceTextModule(blueprint.code, {
      identifier: blueprint.filePath,
      context
    });
    await module2.link(linker);
    await module2.evaluate();
    return module2.namespace;
  }
  async run(globalScope, blueprint, modulesRules, additionalModules) {
    if (modulesRules && !("SourceTextModule" in import_vm3.default)) {
      throw new VMScriptRunnerError("ERR_MODULE_DISABLED", "Modules support requires the --experimental-vm-modules flag");
    }
    const linker = modulesRules && new ModuleLinker(modulesRules, additionalModules ?? {});
    let context = this.context;
    if (context) {
      Object.assign(context, globalScope);
    } else {
      context = import_vm3.default.createContext(globalScope, {
        codeGeneration: { strings: false, wasm: false }
      });
    }
    defineHasInstances(context);
    let exports = {};
    let bundleSize = 0;
    bundleSize += Buffer.byteLength(blueprint.code);
    if (linker) {
      exports = await this.runAsModule(context, blueprint, linker.linker);
    } else {
      this.runAsScript(context, blueprint);
    }
    if (linker)
      bundleSize += linker.referencedPathsTotalSize;
    const watch = linker && [...linker.referencedPaths];
    return { exports, bundleSize, watch };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VMScriptRunner,
  VMScriptRunnerError,
  defineHasInstances
});
//# sourceMappingURL=index.js.map
