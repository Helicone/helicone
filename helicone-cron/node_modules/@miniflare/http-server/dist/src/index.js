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

// packages/http-server/src/index.ts
__export(exports, {
  DEFAULT_PORT: () => DEFAULT_PORT,
  HTTPPlugin: () => HTTPPlugin,
  convertNodeRequest: () => convertNodeRequest,
  createRequestListener: () => createRequestListener,
  createServer: () => createServer,
  getAccessibleHosts: () => getAccessibleHosts,
  startServer: () => startServer
});
var import_assert = __toModule(require("assert"));
var import_http = __toModule(require("http"));
var import_https = __toModule(require("https"));
var import_net = __toModule(require("net"));
var import_web = __toModule(require("stream/web"));
var import_url = __toModule(require("url"));
var import_zlib = __toModule(require("zlib"));
var import_core = __toModule(require("@miniflare/core"));
var import_shared2 = __toModule(require("@miniflare/shared"));
var import_web_sockets = __toModule(require("@miniflare/web-sockets"));

// packages/http-server/src/helpers.ts
var import_os = __toModule(require("os"));
function getAccessibleHosts(ipv4 = false) {
  const hosts = [];
  Object.values((0, import_os.networkInterfaces)()).forEach((net2) => {
    net2?.forEach(({ family, address }) => {
      if (!ipv4 || family === "IPv4" || family === 4)
        hosts.push(address);
    });
  });
  return hosts;
}

