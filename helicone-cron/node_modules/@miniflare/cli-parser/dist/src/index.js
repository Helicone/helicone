var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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

// node_modules/mri/lib/index.js
var require_lib = __commonJS({
  "node_modules/mri/lib/index.js"(exports, module2) {
    function toArr(any) {
      return any == null ? [] : Array.isArray(any) ? any : [any];
    }
    function toVal(out, key, val, opts) {
      var x, old = out[key], nxt = !!~opts.string.indexOf(key) ? val == null || val === true ? "" : String(val) : typeof val === "boolean" ? val : !!~opts.boolean.indexOf(key) ? val === "false" ? false : val === "true" || (out._.push((x = +val, x * 0 === 0) ? x : val), !!val) : (x = +val, x * 0 === 0) ? x : val;
      out[key] = old == null ? nxt : Array.isArray(old) ? old.concat(nxt) : [old, nxt];
    }
    module2.exports = function(args, opts) {
      args = args || [];
      opts = opts || {};
      var k, arr, arg, name, val, out = { _: [] };
      var i = 0, j = 0, idx = 0, len = args.length;
      const alibi = opts.alias !== void 0;
      const strict = opts.unknown !== void 0;
      const defaults = opts.default !== void 0;
      opts.alias = opts.alias || {};
      opts.string = toArr(opts.string);
      opts.boolean = toArr(opts.boolean);
      if (alibi) {
        for (k in opts.alias) {
          arr = opts.alias[k] = toArr(opts.alias[k]);
          for (i = 0; i < arr.length; i++) {
            (opts.alias[arr[i]] = arr.concat(k)).splice(i, 1);
          }
        }
      }
      for (i = opts.boolean.length; i-- > 0; ) {
        arr = opts.alias[opts.boolean[i]] || [];
        for (j = arr.length; j-- > 0; )
          opts.boolean.push(arr[j]);
      }
      for (i = opts.string.length; i-- > 0; ) {
        arr = opts.alias[opts.string[i]] || [];
        for (j = arr.length; j-- > 0; )
          opts.string.push(arr[j]);
      }
      if (defaults) {
        for (k in opts.default) {
          name = typeof opts.default[k];
          arr = opts.alias[k] = opts.alias[k] || [];
          if (opts[name] !== void 0) {
            opts[name].push(k);
            for (i = 0; i < arr.length; i++) {
              opts[name].push(arr[i]);
            }
          }
        }
      }
      const keys = strict ? Object.keys(opts.alias) : [];
      for (i = 0; i < len; i++) {
        arg = args[i];
        if (arg === "--") {
          out._ = out._.concat(args.slice(++i));
          break;
        }
        for (j = 0; j < arg.length; j++) {
          if (arg.charCodeAt(j) !== 45)
            break;
        }
        if (j === 0) {
          out._.push(arg);
        } else if (arg.substring(j, j + 3) === "no-") {
          name = arg.substring(j + 3);
          if (strict && !~keys.indexOf(name)) {
            return opts.unknown(arg);
          }
          out[name] = false;
        } else {
          for (idx = j + 1; idx < arg.length; idx++) {
            if (arg.charCodeAt(idx) === 61)
              break;
          }
          name = arg.substring(j, idx);
          val = arg.substring(++idx) || (i + 1 === len || ("" + args[i + 1]).charCodeAt(0) === 45 || args[++i]);
          arr = j === 2 ? [name] : name;
          for (idx = 0; idx < arr.length; idx++) {
            name = arr[idx];
            if (strict && !~keys.indexOf(name))
              return opts.unknown("-".repeat(j) + name);
            toVal(out, name, idx + 1 < arr.length || val, opts);
          }
        }
      }
      if (defaults) {
        for (k in opts.default) {
          if (out[k] === void 0) {
            out[k] = opts.default[k];
          }
        }
      }
      if (alibi) {
        for (k in out) {
          arr = opts.alias[k] || [];
          while (arr.length > 0) {
            out[arr.shift()] = out[k];
          }
        }
      }
      return out;
    };
  }
});

// packages/cli-parser/src/index.ts
__export(exports, {
  ParseError: () => ParseError,
  _wrapLines: () => _wrapLines,
  buildHelp: () => buildHelp,
  parseArgv: () => parseArgv
});

