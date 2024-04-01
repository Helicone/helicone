# `@miniflare/http-server`

HTTP server module for [Miniflare](https://github.com/cloudflare/miniflare): a
fun, full-featured, fully-local simulator for Cloudflare Workers. See
[🧰 Using the API](https://miniflare.dev/get-started/api) for more details.

## Example

```js
import { CorePlugin, MiniflareCore } from "@miniflare/core";
import {
  HTTPPlugin,
  convertNodeRequest,
  createServer,
  startServer,
} from "@miniflare/http-server";
import { VMScriptRunner } from "@miniflare/runner-vm";
import { Log, LogLevel } from "@miniflare/shared";
import { MemoryStorage } from "@miniflare/storage-memory";
import http from "http";

// Converting Node.js http.IncomingMessage to Miniflare's Request
http.createServer(async (nodeReq, nodeRes) => {
  const req = await convertNodeRequest(nodeReq, "http://upstream", {
    forwardedProto: "http",
    realIp: "127.0.0.1",
    cf: { colo: "SFO" },
  });
  nodeRes.end(await req.text());
});

// Creating and starting HTTP servers
export class BadStorageFactory {
  storage() {
    throw new Error("This example shouldn't need storage!");
  }
}

const plugins = { CorePlugin, HTTPPlugin };
const ctx = {
  log: new Log(LogLevel.INFO),
  storageFactory: new BadStorageFactory(),
  scriptRunner: new VMScriptRunner(),
};

const mf = new MiniflareCore(plugins, ctx, {
  modules: true,
  script: `export default {
    async fetch(request, env) {
      return new Response("body");
    }
  }`,
  port: 5000,
});

// Start the server yourself...
const server = await createServer(mf);
// ...or get Miniflare to start it for you, logging the port
const server2 = await startServer(mf);
```