// packages/http-server/src/plugin.ts
var import_promises = __toModule(require("fs/promises"));
var import_path = __toModule(require("path"));
var import_util = __toModule(require("util"));
var import_shared = __toModule(require("@miniflare/shared"));
var import_colors = __toModule(require("kleur/colors"));
var import_undici = __toModule(require("undici"));
var DAY = 864e5;
var CERT_DAYS = 30;
var CF_DAYS = 30;
var defaultCertRoot = import_path.default.resolve(".mf", "cert");
var defaultCfPath = import_path.default.resolve("node_modules", ".mf", "cf.json");
var defaultCfFetch = process.env.NODE_ENV !== "test";
var defaultCfFetchEndpoint = "https://workers.cloudflare.com/cf.json";
var defaultCf = {
  asn: 395747,
  colo: "DFW",
  city: "Austin",
  region: "Texas",
  regionCode: "TX",
  metroCode: "635",
  postalCode: "78701",
  country: "US",
  continent: "NA",
  timezone: "America/Chicago",
  latitude: "30.27130",
  longitude: "-97.74260",
  clientTcpRtt: 0,
  httpProtocol: "HTTP/1.1",
  requestPriority: "weight=192;exclusive=0",
  tlsCipher: "AEAD-AES128-GCM-SHA256",
  tlsVersion: "TLSv1.3",
  tlsClientAuth: {
    certIssuerDNLegacy: "",
    certIssuerDN: "",
    certPresented: "0",
    certSubjectDNLegacy: "",
    certSubjectDN: "",
    certNotBefore: "",
    certNotAfter: "",
    certSerial: "",
    certFingerprintSHA1: "",
    certVerified: "NONE"
  }
};
function valueOrFile(value, filePath) {
  return value ?? (filePath && import_promises.default.readFile(filePath, "utf8"));
}
var HTTPPlugin = class extends import_shared.Plugin {
  constructor(ctx, options, defaults = {}) {
    super(ctx);
    this.defaults = defaults;
    this.assignOptions(options);
    this.defaultCertRoot = defaults.certRoot ?? defaultCertRoot;
    this.defaultCfPath = defaults.cfPath ?? defaultCfPath;
    this.defaultCfFetch = defaults.cfFetch ?? defaultCfFetch;
    this.cfFetchEndpoint = defaults.cfFetchEndpoint ?? defaultCfFetchEndpoint;
    this.clock = defaults.clock ?? import_shared.defaultClock;
    this.httpsEnabled = !!(this.https || this.httpsKey || this.httpsKeyPath || this.httpsCert || this.httpsCertPath || this.httpsCa || this.httpsCaPath || this.httpsPfx || this.httpsPfxPath);
  }
  host;
  port;
  open;
  https;
  httpsKey;
  httpsKeyPath;
  httpsCert;
  httpsCertPath;
  httpsCa;
  httpsCaPath;
  httpsPfx;
  httpsPfxPath;
  httpsPassphrase;
  cfFetch;
  metaProvider;
  liveReload;
  defaultCertRoot;
  defaultCfPath;
  defaultCfFetch;
  cfFetchEndpoint;
  clock;
  #cf = defaultCf;
  httpsEnabled;
  #httpsOptions;
  getRequestMeta(req) {
    if (this.metaProvider)
      return this.metaProvider(req);
    return { cf: this.#cf };
  }
  get httpsOptions() {
    return this.#httpsOptions;
  }
  async setupCf() {
    let cfPath = this.cfFetch ?? this.defaultCfFetch;
    if (!cfPath || this.metaProvider)
      return;
    if (cfPath === true)
      cfPath = this.defaultCfPath;
    let refetch = true;
    try {
      this.#cf = JSON.parse(await import_promises.default.readFile(cfPath, "utf8"));
      const cfStat = await import_promises.default.stat(cfPath);
      refetch = this.clock() - cfStat.mtimeMs > CF_DAYS * DAY;
    } catch {
    }
    if (!refetch)
      return;
    try {
      const res = await (0, import_undici.fetch)(this.cfFetchEndpoint);
      const cfText = await res.text();
      this.#cf = JSON.parse(cfText);
      await import_promises.default.mkdir(import_path.default.dirname(cfPath), { recursive: true });
      await import_promises.default.writeFile(cfPath, cfText, "utf8");
      this.ctx.log.info("Updated `Request.cf` object cache!");
    } catch (e) {
      this.ctx.log.warn("Unable to fetch the `Request.cf` object! Falling back to a default placeholder...\nTo always use the placeholder, set the `--no-cf-fetch`/`cfFetch: false` option.\n" + (0, import_colors.dim)(e.cause ? e.cause.stack : e.stack));
    }
  }
  async setupHttps() {
    if (!this.httpsEnabled)
      return;
    let https2 = this.https;
    if (https2 === true)
      https2 = this.defaultCertRoot;
    if (typeof https2 === "string") {
      const keyPath = import_path.default.join(https2, "key.pem");
      const certPath = import_path.default.join(https2, "cert.pem");
      let regenerate = true;
      try {
        const keyStat = await import_promises.default.stat(keyPath);
        const certStat = await import_promises.default.stat(certPath);
        const created = Math.max(keyStat.mtimeMs, certStat.mtimeMs);
        regenerate = this.clock() - created > (CERT_DAYS - 2) * DAY;
      } catch {
      }
      if (regenerate) {
        this.ctx.log.info("Generating new self-signed certificate...");
        const selfSigned = require("selfsigned");
        const certAttrs = [
          { name: "commonName", value: "localhost" }
        ];
        const certOptions = {
          algorithm: "sha256",
          days: CERT_DAYS,
          keySize: 2048,
          extensions: [
            { name: "basicConstraints", cA: true },
            {
              name: "keyUsage",
              keyCertSign: true,
              digitalSignature: true,
              nonRepudiation: true,
              keyEncipherment: true,
              dataEncipherment: true
            },
            {
              name: "extKeyUsage",
              serverAuth: true,
              clientAuth: true,
              codeSigning: true,
              timeStamping: true
            },
            {
              name: "subjectAltName",
              altNames: [
                { type: 2, value: "localhost" },
                ...getAccessibleHosts().map((ip) => ({ type: 7, ip }))
              ]
            }
          ]
        };
        const cert = await (0, import_util.promisify)(selfSigned.generate)(certAttrs, certOptions);
        await import_promises.default.mkdir(https2, { recursive: true });
        await import_promises.default.writeFile(keyPath, cert.private, "utf8");
        await import_promises.default.writeFile(certPath, cert.cert, "utf8");
      }
      this.httpsKeyPath = keyPath;
      this.httpsCertPath = certPath;
    }
    this.#httpsOptions = {
      key: await valueOrFile(this.httpsKey, this.httpsKeyPath),
      cert: await valueOrFile(this.httpsCert, this.httpsCertPath),
      ca: await valueOrFile(this.httpsCa, this.httpsCaPath),
      pfx: await valueOrFile(this.httpsPfx, this.httpsPfxPath),
      passphrase: this.httpsPassphrase
    };
  }
  async setup() {
    void this.setupCf();
    await this.setupHttps();
    return {};
  }
};
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.STRING,
    alias: "H",
    description: "Host for HTTP(S) server to listen on",
    fromWrangler: ({ miniflare }) => miniflare?.host
  })
], HTTPPlugin.prototype, "host", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.NUMBER,
    alias: "p",
    description: "Port for HTTP(S) server to listen on",
    fromWrangler: ({ miniflare }) => miniflare?.port
  })
], HTTPPlugin.prototype, "port", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.BOOLEAN_STRING,
    alias: "O",
    description: "Automatically open browser to URL",
    fromWrangler: ({ miniflare }) => miniflare?.open
  })
], HTTPPlugin.prototype, "open", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.BOOLEAN_STRING,
    description: "Enable self-signed HTTPS (with optional cert path)",
    logName: "HTTPS",
    fromWrangler: ({ miniflare }) => typeof miniflare?.https === "object" ? void 0 : miniflare?.https
  })
], HTTPPlugin.prototype, "https", 2);
__decorateClass([
  (0, import_shared.Option)({ type: import_shared.OptionType.NONE })
], HTTPPlugin.prototype, "httpsKey", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.STRING,
    name: "https-key",
    description: "Path to PEM SSL key",
    logName: "HTTPS Key",
    fromWrangler: ({ miniflare }) => typeof miniflare?.https === "object" ? miniflare.https?.key : void 0
  })
], HTTPPlugin.prototype, "httpsKeyPath", 2);
__decorateClass([
  (0, import_shared.Option)({ type: import_shared.OptionType.NONE })
], HTTPPlugin.prototype, "httpsCert", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.STRING,
    name: "https-cert",
    description: "Path to PEM SSL cert chain",
    logName: "HTTPS Cert",
    fromWrangler: ({ miniflare }) => typeof miniflare?.https === "object" ? miniflare.https?.cert : void 0
  })
], HTTPPlugin.prototype, "httpsCertPath", 2);
__decorateClass([
  (0, import_shared.Option)({ type: import_shared.OptionType.NONE })
], HTTPPlugin.prototype, "httpsCa", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.STRING,
    name: "https-ca",
    description: "Path to SSL trusted CA certs",
    logName: "HTTPS CA",
    fromWrangler: ({ miniflare }) => typeof miniflare?.https === "object" ? miniflare.https?.ca : void 0
  })
], HTTPPlugin.prototype, "httpsCaPath", 2);
__decorateClass([
  (0, import_shared.Option)({ type: import_shared.OptionType.NONE })
], HTTPPlugin.prototype, "httpsPfx", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.STRING,
    name: "https-pfx",
    description: "Path to PFX/PKCS12 SSL key/cert chain",
    logName: "HTTPS PFX",
    fromWrangler: ({ miniflare }) => typeof miniflare?.https === "object" ? miniflare.https?.pfx : void 0
  })
], HTTPPlugin.prototype, "httpsPfxPath", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.STRING,
    description: "Passphrase to decrypt SSL files",
    logName: "HTTPS Passphrase",
    logValue: () => "**********",
    fromWrangler: ({ miniflare }) => typeof miniflare?.https === "object" ? miniflare.https?.passphrase : void 0
  })
], HTTPPlugin.prototype, "httpsPassphrase", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.BOOLEAN_STRING,
    description: "Path for cached Request cf object from Cloudflare",
    negatable: true,
    logName: "Request cf Object Fetch",
    logValue(value) {
      if (value === true)
        return import_path.default.relative("", defaultCfPath);
      if (value === false)
        return void 0;
      return import_path.default.relative("", value);
    },
    fromWrangler: ({ miniflare }) => miniflare?.cf_fetch
  })
], HTTPPlugin.prototype, "cfFetch", 2);
__decorateClass([
  (0, import_shared.Option)({ type: import_shared.OptionType.NONE })
], HTTPPlugin.prototype, "metaProvider", 2);
__decorateClass([
  (0, import_shared.Option)({
    type: import_shared.OptionType.BOOLEAN,
    description: "Reload HTML pages whenever worker is reloaded",
    fromWrangler: ({ miniflare }) => miniflare?.live_reload
  })
], HTTPPlugin.prototype, "liveReload", 2);

