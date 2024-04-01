# `@miniflare/r2`

Workers R2 module for [Miniflare](https://github.com/cloudflare/miniflare): a
fun, full-featured, fully-local simulator for Cloudflare Workers. See
[🪣 R2](https://miniflare.dev/storage/r2) for more details.

## Example

```js
import { R2Bucket } from "@miniflare/r2";
import { MemoryStorage } from "@miniflare/storage-memory";

const r2 = new R2Bucket(new MemoryStorage());
await r2.put("key", "value");
const value = await r2.get("key");
console.log(await value.text()); // "value"
```
