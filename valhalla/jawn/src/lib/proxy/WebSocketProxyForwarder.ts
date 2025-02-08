import crypto from "crypto";
import { Headers } from "node-fetch";
import { WebSocket, WebSocketServer } from "ws";
import { Provider } from "../../packages/llm-mapper/types";
import { RequestWrapper } from "../requestWrapper/requestWrapper";
import internal from "stream";
// Create a WebSocket server to handle the upgrade
const wss = new WebSocketServer({ noServer: true });
/* -------------------------------------------------------------------------- */
// NOTE: "failed: Invalid frame header" is currently being experienced after first minute on local -> local connection causing client side drop
// TODO: If this problem occurs in production, we will have to dig in further.
/* -------------------------------------------------------------------------- */

const messageTypes = [
  "open",
  "message",
  "close",
  "error",
  "ping",
  "pong",
  "unexpected-response",
] as const;
type WebSocketProxyForwarder = {
  targetWs: WebSocket;
  clientWs: WebSocket;
  on: (
    messageType: (typeof messageTypes)[number],
    from: "client" | "target",
    data: any
  ) => Promise<void>;
};

async function linkWebSocket({
  targetWs,
  clientWs,
  on,
}: WebSocketProxyForwarder) {
  targetWs.on("error", (error) => {
    console.error("Target WebSocket error:", error);
    clientWs.close(1000, "Target connection error");
    on("error", "target", error);
  });
  clientWs.on("error", (error) => {
    console.error("Client WebSocket error:", error);
    targetWs.close(1000, "Client connection error");
    on("error", "client", error);
  });
  targetWs.on("close", () => {
    clientWs.close(1000, "Target connection closed");
    on("close", "target", "Target connection closed");
  });
  clientWs.on("close", () => {
    targetWs.close(1000, "Client connection closed");
    on("close", "client", "Client connection closed");
  });
  clientWs.on("message", (data: ArrayBufferLike, isBinary: boolean) => {
    const dataCopy = Buffer.from(data);

    targetWs.send(data, { binary: isBinary });
    const message = isBinary ? dataCopy : dataCopy.toString("utf-8");
    on("message", "client", message.toString());
  });
  targetWs.on("message", (data: ArrayBufferLike, isBinary: boolean) => {
    clientWs.send(data, { binary: isBinary });
    const dataCopy = Buffer.from(data);
    const message = isBinary ? dataCopy : dataCopy.toString("utf-8");
    on("message", "target", message.toString());
  });
}

export function webSocketProxyForwarder(
  requestWrapper: RequestWrapper,
  socket: internal.Duplex,
  head: Buffer<ArrayBufferLike>
) {
  const req = requestWrapper.getRequest();

  wss.handleUpgrade(req, socket, head, async (clientWs) => {
    const targetUrl =
      "wss://api.openai.com/v1/realtime" + requestWrapper.url.search;
    const openaiWs = new WebSocket(targetUrl, {
      headers: {
        Authorization: `${requestWrapper.getAuthorization()}`,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    const messages: {
      type: string;
      content: any;
      timestamp: string;
      from: "client" | "target";
    }[] = [];

    openaiWs.on("open", () => {
      linkWebSocket({
        targetWs: openaiWs,
        clientWs,
        on: async (messageType, from, data) => {
          if (messageType === "message") {
            messages.push({
              type: messageType,
              content: data,
              timestamp: new Date().toISOString(),
              from,
            });
          } else if (messageType === "close") {
            console.log("Messages:", messages);
          }
        },
      });
    });
  });
}
