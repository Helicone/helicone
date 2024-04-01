# `@miniflare/durable-objects`

Durable Objects module for [Miniflare](https://github.com/cloudflare/miniflare):
a fun, full-featured, fully-local simulator for Cloudflare Workers. See
[📌 Durable Objects](https://miniflare.dev/storage/durable-objects) for more
details.

## Example

```js
import { DurableObjectStorage } from "@miniflare/durable-objects";
import { MemoryStorage } from "@miniflare/storage-memory";

const storage = new DurableObjectStorage(new MemoryStorage());
await storage.put("key", "value");
console.log(await storage.get("key")); // value
```
