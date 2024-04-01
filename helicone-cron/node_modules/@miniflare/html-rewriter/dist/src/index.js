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

// packages/html-rewriter/src/index.ts
__export(exports, {
  HTMLRewriter: () => HTMLRewriter,
  HTMLRewriterPlugin: () => HTMLRewriterPlugin,
  withEnableEsiTags: () => withEnableEsiTags
});

// packages/html-rewriter/src/plugin.ts
var import_shared = __toModule(require("@miniflare/shared"));

// packages/html-rewriter/src/rewriter.ts
var import_web = __toModule(require("stream/web"));
var import_core = __toModule(require("@miniflare/core"));
var import_undici = __toModule(require("undici"));
var kEnableEsiTags = Symbol("kEnableEsiTags");
var HTMLRewriter = class {
  #elementHandlers = [];
  #documentHandlers = [];
  [kEnableEsiTags] = false;
  on(selector, handlers) {
    this.#elementHandlers.push([selector, handlers]);
    return this;
  }
  onDocument(handlers) {
    this.#documentHandlers.push(handlers);
    return this;
  }
  transform(response) {
    const body = response.body;
    if (body === null)
      return new import_core.Response(body, response);
    if (response instanceof import_undici.Response) {
      response = new import_core.Response(response.body, response);
    }
    let rewriter;
    const transformStream = new import_web.TransformStream({
      start: async (controller) => {
        const {
          HTMLRewriter: BaseHTMLRewriter
        } = require("html-rewriter-wasm");
        rewriter = new BaseHTMLRewriter((output) => {
          if (output.length !== 0)
            controller.enqueue(output);
        }, { enableEsiTags: this[kEnableEsiTags] });
        for (const [selector, handlers] of this.#elementHandlers) {
          rewriter.on(selector, handlers);
        }
        for (const handlers of this.#documentHandlers) {
          rewriter.onDocument(handlers);
        }
      },
      transform: (chunk) => rewriter.write(chunk),
      flush: () => rewriter.end()
    });
    const promise = body.pipeTo(transformStream.writable);
    promise.catch(() => {
    }).finally(() => rewriter.free());
    const res = new import_core.Response(transformStream.readable, response);
    res.headers.delete("Content-Length");
    return res;
  }
};
function withEnableEsiTags(rewriter) {
  rewriter[kEnableEsiTags] = true;
  return rewriter;
}

// packages/html-rewriter/src/plugin.ts
var ESIHTMLRewriter = new Proxy(HTMLRewriter, {
  construct(target, args, newTarget) {
    const value = Reflect.construct(target, args, newTarget);
    return withEnableEsiTags(value);
  }
});
var HTMLRewriterPlugin = class extends import_shared.Plugin {
  constructor(ctx) {
    super(ctx);
  }
  setup() {
    const enableEsiFlags = this.ctx.compat.isEnabled("html_rewriter_treats_esi_include_as_void_tag");
    const impl = enableEsiFlags ? ESIHTMLRewriter : HTMLRewriter;
    return { globals: { HTMLRewriter: impl } };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HTMLRewriter,
  HTMLRewriterPlugin,
  withEnableEsiTags
});
//# sourceMappingURL=index.js.map
