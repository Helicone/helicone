# `@miniflare/core`

Core module for [Miniflare](https://github.com/cloudflare/miniflare): a fun,
full-featured, fully-local simulator for Cloudflare Workers. See
[🧰 Using the API](https://miniflare.dev/get-started/api) for more details.

## Example

```js
import { CorePlugin, MiniflareCore } from "@miniflare/core";
import { KVPlugin } from "@miniflare/kv";
import { VMScriptRunner } from "@miniflare/runner-vm";
import { Log, LogLevel } from "@miniflare/shared";
import { MemoryStorage } from "@miniflare/storage-memory";

export class StorageFactory {
  storages = new Map();

  storage(namespace) {
    let storage = this.storages.get(namespace);
    if (storage) return storage;
    this.storages.set(namespace, (storage = new MemoryStorage()));
    return storage;
  }
}

const plugins = { CorePlugin, KVPlugin };
const ctx = {
  log: new Log(LogLevel.INFO),
  storageFactory: new StorageFactory(),
  scriptRunner: new VMScriptRunner(),
};

const mf = new MiniflareCore(plugins, ctx, {
  modules: true,
  script: `export default {
    async fetch(request, env) {
      return new Response(await env.TEST_NAMESPACE.get("key"));
    }
  }`,
  kvNamespaces: ["TEST_NAMESPACE"],
});

const { TEST_NAMESPACE } = await mf.getBindings();
await TEST_NAMESPACE.put("key", "value");

const res = await mf.dispatchFetch("http://localhost");
console.log(await res.text()); // value
```
