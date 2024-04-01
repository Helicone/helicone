# `@miniflare/html-rewriter`

HTMLRewriter module for [Miniflare](https://github.com/cloudflare/miniflare): a
fun, full-featured, fully-local simulator for Cloudflare Workers. See
[📄 HTMLRewriter](https://miniflare.dev/core/html-rewriter) for more details.

## Example

```js
import { Response } from "@miniflare/core";
import { HTMLRewriter } from "@miniflare/html-rewriter";

const rewriter = new HTMLRewriter().on("p", {
  element(element) {
    element.setInnerContent("new");
  },
});

const res = new Response("<p>old</p>");
const transformed = rewriter.transform(res);
console.log(await transformed.text()); // <p>new</p>
```
