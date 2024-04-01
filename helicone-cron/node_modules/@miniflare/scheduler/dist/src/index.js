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

// packages/scheduler/src/index.ts
__export(exports, {
  CronScheduler: () => CronScheduler,
  SchedulerError: () => SchedulerError,
  SchedulerPlugin: () => SchedulerPlugin,
  startScheduler: () => startScheduler
});
var import_core = __toModule(require("@miniflare/core"));

// packages/scheduler/src/plugin.ts
var import_shared = __toModule(require("@miniflare/shared"));
var SchedulerError = class extends import_shared.MiniflareError {
};
var SchedulerPlugin = class extends import_shared.Plugin {
  crons;
  #validatedCrons = [];
  constructor(ctx, options) {
    super(ctx);
    this.assignOptions(options);
  }
  get validatedCrons() {
    return this.#validatedCrons;
  }
  async setup() {
    if (!this.crons?.length) {
      this.#validatedCrons = [];
      return;
    }
    const {
      parseCronExpression
    } = require("cron-schedule");
    const validatedCrons = Array(this.crons.length);
    for (let i = 0; i < this.crons.length; i++) {
      const spec = this.crons[i];
      try {
        const cron = parseCronExpression(spec);
        cron.toString = () => spec;
        validatedCrons[i] = cron;
      } catch (e) {
        throw new SchedulerError("ERR_INVALID_CRON", `Unable to parse CRON "${spec}": ${e.message}`);
      }
    }
    this.#validatedCrons = validatedCrons;
  }
};
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.ARRAY,
    alias: "t",
    description: "CRON expression for triggering scheduled events",
    logName: "CRON Expressions",
    fromWrangler: ({ triggers }) => triggers?.crons
  })
], SchedulerPlugin.prototype, "crons", 2);

// packages/scheduler/src/index.ts
var kReload = Symbol("kReload");
var CronScheduler = class {
  constructor(mf, cronScheduler = Promise.resolve().then(() => require("cron-schedule").TimerBasedCronScheduler)) {
    this.mf = mf;
    this.cronScheduler = cronScheduler;
    mf.addEventListener("reload", this[kReload]);
  }
  previousValidatedCrons;
  scheduledHandles;
  inaccurateCpu;
  [kReload] = async (event) => {
    const validatedCrons = event.plugins.SchedulerPlugin.validatedCrons;
    this.inaccurateCpu = event.plugins.CorePlugin.inaccurateCpu;
    if (this.previousValidatedCrons === validatedCrons)
      return;
    this.previousValidatedCrons = validatedCrons;
    const cronScheduler = await this.cronScheduler;
    this.scheduledHandles?.forEach((handle) => cronScheduler.clearTimeoutOrInterval(handle));
    if (!validatedCrons.length)
      return;
    this.scheduledHandles = validatedCrons?.map((cron) => {
      const spec = cron.toString();
      return cronScheduler.setInterval(cron, async () => {
        const start = process.hrtime();
        const startCpu = this.inaccurateCpu ? process.cpuUsage() : void 0;
        const waitUntil = this.mf.dispatchScheduled(void 0, spec);
        await (0, import_core.logResponse)(this.mf.log, {
          start,
          startCpu,
          method: "SCHD",
          url: spec,
          waitUntil
        });
      });
    });
  };
  async dispose() {
    this.mf.removeEventListener("reload", this[kReload]);
    const cronScheduler = await this.cronScheduler;
    this.scheduledHandles?.forEach((handle) => cronScheduler.clearTimeoutOrInterval(handle));
  }
};
async function startScheduler(mf, cronScheduler) {
  const scheduler = new CronScheduler(mf, cronScheduler);
  const reloadEvent = new import_core.ReloadEvent("reload", {
    plugins: await mf.getPlugins(),
    initial: false
  });
  await scheduler[kReload](reloadEvent);
  return scheduler;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CronScheduler,
  SchedulerError,
  SchedulerPlugin,
  startScheduler
});
//# sourceMappingURL=index.js.map
