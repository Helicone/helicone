# `html-rewriter-wasm`

An implementation of
[HTMLRewriter](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter)
using a WebAssembly version of
[lol-html](https://github.com/cloudflare/lol-html/). This was primarily written
for [🔥 Miniflare](https://github.com/mrbbot/miniflare), but may be useful for
other projects too. Many thanks to [@inikulin](https://github.com/inikulin) for
their work on
[lol-html's JavaScript API](https://github.com/cloudflare/lol-html/tree/master/js-api)
which this package's Rust code is based on.

## Features

- 🔋 Supports all handler types, properties and methods
- ⏰ Supports synchronous and asynchronous handlers
- 📌 Supports class handlers with correctly bound methods

## Usage

```js
import { HTMLRewriter } from "html-rewriter-wasm";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let output = "";
const rewriter = new HTMLRewriter((outputChunk) => {
  output += decoder.decode(outputChunk);
});

rewriter.on("p", {
  element(element) {
    element.setInnerContent("new");
  },
});

try {
  await rewriter.write(encoder.encode("<p>old</p>"));
  await rewriter.end();
  console.log(output); // <p>new</p>
} finally {
  rewriter.free(); // Remember to free memory
}
```

See [test/index.ts](./test/index.ts) for a more traditional `HTMLRewriter`
implementation that doesn't have the caveats listed below, but restricts input
and output to strings.

To enable the
[`html_rewriter_treats_esi_include_as_void_tag`](https://developers.cloudflare.com/workers/platform/compatibility-dates#htmlrewriter-handling-of-esiinclude)
compatibility flag, set `enableEsiTags` when constructing the `HTMLRewriter`:

```js
const rewriter = new HTMLRewriter((outputChunk) => { ... }, {
  enableEsiTags: true,
});
```

## Caveats

- Once `write` or `end` has been called, you cannot add any more handlers. You
  must register all handlers before you start transforming:

  ```js
  const rewriter = new HTMLRewriter(...);

  // ❌
  rewriter.on("h1", { ... });
  await rewriter.write(encoder.encode("<h1>1</h1"));
  rewriter.on("p", { ... }); // not allowed
  await rewriter.write(encoder.encode("<p>2</p>"));

  // ✅
  rewriter.on("h1", { ... });
  rewriter.on("p", { ... });
  await rewriter.write(encoder.encode("<h1>1</h1"));
  await rewriter.write(encoder.encode("<p>2</p>"));
  ```

- `end` may only be called once per `HTMLRewriter` instance. This means you must
  create a new `HTMLRewriter` instance for each transformation:

  ```js
  // ❌
  const rewriter = new HTMLRewriter(...);
  await rewriter.end();
  await rewriter.end(); // not allowed

  // ✅
  const rewriter1 = new HTMLRewriter(...);
  await rewriter1.end();
  const rewriter2 = new HTMLRewriter(...);
  await rewriter2.end();
  ```

- When using `async` handlers, you must always `await` calls to `write` and
  `end` before calling them again. In other words, you cannot have concurrent
  `write` and `end` calls:

  ```js
  const rewriter = new HTMLRewriter(...).on("p", {
    async element(element) {
      await fetch(...);
      element.setInnerContent("new");
    }
  });

  // ❌
  rewriter.write(encoder.encode("<p>1</p>"));
  rewriter.write(encoder.encode("<p>2</p>")); // not allowed

  // ❌
  const promise1 = rewriter.write(encoder.encode("<p>1</p>"));
  const promise2 = rewriter.write(encoder.encode("<p>2</p>"));
  await Promise.all([promise1, promise2]); // not allowed

  // ✅
  await rewriter.write(encoder.encode("<p>1</p>"));
  await rewriter.write(encoder.encode("<p>2</p>"));
  ```

## Internals

`lol-html` doesn't natively support asynchronous handlers. Instead, whenever a
handler returns a `Promise`, we have to unwind the WebAssembly stack into
temporary storage, wait for the promise to resolve, then rewind the stack and
continue parsing. This temporary storage is per `HTMLRewriter` instance, hence
we cannot have concurrent `write` and `end` calls. We use the
[Asyncify](https://github.com/WebAssembly/binaryen/blob/main/src/passes/Asyncify.cpp)
feature of [Binaryen](https://github.com/WebAssembly/binaryen) to implement
this. See
[this article](https://kripken.github.io/blog/wasm/2019/07/16/asyncify.html) for
more details.

## Building

You can build the package by running `npm run build`. You must do this prior to
running tests with `npm test`.

You **must** have mrbbot's fork of wasm-pack installed. This upgrades binaryen
(wasm-opt) to version_92 which exports `asyncify_get_state`:

```shell
$ cargo install --git https://github.com/mrbbot/wasm-pack
$ npm run build
$ npm test
```

## License

`html-rewriter-wasm` uses [lol-html](https://github.com/cloudflare/lol-html/)
which is BSD 3-Clause licensed:

```
Copyright (C) 2019, Cloudflare, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation and/or
other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
may be used to endorse or promote products derived from this software without
specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```
