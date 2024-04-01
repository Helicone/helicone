# `@miniflare/kv`

Workers KV module for [Miniflare](https://github.com/cloudflare/miniflare): a
fun, full-featured, fully-local simulator for Cloudflare Workers. See
[📦 KV](https://miniflare.dev/storage/kv) for more details.

## Example

```js
import { KVNamespace } from "@miniflare/kv";
import { MemoryStorage } from "@miniflare/storage-memory";

const ns = new KVNamespace(new MemoryStorage());
await ns.put("key", "value");
console.log(await ns.get("key")); // value
```
