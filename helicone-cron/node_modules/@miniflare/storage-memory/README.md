# `@miniflare/storage-memory`

In-memory storage module for
[Miniflare](https://github.com/cloudflare/miniflare): a fun, full-featured,
fully-local simulator for Cloudflare Workers.

## Example

```js
import { KVNamespace } from "@miniflare/kv";
import { MemoryStorage } from "@miniflare/storage-memory";

const ns = new KVNamespace(new MemoryStorage());
await ns.put("key", "value");
console.log(await ns.get("key")); // value
```