// packages/cli-parser/src/help.ts
var import_shared2 = __toModule(require("@miniflare/shared"));
var import_colors = __toModule(require("kleur/colors"));

// packages/cli-parser/src/helpers.ts
var import_shared = __toModule(require("@miniflare/shared"));
function argName(key, { name, type }) {
  name ??= (0, import_shared.kebabCase)(key);
  if ((type === import_shared.OptionType.ARRAY || type === import_shared.OptionType.OBJECT) && name.endsWith("s")) {
    name = name.substring(0, name.length - 1);
  }
  return name;
}

// packages/cli-parser/src/help.ts
var helpMeta = {
  type: import_shared2.OptionType.BOOLEAN,
  alias: "h",
  description: "Show help"
};
var versionMeta = {
  type: import_shared2.OptionType.BOOLEAN,
  alias: "v",
  description: "Show version number"
};
function _wrapLines(text, length) {
  const lines = [text];
  let lastLine;
  while ((lastLine = lines[lines.length - 1]).length > length) {
    const spaceIndex = lastLine.lastIndexOf(" ", length);
    if (spaceIndex === -1)
      break;
    lines[lines.length - 1] = lastLine.substring(0, spaceIndex);
    lines.push(lastLine.substring(spaceIndex + 1));
  }
  return lines;
}
function buildHelp(plugins, exec, columns = process.stdout.columns) {
  let positionalName = "";
  let maxNameLength = 0;
  let maxDescriptionLength = 0;
  let maxTypeLength = 0;
  const sections = [];
  for (const [pluginName, plugin] of Object.entries(plugins)) {
    if (plugin.prototype.opts === void 0)
      continue;
    const pluginLines = [];
    const sectionName = (0, import_shared2.spaceCase)(pluginName.replace("Plugin", "Options"));
    const entries = [...plugin.prototype.opts.entries()];
    if (sectionName === "Core Options") {
      entries.unshift(["help", helpMeta], ["version", versionMeta]);
    }
    for (const [key, meta] of entries) {
      const { type, typeFormat, alias, description = "", negatable } = meta;
      if (type === import_shared2.OptionType.NONE || typeof key === "symbol")
        continue;
      let name = argName(key, meta);
      if (negatable)
        name = `(no-)${name}`;
      if (type === import_shared2.OptionType.STRING_POSITIONAL) {
        positionalName = name;
        continue;
      }
      let typeName = import_shared2.OptionType[type].toLowerCase();
      if (type === import_shared2.OptionType.BOOLEAN_STRING)
        typeName = "boolean/string";
      else if (type === import_shared2.OptionType.BOOLEAN_NUMBER)
        typeName = "boolean/number";
      else if (type === import_shared2.OptionType.OBJECT) {
        typeName = `array:${typeFormat ?? "KEY=VALUE"}`;
      }
      if (name.length > maxNameLength) {
        maxNameLength = name.length;
      }
      if (description.length > maxDescriptionLength) {
        maxDescriptionLength = description.length;
      }
      if (typeName.length > maxTypeLength) {
        maxTypeLength = typeName.length;
      }
      pluginLines.push({ alias, name, description, typeName });
    }
    sections.push([sectionName, pluginLines]);
  }
  const leftPaddingLength = maxNameLength + 8;
  const leftPadding = "".padEnd(leftPaddingLength, " ");
  columns = Math.min(leftPaddingLength + maxDescriptionLength + maxTypeLength + 3, columns);
  let out = `${(0, import_colors.bold)("Usage:")} ${exec} [${positionalName}] [options]
`;
  for (const [sectionName, pluginLines] of sections) {
    if (pluginLines.length > 0)
      out += `
${(0, import_colors.bold)(sectionName + ":")}
`;
    for (const { alias, name, description, typeName } of pluginLines) {
      out += (0, import_colors.grey)(alias ? ` -${alias}, ` : "     ");
      out += `--${name}`.padEnd(maxNameLength + 3, " ");
      const lineLength = columns - (leftPaddingLength + typeName.length + 3);
      const lines = _wrapLines(description, lineLength);
      out += lines[0].padEnd(lineLength, " ");
      out += (0, import_colors.grey)(` [${typeName}]`);
      for (let i = 1; i < lines.length; i++) {
        out += `
${leftPadding}${lines[i]}`;
      }
      out += "\n";
    }
  }
  return out.trimEnd();
}

