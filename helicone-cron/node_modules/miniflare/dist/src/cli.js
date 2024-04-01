#!/usr/bin/env node
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

// node_modules/is-docker/index.js
var require_is_docker = __commonJS({
  "node_modules/is-docker/index.js"(exports2, module2) {
    "use strict";
    var fs3 = require("fs");
    var isDocker;
    function hasDockerEnv() {
      try {
        fs3.statSync("/.dockerenv");
        return true;
      } catch (_) {
        return false;
      }
    }
    function hasDockerCGroup() {
      try {
        return fs3.readFileSync("/proc/self/cgroup", "utf8").includes("docker");
      } catch (_) {
        return false;
      }
    }
    module2.exports = () => {
      if (isDocker === void 0) {
        isDocker = hasDockerEnv() || hasDockerCGroup();
      }
      return isDocker;
    };
  }
});

// node_modules/is-wsl/index.js
var require_is_wsl = __commonJS({
  "node_modules/is-wsl/index.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var fs3 = require("fs");
    var isDocker = require_is_docker();
    var isWsl = () => {
      if (process.platform !== "linux") {
        return false;
      }
      if (os.release().toLowerCase().includes("microsoft")) {
        if (isDocker()) {
          return false;
        }
        return true;
      }
      try {
        return fs3.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft") ? !isDocker() : false;
      } catch (_) {
        return false;
      }
    };
    if (process.env.__IS_WSL_TEST__) {
      module2.exports = isWsl;
    } else {
      module2.exports = isWsl();
    }
  }
});

// node_modules/define-lazy-prop/index.js
var require_define_lazy_prop = __commonJS({
  "node_modules/define-lazy-prop/index.js"(exports2, module2) {
    "use strict";
    module2.exports = (object, propertyName, fn) => {
      const define = (value) => Object.defineProperty(object, propertyName, { value, enumerable: true, writable: true });
      Object.defineProperty(object, propertyName, {
        configurable: true,
        enumerable: true,
        get() {
          const result = fn();
          define(result);
          return result;
        },
        set(value) {
          define(value);
        }
      });
      return object;
    };
  }
});

