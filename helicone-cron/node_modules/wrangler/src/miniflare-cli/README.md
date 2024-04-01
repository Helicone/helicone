# Custom Miniflare CLI

This directory contains a simple wrapper around the programmatic Miniflare API,
which Wrangler spawns when running `wrangler dev` in local mode.

## Building

This CLI is built at the same time as Wrangler by running

```
npm run -w wrangler build
```

The output of the build is `miniflare-dist/index.mjs`.

## Running

The CLI expects a single command line argument which is the Miniflare options formatted as a string of JSON.

```bash
node --no-warnings ./packages/wrangler/miniflare-dist/index.mjs '{"watch": true, "script": ""}' --log VERBOSE
```

The `--log` argument is optional and takes one of Miniflare's LogLevels: "NONE", "ERROR", "WARN", "INFO", "DEBUG", "VERBOSE".
It defaults to `INFO`.

## Debugging

Simply place a breakpoint in the code and run the above command in the VS Code "JavaScript Debug Terminal".
The code will stop at the breakpoint as expected.
