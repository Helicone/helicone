var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};

// packages/web-sockets/src/index.ts
__export(exports, {
  CloseEvent: () => CloseEvent,
  ErrorEvent: () => ErrorEvent,
  MessageEvent: () => MessageEvent,
  WebSocket: () => WebSocket,
  WebSocketPair: () => WebSocketPair,
  WebSocketPlugin: () => WebSocketPlugin,
  coupleWebSocket: () => coupleWebSocket,
  upgradingFetch: () => upgradingFetch
});

// packages/web-sockets/src/fetch.ts
var import_url = __toModule(require("url"));
var import_core = __toModule(require("@miniflare/core"));
var import_shared3 = __toModule(require("@miniflare/shared"));
var import_ws2 = __toModule(require("ws"));

// packages/web-sockets/src/couple.ts
var import_events = __toModule(require("events"));
var import_shared2 = __toModule(require("@miniflare/shared"));
var import_ws = __toModule(require("ws"));

// packages/web-sockets/src/websocket.ts
var import_assert = __toModule(require("assert"));
var import_shared = __toModule(require("@miniflare/shared"));
var MessageEvent = class extends Event {
  data;
  constructor(type, init) {
    super(type);
    this.data = init.data;
  }
};
var CloseEvent = class extends Event {
  code;
  reason;
  wasClean;
  constructor(type, init) {
    super(type);
    this.code = init?.code ?? 1005;
    this.reason = init?.reason ?? "";
    this.wasClean = init?.wasClean ?? false;
  }
};
var ErrorEvent = class extends Event {
  error;
  constructor(type, init) {
    super(type);
    this.error = init?.error ?? null;
  }
};
var kPair = Symbol("kPair");
var kAccepted = Symbol("kAccepted");
var kCoupled = Symbol("kCoupled");
var kClosedOutgoing = Symbol("kClosedOutgoing");
var kClosedIncoming = Symbol("kClosedIncoming");
var kSend = Symbol("kSend");
var kClose = Symbol("kClose");
var kError = Symbol("kError");
var _dispatchQueue, _a, _b, _c, _d, _e, _queuingDispatchToPair, queuingDispatchToPair_fn;
var _WebSocket = class extends import_shared.InputGatedEventTarget {
  constructor() {
    super(...arguments);
    __privateAdd(this, _queuingDispatchToPair);
    __privateAdd(this, _dispatchQueue, []);
    __publicField(this, _a);
    __publicField(this, _b, false);
    __publicField(this, _c, false);
    __publicField(this, _d, false);
    __publicField(this, _e, false);
  }
  [(_a = kPair, _b = kAccepted, _c = kCoupled, _d = kClosedOutgoing, _e = kClosedIncoming, import_shared.kWrapListener)](listener) {
    const wrappedListener = super[import_shared.kWrapListener](listener);
    const addListenerCtx = (0, import_shared.getRequestContext)();
    return (event) => {
      if (addListenerCtx?.durableObject || addListenerCtx === void 0) {
        const ctx = new import_shared.RequestContext({
          requestDepth: addListenerCtx?.requestDepth,
          pipelineDepth: addListenerCtx?.pipelineDepth,
          externalSubrequestLimit: addListenerCtx?.externalSubrequestLimit ?? import_shared.EXTERNAL_SUBREQUEST_LIMIT_BUNDLED
        });
        ctx.runWith(() => wrappedListener(event));
      } else {
        addListenerCtx.runWith(() => wrappedListener(event));
      }
    };
  }
  get readyState() {
    if (this[kClosedOutgoing] && this[kClosedIncoming]) {
      return _WebSocket.READY_STATE_CLOSED;
    } else if (this[kClosedOutgoing] || this[kClosedIncoming]) {
      return _WebSocket.READY_STATE_CLOSING;
    }
    return _WebSocket.READY_STATE_OPEN;
  }
  accept() {
    if (this[kCoupled]) {
      throw new TypeError("Can't accept() WebSocket that was already used in a response.");
    }
    if (this[kAccepted])
      return;
    this[kAccepted] = true;
    if (__privateGet(this, _dispatchQueue) !== void 0) {
      for (const event of __privateGet(this, _dispatchQueue))
        this.dispatchEvent(event);
      __privateSet(this, _dispatchQueue, void 0);
    }
  }
  send(message) {
    if (!this[kAccepted]) {
      throw new TypeError("You must call accept() on this WebSocket before sending messages.");
    }
    this[kSend](message);
  }
  [kSend](message) {
    if (this[kClosedOutgoing]) {
      throw new TypeError("Can't call WebSocket send() after close().");
    }
    const event = new MessageEvent("message", { data: message });
    void __privateMethod(this, _queuingDispatchToPair, queuingDispatchToPair_fn).call(this, event);
  }
  close(code, reason) {
    if (code) {
      const validCode = code >= 1e3 && code < 5e3 && code !== 1004 && code !== 1005 && code !== 1006 && code !== 1015;
      if (!validCode)
        throw new TypeError("Invalid WebSocket close code.");
    }
    if (reason !== void 0 && code === void 0) {
      throw new TypeError("If you specify a WebSocket close reason, you must also specify a code.");
    }
    if (!this[kAccepted]) {
      throw new TypeError("You must call accept() on this WebSocket before sending messages.");
    }
    this[kClose](code, reason);
  }
  [kClose](code, reason) {
    if (this[kClosedOutgoing])
      throw new TypeError("WebSocket already closed");
    this[kClosedOutgoing] = true;
    this[kPair][kClosedIncoming] = true;
    const event = new CloseEvent("close", { code, reason });
    void __privateMethod(this, _queuingDispatchToPair, queuingDispatchToPair_fn).call(this, event);
  }
  [kError](error) {
    const event = new ErrorEvent("error", { error });
    void __privateMethod(this, _queuingDispatchToPair, queuingDispatchToPair_fn).call(this, event);
  }
};
var WebSocket = _WebSocket;
_dispatchQueue = new WeakMap();
_queuingDispatchToPair = new WeakSet();
queuingDispatchToPair_fn = async function(event) {
  await (0, import_shared.waitForOpenOutputGate)();
  const pair = this[kPair];
  if (pair[kAccepted]) {
    pair.dispatchEvent(event);
  } else {
    (0, import_assert.default)(__privateGet(pair, _dispatchQueue) !== void 0);
    __privateGet(pair, _dispatchQueue).push(event);
  }
};
__publicField(WebSocket, "READY_STATE_CONNECTING", 0);
__publicField(WebSocket, "READY_STATE_OPEN", 1);
__publicField(WebSocket, "READY_STATE_CLOSING", 2);
__publicField(WebSocket, "READY_STATE_CLOSED", 3);
var WebSocketPair = function() {
  if (!(this instanceof WebSocketPair)) {
    throw new TypeError("Failed to construct 'WebSocketPair': Please use the 'new' operator, this object constructor cannot be called as a function.");
  }
  this[0] = new WebSocket();
  this[1] = new WebSocket();
  this[0][kPair] = this[1];
  this[1][kPair] = this[0];
};