// node_modules/open/index.js
var require_open = __commonJS({
  "node_modules/open/index.js"(exports2, module2) {
    var path2 = require("path");
    var childProcess = require("child_process");
    var { promises: fs3, constants: fsConstants } = require("fs");
    var isWsl = require_is_wsl();
    var isDocker = require_is_docker();
    var defineLazyProperty = require_define_lazy_prop();
    var localXdgOpenPath = path2.join(__dirname, "xdg-open");
    var { platform, arch } = process;
    var getWslDrivesMountPoint = (() => {
      const defaultMountPoint = "/mnt/";
      let mountPoint;
      return async function() {
        if (mountPoint) {
          return mountPoint;
        }
        const configFilePath = "/etc/wsl.conf";
        let isConfigFileExists = false;
        try {
          await fs3.access(configFilePath, fsConstants.F_OK);
          isConfigFileExists = true;
        } catch {
        }
        if (!isConfigFileExists) {
          return defaultMountPoint;
        }
        const configContent = await fs3.readFile(configFilePath, { encoding: "utf8" });
        const configMountPoint = /(?<!#.*)root\s*=\s*(?<mountPoint>.*)/g.exec(configContent);
        if (!configMountPoint) {
          return defaultMountPoint;
        }
        mountPoint = configMountPoint.groups.mountPoint.trim();
        mountPoint = mountPoint.endsWith("/") ? mountPoint : `${mountPoint}/`;
        return mountPoint;
      };
    })();
    var pTryEach = async (array, mapper) => {
      let latestError;
      for (const item of array) {
        try {
          return await mapper(item);
        } catch (error) {
          latestError = error;
        }
      }
      throw latestError;
    };
    var baseOpen = async (options) => {
      options = {
        wait: false,
        background: false,
        newInstance: false,
        allowNonzeroExitCode: false,
        ...options
      };
      if (Array.isArray(options.app)) {
        return pTryEach(options.app, (singleApp) => baseOpen({
          ...options,
          app: singleApp
        }));
      }
      let { name: app, arguments: appArguments = [] } = options.app || {};
      appArguments = [...appArguments];
      if (Array.isArray(app)) {
        return pTryEach(app, (appName) => baseOpen({
          ...options,
          app: {
            name: appName,
            arguments: appArguments
          }
        }));
      }
      let command;
      const cliArguments = [];
      const childProcessOptions = {};
      if (platform === "darwin") {
        command = "open";
        if (options.wait) {
          cliArguments.push("--wait-apps");
        }
        if (options.background) {
          cliArguments.push("--background");
        }
        if (options.newInstance) {
          cliArguments.push("--new");
        }
        if (app) {
          cliArguments.push("-a", app);
        }
      } else if (platform === "win32" || isWsl && !isDocker()) {
        const mountPoint = await getWslDrivesMountPoint();
        command = isWsl ? `${mountPoint}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe` : `${process.env.SYSTEMROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell`;
        cliArguments.push("-NoProfile", "-NonInteractive", "\u2013ExecutionPolicy", "Bypass", "-EncodedCommand");
        if (!isWsl) {
          childProcessOptions.windowsVerbatimArguments = true;
        }
        const encodedArguments = ["Start"];
        if (options.wait) {
          encodedArguments.push("-Wait");
        }
        if (app) {
          encodedArguments.push(`"\`"${app}\`""`, "-ArgumentList");
          if (options.target) {
            appArguments.unshift(options.target);
          }
        } else if (options.target) {
          encodedArguments.push(`"${options.target}"`);
        }
        if (appArguments.length > 0) {
          appArguments = appArguments.map((arg) => `"\`"${arg}\`""`);
          encodedArguments.push(appArguments.join(","));
        }
        options.target = Buffer.from(encodedArguments.join(" "), "utf16le").toString("base64");
      } else {
        if (app) {
          command = app;
        } else {
          const isBundled = !__dirname || __dirname === "/";
          let exeLocalXdgOpen = false;
          try {
            await fs3.access(localXdgOpenPath, fsConstants.X_OK);
            exeLocalXdgOpen = true;
          } catch {
          }
          const useSystemXdgOpen = process.versions.electron || platform === "android" || isBundled || !exeLocalXdgOpen;
          command = useSystemXdgOpen ? "xdg-open" : localXdgOpenPath;
        }
        if (appArguments.length > 0) {
          cliArguments.push(...appArguments);
        }
        if (!options.wait) {
          childProcessOptions.stdio = "ignore";
          childProcessOptions.detached = true;
        }
      }
      if (options.target) {
        cliArguments.push(options.target);
      }
      if (platform === "darwin" && appArguments.length > 0) {
        cliArguments.push("--args", ...appArguments);
      }
      const subprocess = childProcess.spawn(command, cliArguments, childProcessOptions);
      if (options.wait) {
        return new Promise((resolve, reject) => {
          subprocess.once("error", reject);
          subprocess.once("close", (exitCode) => {
            if (options.allowNonzeroExitCode && exitCode > 0) {
              reject(new Error(`Exited with code ${exitCode}`));
              return;
            }
            resolve(subprocess);
          });
        });
      }
      subprocess.unref();
      return subprocess;
    };
    var open2 = (target, options) => {
      if (typeof target !== "string") {
        throw new TypeError("Expected a `target`");
      }
      return baseOpen({
        ...options,
        target
      });
    };
    var openApp = (name, options) => {
      if (typeof name !== "string") {
        throw new TypeError("Expected a `name`");
      }
      const { arguments: appArguments = [] } = options || {};
      if (appArguments !== void 0 && appArguments !== null && !Array.isArray(appArguments)) {
        throw new TypeError("Expected `appArguments` as Array type");
      }
      return baseOpen({
        ...options,
        app: {
          name,
          arguments: appArguments
        }
      });
    };
    function detectArchBinary(binary) {
      if (typeof binary === "string" || Array.isArray(binary)) {
        return binary;
      }
      const { [arch]: archBinary } = binary;
      if (!archBinary) {
        throw new Error(`${arch} is not supported`);
      }
      return archBinary;
    }
    function detectPlatformBinary({ [platform]: platformBinary }, { wsl }) {
      if (wsl && isWsl) {
        return detectArchBinary(wsl);
      }
      if (!platformBinary) {
        throw new Error(`${platform} is not supported`);
      }
      return detectArchBinary(platformBinary);
    }
    var apps = {};
    defineLazyProperty(apps, "chrome", () => detectPlatformBinary({
      darwin: "google chrome",
      win32: "chrome",
      linux: ["google-chrome", "google-chrome-stable", "chromium"]
    }, {
      wsl: {
        ia32: "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",
        x64: ["/mnt/c/Program Files/Google/Chrome/Application/chrome.exe", "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"]
      }
    }));
    defineLazyProperty(apps, "firefox", () => detectPlatformBinary({
      darwin: "firefox",
      win32: "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
      linux: "firefox"
    }, {
      wsl: "/mnt/c/Program Files/Mozilla Firefox/firefox.exe"
    }));
    defineLazyProperty(apps, "edge", () => detectPlatformBinary({
      darwin: "microsoft edge",
      win32: "msedge",
      linux: ["microsoft-edge", "microsoft-edge-dev"]
    }, {
      wsl: "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
    }));
    open2.apps = apps;
    open2.openApp = openApp;
    module2.exports = open2;
  }
});

// packages/miniflare/src/cli.ts
var import_promises2 = __toModule(require("fs/promises"));
var import_path = __toModule(require("path"));
var import_colors = __toModule(require("kleur/colors"));
var import_open = __toModule(require_open());

// packages/miniflare/src/updater.ts
var import_promises = __toModule(require("fs/promises"));
var import_shared = __toModule(require("@miniflare/shared"));
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
    if ((0, import_shared.numericCompare)(registryMajor, pkgMajor) > 0) {
      log.warn(`${registryVersion} includes breaking changes.Make sure you check the changelog before upgrading.`);
    }
  }
}

