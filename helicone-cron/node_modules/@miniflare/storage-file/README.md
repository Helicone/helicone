# `@miniflare/storage-file`

File-system storage module for
[Miniflare](https://github.com/cloudflare/miniflare): a fun, full-featured,
fully-local simulator for Cloudflare Workers.

## Example

```js
import { KVNamespace } from "@miniflare/kv";
import { FileStorage } from "@miniflare/storage-file";

const ns = new KVNamespace(new FileStorage("./data"));
await ns.put("key", "value");
console.log(await ns.get("key")); // value
```
