# `@miniflare/web-sockets`

WebSocket module for [Miniflare](https://github.com/cloudflare/miniflare): a
fun, full-featured, fully-local simulator for Cloudflare Workers. See
[✉️ WebSockets](https://miniflare.dev/core/web-sockets) for more details.

## Example

```js
import StandardWebSocket from "ws";
import { WebSocketPair, coupleWebSocket } from "@miniflare/web-sockets";

const [webSocket1, webSocket2] = Object.values(new WebSocketPair());

// Manually accept the first WebSocket
webSocket1.accept();
webSocket1.addEventListener("message", (event) => {
  console.log(event.data);
});
webSocket1.send("hello");

// Couple (forward messages from/to) the second WebSocket with a real WebSocket
const ws = new StandardWebSocket("ws://...");
coupleWebSocket(ws, webSocket2);
```