// packages/miniflare/src/cli.ts
function suppressWarnings() {
  const originalEmitWarning = process.emitWarning;
  process.emitWarning = (warning, ctorTypeOptions, ctorCode, ctor) => {
    if (ctorTypeOptions === "ExperimentalWarning") {
      const warningString = warning.toString();
      if (warningString.startsWith("VM Modules") || warningString.startsWith("stream/web") || warningString.startsWith("buffer.Blob") || warningString.startsWith("The Ed25519")) {
        return;
      }
    }
    originalEmitWarning(warning, ctorTypeOptions, ctorCode, ctor);
  };
}
async function main() {
  const {
    ParseError,
    buildHelp,
    parseArgv
  } = require("@miniflare/cli-parser");
  const {
    Log: Log2,
    LogLevel
  } = require("@miniflare/shared");
  const {
    Miniflare,
    PLUGINS
  } = require("miniflare");
  let options;
  try {
    options = parseArgv(PLUGINS, process.argv.slice(2));
  } catch (e) {
    if (!(e instanceof ParseError))
      throw e;
    if (e.code === "ERR_VERSION") {
      console.error(e.message);
      return;
    }
    const execName = process.env.MINIFLARE_EXEC_NAME ?? "miniflare";
    console.error(buildHelp(PLUGINS, execName));
    if (e.code === "ERR_HELP")
      return;
    console.error(`
${(0, import_colors.red)(e.message)}`);
    process.exitCode = 1;
    return;
  }
  options.wranglerConfigPath ??= true;
  options.packagePath ??= true;
  options.envPathDefaultFallback = true;
  if (options.buildWatchPaths?.length || options.liveReload) {
    options.watch = true;
  }
  if (options.durableObjects && Object.keys(options.durableObjects).length) {
    options.modules = true;
  }
  const logLevel = options?.verbose ? LogLevel.VERBOSE : options?.debug ? LogLevel.DEBUG : LogLevel.INFO;
  const mfOptions = options;
  mfOptions.log = new Log2(logLevel);
  mfOptions.sourceMap = true;
  mfOptions.logUnhandledRejections = true;
  if (mfOptions.repl) {
    mfOptions.scriptRequired = false;
    mfOptions.watch = false;
    mfOptions.globalAsyncIO = true;
    mfOptions.globalTimers = true;
    mfOptions.globalRandom = true;
  }
  const mf = new Miniflare(mfOptions);
  try {
    if (mfOptions.repl) {
      await mf.startREPL();
    } else {
      await mf.startServer();
      await mf.startScheduler();
    }
  } catch (e) {
    mf.log.error(e);
    process.exitCode = 1;
    await mf.dispose();
    return;
  }
  const openURL = await mf.getOpenURL();
  try {
    if (openURL)
      await (0, import_open.default)(openURL);
  } catch (e) {
    mf.log.warn("Unable to open browser: " + e.stack);
  }
  const plugins = await mf.getPlugins();
  if (plugins.CorePlugin.updateCheck === false)
    return;
  try {
    const pkgFile = import_path.default.join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(await import_promises2.default.readFile(pkgFile, "utf8"));
    const cacheDir = import_path.default.resolve("node_modules", ".mf");
    await import_promises2.default.mkdir(cacheDir, { recursive: true });
    const lastCheckFile = import_path.default.join(cacheDir, "update-check");
    await updateCheck({ pkg, lastCheckFile, log: mf.log });
  } catch (e) {
    mf.log.debug("Unable to check for updates: " + e.stack);
  }
}
suppressWarnings();
void main();
//# sourceMappingURL=cli.js.map
