# 🔥 Miniflare

**Miniflare** is a simulator for developing and testing
[**Cloudflare Workers**](https://workers.cloudflare.com/).

- 🎉 **Fun:** develop workers easily with detailed logging, file watching and
  pretty error pages supporting source maps.
- 🔋 **Full-featured:** supports most Workers features, including KV, Durable
  Objects, WebSockets, modules and more.
- ⚡ **Fully-local:** test and develop Workers without an internet connection.
  Reload code on change quickly.

It's an alternative to `wrangler dev`, written in TypeScript, that runs your
workers in a sandbox implementing Workers' runtime APIs.

**See <https://miniflare.dev> for more detailed documentation.**

## Features

- 📨 Fetch Events (with HTTP(S) server and manual dispatch)
- ⏰ Scheduled Events (with cron triggering and manual dispatch)
- 🔑 Variables and Secrets with `.env` Files
- 📚 Modules Support
- 📦 KV (with optional persistence)
- 🪣 R2 (with optional persistence)
- ✨ Cache (with optional persistence)
- 📌 Durable Objects (with optional persistence)
- 🌐 Workers Sites
- ✉️ WebSockets
- 🛠 Custom & Wrangler Builds Support
- ⚙️ WebAssembly Support
- 🗺 Source Map Support
- 🕸 Web Standards: Base64, Timers, Fetch, Encoding, URL, Streams, Crypto
- 📄 HTMLRewriter
- ⚡️ Live Reload on File Changes
- 📅 Compatibility Dates/Flags Support
- 🔌 Multiple Workers Support
- 🤹 Custom Jest Environment (with isolated per-test storage)
- 💪 Written in TypeScript

## Install

Miniflare is installed using npm:

```sh
$ npm install -g miniflare # either globally..
$ npm install -D miniflare # ...or as a dev dependency
```

## Using the CLI

```sh
$ miniflare worker.js --watch --debug
[mf:dbg] Options:
[mf:dbg] - Scripts: worker.js
[mf:dbg] Reloading worker.js...
[mf:inf] Worker reloaded! (97B)
[mf:dbg] Watching .env, package.json, worker.js, wrangler.toml...
[mf:inf] Listening on :8787
[mf:inf] - http://127.0.0.1:8787
```

## Using the API

```js
import { Miniflare } from "miniflare";

const mf = new Miniflare({
  script: `
  addEventListener("fetch", (event) => {
    event.respondWith(new Response("Hello Miniflare!"));
  });
  `,
});
const res = await mf.dispatchFetch("http://localhost:8787/");
console.log(await res.text()); // Hello Miniflare!
```

## CLI Reference

```
Usage: miniflare [script] [options]

Core Options:
 -h, --help              Show help                                                   [boolean]
 -v, --version           Show version number                                         [boolean]
 -c, --wrangler-config   Path to wrangler.toml                                        [string]
     --wrangler-env      Environment in wrangler.toml to use                          [string]
     --package           Path to package.json                                         [string]
 -m, --modules           Enable modules                                              [boolean]
     --modules-rule      Modules import rule                                 [array:TYPE=GLOB]
     --compat-date       Opt into backwards-incompatible changes from                 [string]
     --compat-flag       Control specific backwards-incompatible changes               [array]
     --usage-model       Usage model (bundled by default)                             [string]
 -u, --upstream          URL of upstream origin                                       [string]
 -w, --watch             Watch files for changes                                     [boolean]
 -d, --debug             Enable debug logging                                        [boolean]
 -V, --verbose           Enable verbose logging                                      [boolean]
     --(no-)update-check Enable update checker (enabled by default)                  [boolean]
     --repl              Enable interactive REPL                                     [boolean]
     --root              Path to resolve files relative to                            [string]
     --mount             Mount additional named workers                [array:NAME=PATH[@ENV]]
     --name              Name of service                                              [string]
     --route             Route to respond with this worker on                          [array]
     --global-async-io   Allow async I/O outside handlers                            [boolean]
     --global-timers     Allow setting timers outside handlers                       [boolean]
     --global-random     Allow secure random generation outside handlers             [boolean]
     --actual-time       Always return correct time from Date methods                [boolean]
     --inaccurate-cpu    Log inaccurate CPU time measurements                        [boolean]

HTTP Options:
 -H, --host              Host for HTTP(S) server to listen on                         [string]
 -p, --port              Port for HTTP(S) server to listen on                         [number]
 -O, --open              Automatically open browser to URL                    [boolean/string]
     --https             Enable self-signed HTTPS (with optional cert path)   [boolean/string]
     --https-key         Path to PEM SSL key                                          [string]
     --https-cert        Path to PEM SSL cert chain                                   [string]
     --https-ca          Path to SSL trusted CA certs                                 [string]
     --https-pfx         Path to PFX/PKCS12 SSL key/cert chain                        [string]
     --https-passphrase  Passphrase to decrypt SSL files                              [string]
     --(no-)cf-fetch     Path for cached Request cf object from Cloudflare    [boolean/string]
     --live-reload       Reload HTML pages whenever worker is reloaded               [boolean]

Scheduler Options:
 -t, --cron              CRON expression for triggering scheduled events               [array]

Build Options:
 -B, --build-command     Command to build project                                     [string]
     --build-base-path   Working directory for build command                          [string]
     --build-watch-path  Directory to watch for rebuilding on changes                  [array]

KV Options:
 -k, --kv                KV namespace to bind                                          [array]
     --kv-persist        Persist KV data (to optional path)                   [boolean/string]

R2 Options:
 -r, --r2                R2 bucket to bind                                             [array]
     --r2-persist        Persist R2 data (to optional path)                   [boolean/string]

Durable Objects Options:
 -o, --do                Durable Object to bind                     [array:NAME=CLASS[@MOUNT]]
     --do-persist        Persist Durable Object data (to optional path)       [boolean/string]
     --(no-)do-alarms    Enable Durable Object alarms (enabled by default)           [boolean]

Cache Options:
     --(no-)cache        Enable default/named caches (enabled by default)            [boolean]
     --cache-persist     Persist cached data (to optional path)               [boolean/string]

Sites Options:
 -s, --site              Path to serve Workers Site files from                        [string]
     --site-include      Glob pattern of site files to serve                           [array]
     --site-exclude      Glob pattern of site files not to serve                       [array]

Bindings Options:
 -e, --env               Path to .env file                                            [string]
 -b, --binding           Binds variable/secret to environment                [array:KEY=VALUE]
     --global            Binds variable/secret to global scope               [array:KEY=VALUE]
     --wasm              WASM module to bind                                 [array:NAME=PATH]
     --text-blob         Text blob to bind                                   [array:NAME=PATH]
     --data-blob         Data blob to bind                                   [array:NAME=PATH]
 -S, --service           Mounted service to bind                      [array:NAME=MOUNT[@ENV]]
```

## Acknowledgements

Miniflare was created by [Brendan Coll](https://github.com/mrbbot).

Many thanks to
[dollarshaveclub/cloudworker](https://github.com/dollarshaveclub/cloudworker)
and
[gja/cloudflare-worker-local](https://github.com/gja/cloudflare-worker-local)
for inspiration.

Durable Object's transactions are implemented using Optimistic Concurrency
Control (OCC) as described in
["On optimistic methods for concurrency control." ACM Transactions on Database Systems](https://dl.acm.org/doi/10.1145/319566.319567).
Thanks to [Alistair O'Brien](https://github.com/johnyob) for helping the
Miniflare creator understand this.