// packages/web-sockets/src/couple.ts
async function coupleWebSocket(ws, pair) {
  if (pair[kCoupled]) {
    throw new TypeError("Can't return WebSocket that was already used in a response.");
  }
  if (pair[kAccepted]) {
    throw new TypeError("Can't return WebSocket in a Response after calling accept().");
  }
  ws.on("message", (message, isBinary) => {
    if (!pair[kClosedOutgoing]) {
      pair[kSend](isBinary ? (0, import_shared2.viewToBuffer)(message) : message.toString());
    }
  });
  ws.on("close", (code, reason) => {
    if (!pair[kClosedOutgoing]) {
      pair[kClose](code, reason.toString());
    }
  });
  ws.on("error", (error) => {
    pair[kError](error);
  });
  pair.addEventListener("message", (e) => {
    ws.send(e.data);
  });
  pair.addEventListener("close", (e) => {
    if (e.code === 1005) {
      ws.close();
    } else {
      ws.close(e.code, e.reason);
    }
  });
  if (ws.readyState === import_ws.default.CONNECTING) {
    await (0, import_events.once)(ws, "open");
  } else if (ws.readyState >= import_ws.default.CLOSING) {
    throw new TypeError("Incoming WebSocket connection already closed.");
  }
  pair.accept();
  pair[kCoupled] = true;
}

// packages/web-sockets/src/fetch.ts
async function upgradingFetch(input, init) {
  const request = new import_core.Request(input, init);
  if (request.method === "GET" && request.headers.get("upgrade") === "websocket") {
    (0, import_shared3.getRequestContext)()?.incrementExternalSubrequests();
    const url = new import_url.URL(request.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new TypeError(`Fetch API cannot load: ${url.toString()}.
Make sure you're using http(s):// URLs for WebSocket requests via fetch.`);
    }
    url.protocol = url.protocol.replace("http", "ws");
    const headers = {};
    let protocols;
    for (const [key, value] of request.headers.entries()) {
      if (key.toLowerCase() === "sec-websocket-protocol") {
        protocols = value.split(",").map((protocol) => protocol.trim());
      } else {
        headers[key] = value;
      }
    }
    const ws = new import_ws2.default(url, protocols, {
      followRedirects: request.redirect === "follow",
      headers
    });
    let headersResolve;
    const headersPromise = new Promise((resolve) => {
      headersResolve = resolve;
    });
    ws.once("upgrade", (req) => {
      headersResolve((0, import_core._headersFromIncomingRequest)(req));
    });
    const [worker, client] = Object.values(new WebSocketPair());
    await coupleWebSocket(ws, client);
    return new import_core.Response(null, {
      status: 101,
      webSocket: worker,
      headers: await headersPromise
    });
  }
  return import_core.fetch.call(this, request);
}

// packages/web-sockets/src/plugin.ts
var import_core2 = __toModule(require("@miniflare/core"));
var import_shared4 = __toModule(require("@miniflare/shared"));
var constructError = "Failed to construct 'WebSocket': the constructor is not implemented.";
var WebSocketPlugin = class extends import_shared4.Plugin {
  #webSockets = new Set();
  #upgradingFetch;
  constructor(ctx) {
    super(ctx);
    this.#upgradingFetch = (0, import_core2.createCompatFetch)(ctx, upgradingFetch.bind(ctx.fetchMock));
  }
  setup() {
    return {
      globals: {
        MessageEvent,
        CloseEvent,
        WebSocketPair,
        WebSocket: new Proxy(WebSocket, {
          construct() {
            throw new Error(constructError);
          },
          apply() {
            throw new Error(constructError);
          }
        }),
        fetch: this.fetch
      }
    };
  }
  fetch = async (input, init) => {
    const response = await this.#upgradingFetch(input, init);
    if (response.webSocket)
      this.#webSockets.add(response.webSocket);
    return response;
  };
  reload() {
    for (const ws of this.#webSockets) {
      if (!ws[kClosedOutgoing])
        ws.close(1012, "Service Restart");
    }
    this.#webSockets.clear();
  }
  dispose() {
    return this.reload();
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CloseEvent,
  ErrorEvent,
  MessageEvent,
  WebSocket,
  WebSocketPair,
  WebSocketPlugin,
  coupleWebSocket,
  upgradingFetch
});
//# sourceMappingURL=index.js.map