// packages/cli-parser/src/parse.ts
var import_fs = __toModule(require("fs"));
var import_path = __toModule(require("path"));
var import_shared3 = __toModule(require("@miniflare/shared"));
var import_mri = __toModule(require_lib());
var ParseError = class extends import_shared3.MiniflareError {
};
function parseArgv(plugins, argv) {
  let positionalName = "";
  const booleans = ["help", "version"];
  const strings = [];
  const aliases = {
    help: "h",
    version: "v"
  };
  const args = [];
  for (const plugin of Object.values(plugins)) {
    if (plugin.prototype.opts === void 0)
      continue;
    for (const [key, meta] of plugin.prototype.opts.entries()) {
      const type = meta.type;
      if (type === import_shared3.OptionType.NONE || typeof key === "symbol")
        continue;
      const name = argName(key, meta);
      args.push({ name, key, meta });
      if (type === import_shared3.OptionType.STRING_POSITIONAL) {
        positionalName = name;
        continue;
      }
      if (type === import_shared3.OptionType.BOOLEAN) {
        booleans.push(name);
      }
      if (type === import_shared3.OptionType.STRING || type === import_shared3.OptionType.ARRAY || type === import_shared3.OptionType.OBJECT) {
        strings.push(name);
      }
      aliases[name] = meta.alias ?? [];
    }
  }
  const parsed = (0, import_mri.default)(argv, {
    boolean: booleans,
    string: strings,
    alias: aliases,
    unknown(flag) {
      throw new ParseError("ERR_OPTION", `Unexpected option: ${flag}`);
    }
  });
  if (parsed.help)
    throw new ParseError("ERR_HELP");
  if (parsed.version) {
    const pkgPath = import_path.default.join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse((0, import_fs.readFileSync)(pkgPath, "utf8"));
    throw new ParseError("ERR_VERSION", pkg.version);
  }
  function unexpected(name, value, expectedType) {
    if (name !== positionalName)
      name = `--${name}`;
    const message = `Unexpected value for ${name}: ` + JSON.stringify(value) + ` (expected ${expectedType})`;
    throw new ParseError("ERR_VALUE", message);
  }
  const result = {};
  for (const { name, key, meta } of args) {
    const { type, typeFormat, fromEntries } = meta;
    let value = parsed[name];
    if (type === import_shared3.OptionType.STRING_POSITIONAL) {
      if (parsed._.length === 1)
        value = parsed._[0];
      else if (parsed._.length > 1)
        value = parsed._;
    }
    if (value === void 0)
      continue;
    let parsedValue = value;
    if (type === import_shared3.OptionType.BOOLEAN) {
      if (typeof value !== "boolean")
        unexpected(name, value, "boolean");
    } else if (type === import_shared3.OptionType.NUMBER) {
      if (typeof value !== "number")
        unexpected(name, value, "number");
    } else if (type === import_shared3.OptionType.STRING || type === import_shared3.OptionType.STRING_POSITIONAL) {
      if (typeof value !== "string")
        unexpected(name, value, "string");
    } else if (type === import_shared3.OptionType.BOOLEAN_STRING) {
      if (Array.isArray(value))
        unexpected(name, value, "boolean/string");
      if (typeof value === "number")
        parsedValue = value.toString();
    } else if (type === import_shared3.OptionType.BOOLEAN_NUMBER) {
      if (typeof value !== "boolean" && typeof value !== "number") {
        unexpected(name, value, "boolean/number");
      }
    } else if (type === import_shared3.OptionType.ARRAY || type === import_shared3.OptionType.OBJECT) {
      if (!Array.isArray(value))
        value = [value];
      const array = value.map((element) => element.toString());
      if (type === import_shared3.OptionType.OBJECT) {
        parsedValue = array.map((element) => {
          const equals = element.indexOf("=");
          if (equals === -1) {
            unexpected(name, element, typeFormat ?? "KEY=VALUE");
          }
          return [element.substring(0, equals), element.substring(equals + 1)];
        });
        parsedValue = (fromEntries ?? Object.fromEntries)(parsedValue);
      } else {
        parsedValue = array;
      }
    }
    result[key] = parsedValue;
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParseError,
  _wrapLines,
  buildHelp,
  parseArgv
});
//# sourceMappingURL=index.js.map