// packages/http-server/src/index.ts
var DEFAULT_PORT = 8787;
var liveReloadScript = `<script defer type="application/javascript">
(function () {
  // Miniflare Live Reload
  var url = new URL("/cdn-cgi/mf/reload", location.origin);
  url.protocol = url.protocol.replace("http", "ws");
  function reload() { location.reload(); }
  function connect(reconnected) {
    var ws = new WebSocket(url);
    if (reconnected) ws.onopen = reload;
    ws.onclose = function(e) {
      e.code === 1012 ? reload() : e.code === 1000 || e.code === 1001 || setTimeout(connect, 1000, true);
    }
  }
  connect();
})();
<\/script>`;
var liveReloadScriptLength = Buffer.byteLength(liveReloadScript);
async function convertNodeRequest(req, meta) {
  const protocol = req.socket.encrypted ? "https" : "http";
  const origin = `${protocol}://${req.headers.host ?? "localhost"}`;
  const url = new import_url.URL(req.url ?? "", origin);
  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    let iterator;
    body = new import_web.ReadableStream({
      type: "bytes",
      start() {
        iterator = req[Symbol.asyncIterator]();
      },
      async pull(controller) {
        const { done, value } = await iterator.next();
        if (done) {
          queueMicrotask(() => {
            controller.close();
            controller.byobRequest?.respond(0);
          });
        } else {
          const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
          controller.enqueue(new Uint8Array(buffer));
        }
      },
      async cancel() {
        await iterator.return?.();
      }
    });
  }
  const proto = meta?.forwardedProto ?? "https";
  let ip = meta?.realIp ?? req.socket.remoteAddress ?? "";
  if (ip === "::1")
    ip = "127.0.0.1";
  if (ip.startsWith("::ffff:"))
    ip = ip.substring("::ffff:".length);
  req.headers["x-forwarded-proto"] ??= proto;
  req.headers["x-real-ip"] ??= ip;
  req.headers["cf-connecting-ip"] ??= ip;
  req.headers["cf-ipcountry"] ??= meta?.cf?.country ?? "US";
  req.headers["cf-ray"] ??= (0, import_shared2.randomHex)(16);
  req.headers["cf-visitor"] ??= `{"scheme":"${proto}"}`;
  req.headers["host"] = url.host;
  const clientAcceptEncoding = req.headers["accept-encoding"];
  (0, import_assert.default)(!Array.isArray(clientAcceptEncoding));
  req.headers["accept-encoding"] = "gzip";
  const headers = (0, import_core._headersFromIncomingRequest)(req);
  const request = new import_core.Request(url, {
    method: req.method,
    headers,
    body,
    cf: {
      ...meta?.cf,
      clientAcceptEncoding
    },
    redirect: "manual"
  });
  return { request, url };
}
async function writeResponse(response, res, liveReload = false, log) {
  const headers = {};
  for (let [key, value] of response.headers) {
    key = key.toLowerCase();
    if (key === "set-cookie") {
      headers["set-cookie"] = response.headers.getAll("set-cookie");
    } else if (key !== "content-length") {
      headers[key] = value;
    }
  }
  const contentLengthHeader = response.headers.get("Content-Length");
  const contentLength = (0, import_core._getBodyLength)(response) ?? (contentLengthHeader === null ? null : parseInt(contentLengthHeader));
  if (contentLength !== null && !isNaN(contentLength)) {
    headers["content-length"] = contentLength;
  }
  const encoders = [];
  if (headers["content-encoding"] && response.encodeBody === "automatic") {
    const codings = headers["content-encoding"].toString().toLowerCase().split(",").map((x) => x.trim());
    for (const coding of codings) {
      if (/(x-)?gzip/.test(coding)) {
        encoders.push(import_zlib.default.createGzip());
      } else if (/(x-)?deflate/.test(coding)) {
        encoders.push(import_zlib.default.createDeflate());
      } else if (coding === "br") {
        encoders.push(import_zlib.default.createBrotliCompress());
      } else {
        log?.warn(`Unknown encoding "${coding}", sending plain response...`);
        encoders.length = 0;
        break;
      }
    }
    if (encoders.length > 0) {
      delete headers["content-length"];
    }
  }
  const liveReloadEnabled = liveReload && response.encodeBody === "automatic" && response.headers.get("content-type")?.toLowerCase().includes("text/html");
  if (liveReloadEnabled && contentLength !== null) {
    if (!isNaN(contentLength)) {
      headers["content-length"] = contentLength + liveReloadScriptLength;
    }
  }
  res.writeHead(response.status, headers);
  let initialStream = res;
  for (let i = encoders.length - 1; i >= 0; i--) {
    encoders[i].pipe(initialStream);
    initialStream = encoders[i];
  }
  if (response.body) {
    for await (const chunk of response.body) {
      if (chunk)
        initialStream.write(chunk);
    }
    if (liveReloadEnabled) {
      initialStream.write(liveReloadScript);
    }
  }
  initialStream.end();
}
function createRequestListener(mf) {
  return async (req, res) => {
    const { CorePlugin, HTTPPlugin: HTTPPlugin2 } = await mf.getPlugins();
    const start = process.hrtime();
    const startCpu = CorePlugin.inaccurateCpu ? process.cpuUsage() : void 0;
    const { request, url } = await convertNodeRequest(req, await HTTPPlugin2.getRequestMeta(req));
    let response;
    let waitUntil;
    let status = 500;
    const pathname = url.pathname.replace(/\/$/, "");
    if (pathname.startsWith("/cdn-cgi/")) {
      if (pathname === "/cdn-cgi/mf/scheduled") {
        req.method = "SCHD";
        const time = url.searchParams.get("time");
        const cron = url.searchParams.get("cron");
        waitUntil = mf.dispatchScheduled(time ? parseInt(time) : void 0, cron ?? void 0, url);
        status = 200;
      } else {
        status = 404;
      }
      res?.writeHead(status, { "Content-Type": "text/plain; charset=UTF-8" });
      res?.end();
    } else {
      try {
        response = await mf.dispatchFetch(request);
        waitUntil = response.waitUntil();
        status = response.status;
        if (res) {
          await writeResponse(response, res, HTTPPlugin2.liveReload, mf.log);
        }
      } catch (e) {
        const accept = req.headers.accept?.toLowerCase() ?? "";
        const userAgent = req.headers["user-agent"]?.toLowerCase() ?? "";
        if (!userAgent.includes("curl/") && (accept.includes("text/html") || accept.includes("*/*") || accept.includes("text/*"))) {
          const Youch = require("youch");
          const youch = new Youch(e, req);
          youch.addLink(() => {
            const links = [
              '<a href="https://developers.cloudflare.com/workers/" target="_blank" style="text-decoration:none">\u{1F4DA} Workers Docs</a>',
              '<a href="https://discord.gg/cloudflaredev" target="_blank" style="text-decoration:none">\u{1F4AC} Workers Discord</a>',
              '<a href="https://miniflare.dev" target="_blank" style="text-decoration:none">\u{1F525} Miniflare Docs</a>'
            ];
            if (HTTPPlugin2.liveReload)
              links.push(liveReloadScript);
            return links.join("");
          });
          const errorHtml = await youch.toHTML();
          res?.writeHead(500, { "Content-Type": "text/html; charset=UTF-8" });
          res?.end(errorHtml, "utf8");
        } else {
          res?.writeHead(500, { "Content-Type": "text/plain; charset=UTF-8" });
          res?.end(e.stack, "utf8");
        }
        mf.log.error((0, import_shared2.prefixError)(`${req.method} ${req.url}`, e));
      }
    }
    (0, import_assert.default)(req.method && req.url);
    const logPromise = (0, import_core.logResponse)(mf.log, {
      start,
      startCpu,
      method: req.method,
      url: req.url,
      status,
      waitUntil
    });
    if (res !== void 0)
      await logPromise;
    return response;
  };
}
var restrictedWebSocketUpgradeHeaders = [
  "upgrade",
  "connection",
  "sec-websocket-accept"
];
async function createServer(mf, options) {
  const plugins = await mf.getPlugins();
  const listener = createRequestListener(mf);
  let server;
  if (plugins.HTTPPlugin.httpsEnabled) {
    const httpsOptions = plugins.HTTPPlugin.httpsOptions;
    (0, import_assert.default)(httpsOptions);
    server = import_https.default.createServer({ ...httpsOptions, ...options }, listener);
  } else {
    server = import_http.default.createServer(options ?? {}, listener);
  }
  const { WebSocketServer } = require("ws");
  const webSocketServer = new WebSocketServer({
    noServer: true,
    handleProtocols: () => false
  });
  const liveReloadServer = new WebSocketServer({ noServer: true });
  const extraHeaders = new WeakMap();
  webSocketServer.on("headers", (headers, req) => {
    const extra = extraHeaders.get(req);
    extraHeaders.delete(req);
    if (extra) {
      for (const [key, value] of extra) {
        if (!restrictedWebSocketUpgradeHeaders.includes(key.toLowerCase())) {
          headers.push(`${key}: ${value}`);
        }
      }
    }
  });
  server.on("upgrade", async (request, socket, head) => {
    const { pathname } = new import_url.URL(request.url ?? "", "http://localhost");
    if (pathname === "/cdn-cgi/mf/reload") {
      liveReloadServer.handleUpgrade(request, socket, head, (ws) => {
        liveReloadServer.emit("connection", ws, request);
      });
    } else {
      const response = await listener(request);
      const webSocket = response?.webSocket;
      if (response?.status === 101 && webSocket) {
        extraHeaders.set(request, response.headers);
        webSocketServer.handleUpgrade(request, socket, head, (ws) => {
          void (0, import_web_sockets.coupleWebSocket)(ws, webSocket);
          webSocketServer.emit("connection", ws, request);
        });
        return;
      }
      const res = new import_http.default.ServerResponse(request);
      (0, import_assert.default)(socket instanceof import_net.default.Socket);
      res.assignSocket(socket);
      if (!response || 200 <= response.status && response.status < 300) {
        res.writeHead(500);
        res.end();
        mf.log.error(new TypeError("Web Socket request did not return status 101 Switching Protocols response with Web Socket"));
        return;
      }
      await writeResponse(response, res, false, mf.log);
    }
  });
  const reloadListener = () => {
    for (const ws of liveReloadServer.clients) {
      ws.close(1012, "Service Restart");
    }
    for (const ws of webSocketServer.clients) {
      ws.close(1012, "Service Restart");
    }
  };
  mf.addEventListener("reload", reloadListener);
  server.on("close", () => mf.removeEventListener("reload", reloadListener));
  return server;
}
async function startServer(mf, options) {
  const server = await createServer(mf, options);
  const plugins = await mf.getPlugins();
  const { httpsEnabled, host, port = DEFAULT_PORT } = plugins.HTTPPlugin;
  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const log = mf.log;
      const protocol = httpsEnabled ? "https" : "http";
      const accessibleHosts = host && host !== "0.0.0.0" ? [host] : getAccessibleHosts(true);
      const address = server.address();
      const usedPort = address && typeof address === "object" ? address.port : port;
      log.info(`Listening on ${host ?? ""}:${usedPort}`);
      for (const accessibleHost of accessibleHosts) {
        log.info(`- ${protocol}://${accessibleHost}:${usedPort}`);
      }
      resolve(server);
    });
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_PORT,
  HTTPPlugin,
  convertNodeRequest,
  createRequestListener,
  createServer,
  getAccessibleHosts,
  startServer
});
//# sourceMappingURL=index.js.map
