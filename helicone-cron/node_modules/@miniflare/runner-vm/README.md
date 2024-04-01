# `@miniflare/runner-vm`

VM script runner module for
[Miniflare](https://github.com/cloudflare/miniflare): a fun, full-featured,
fully-local simulator for Cloudflare Workers.

## Example

```js
import { VMScriptRunner } from "@miniflare/runner-vm";

const runner = new VMScriptRunner();
// Pass `console` into sandbox
const globalScope = { console };

// Run regular script
const blueprint1 = {
  code: 'console.log("hello")',
  filePath: "test.js",
};
await runner.run(globalScope, blueprint1); // hello

// Run module script
const blueprint2 = {
  code: 'import thing from "./thing.js"; console.log(thing);',
  filePath: "test.mjs",
};
const moduleRules = [{ type: "ESModule", include: /\.js$/ }];
// Assuming thing.js contains `"export default "thing";`...
await runner.run(globalScope, blueprint2, moduleRules); // thing

// Run module script with additional module
const blueprint3 = {
  code: `import additional from "__ADDITIONAL"; console.log(additional);`,
  filePath: "test.mjs",
};
const modules = {
  __ADDITIONAL: { default: "stuff" },
};
await runner.run(globalScope, blueprint3, moduleRules, modules); // stuff
```
