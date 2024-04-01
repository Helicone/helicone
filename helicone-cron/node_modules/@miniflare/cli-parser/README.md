# `@miniflare/cli-parser`

CLI option parsing module for
[Miniflare](https://github.com/cloudflare/miniflare): a fun, full-featured,
fully-local simulator for Cloudflare Workers. See
[💻 Using the CLI](https://miniflare.dev/get-started/cli) for more details.

## Example

```js
import { buildHelp, parseArgv } from "@miniflare/cli-parser";
import { BuildPlugin } from "@miniflare/core";
import { KVPlugin } from "@miniflare/kv";

const plugins = { BuildPlugin, KVPlugin };

const help = buildHelp(plugins, "exec");
console.log(help); // Usage: exec ...

const options = parseArgv(plugins, [
  "--build-command",
  "npm run build",
  "--kv-persist",
]);
console.log(options); // { buildCommand: "npm run build", kvPersist: true };
```
