# `@miniflare/sites`

Workers Sites module for [Miniflare](https://github.com/cloudflare/miniflare): a
fun, full-featured, fully-local simulator for Cloudflare Workers. See
[🌐 Workers Sites](https://miniflare.dev/storage/sites) for more details.

## Example

```js
import { CorePlugin, MiniflareCore } from "@miniflare/core";
import { VMScriptRunner } from "@miniflare/runner-vm";
import { Log, LogLevel } from "@miniflare/shared";
import { SitesPlugin } from "@miniflare/sites";

export class BadStorageFactory {
  storage() {
    throw new Error("This example shouldn't need storage!");
  }
}

const plugins = { CorePlugin, SitesPlugin };
const ctx = {
  log: new Log(LogLevel.INFO),
  storageFactory: new BadStorageFactory(),
  scriptRunner: new VMScriptRunner(),
};

const mf = new MiniflareCore(plugins, ctx, {
  modules: true,
  script: `export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      const pathname = url.pathname.substring(1);
      return new Response(await env.__STATIC_CONTENT.get(pathname));
    }
  }`,
  sitePath: "./public",
});

// Assuming ./public/test.txt contains the text `test`
const res = await mf.dispatchFetch("http://localhost/test.txt");
console.log(await res.text()); // test
```
