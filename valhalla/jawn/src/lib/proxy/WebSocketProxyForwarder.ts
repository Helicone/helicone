import internal from "stream";
import { WebSocket, WebSocketServer } from "ws";
import { SocketMessage } from "../../types/realtime";
import { KafkaProducer } from "../clients/KafkaProducer";
import { supabaseServer } from "../db/supabase";
import { RequestWrapper } from "../requestWrapper/requestWrapper";
import { S3Client } from "../shared/db/s3Client";
import { S3Manager } from "./S3Manager";
import { handleSocketSession } from "./WebSocketProxyRequestHandler";

/* -------------------------------------------------------------------------- */
// NOTE: "failed: Invalid frame header" is currently being experienced after first minute on local -> local connection causing client side drop
// TODO: If this problem occurs in production, we will have to dig further.
/* -------------------------------------------------------------------------- */

// Create a WebSocket server to handle the upgrade
const wss = new WebSocketServer({ noServer: true });

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

    // Keep message events in memory
    const messages: SocketMessage[] = [];

    // Link the WebSocket connections, with a callback for events
    openaiWs.on("open", () => {
      linkWebSocket({
        clientWs,
        targetWs: openaiWs,
        on: async (messageType, from, data) => {
          /* -------------------------------------------------------------------------- */
          /*                            Append Message Events                           */
          /* -------------------------------------------------------------------------- */
          if (messageType === "message") {
            const content = typeof data === "string" ? JSON.parse(data) : data;
            messages.push({
              type: messageType,
              content,
              timestamp: new Date().toISOString(),
              from,
            });
            /* -------------------------------------------------------------------------- */
            /*                            Handle Closing Event                            */
            /* -------------------------------------------------------------------------- */
          } else if (messageType === "close") {
            try {
              // 1. Handle the socket session with socket messages
              const { loggable } = await handleSocketSession(
                messages,
                requestWrapper
              );

              // 2. Get the auth
              const { data: auth, error: authError } =
                await requestWrapper.auth();
              if (authError !== null) {
                console.error("Error getting auth", authError);
                return;
              }

              // 3. Get the auth params
              const { data: authParams, error: authParamsError } =
                await supabaseServer.authenticate(auth);

              if (authParamsError || !authParams) {
                console.error("Error getting auth params", authParamsError);
                return;
              }

              // 4. Get the org params
              const { data: orgParams, error: orgParamsError } =
                await supabaseServer.getOrganization(authParams);

              if (orgParamsError || !orgParams) {
                console.error("Error getting organization", orgParamsError);
                return;
              }

              // 5. Log the session
              const result = await loggable.log(
                {
                  s3Manager: new S3Manager(
                    new S3Client(
                      process.env.S3_ACCESS_KEY ?? "",
                      process.env.S3_SECRET_KEY ?? "",
                      process.env.S3_ENDPOINT ?? "",
                      process.env.S3_BUCKET_NAME ?? "",
                      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ??
                        "us-west-2"
                    )
                  ),
                  kafkaProducer: new KafkaProducer(),
                },
                authParams,
                orgParams,
                requestWrapper.heliconeHeaders
              );

              if (result.error) {
                console.error("Error logging WebSocket session:", result.error);
              }
            } catch (error) {
              console.error("Error handling socket session:", error);
            }
          }
        },
      });
    });
  });
}

/**
 * Links two WebSocket connections (client and target) by forwarding messages and handling events.
 * Sets up error handling, close events, and bidirectional message forwarding with event callbacks.
 */
async function linkWebSocket({
  clientWs,
  targetWs,
  on,
}: {
  targetWs: WebSocket;
  clientWs: WebSocket;
  on: (
    messageType:
      | "open"
      | "message"
      | "close"
      | "error"
      | "ping"
      | "pong"
      | "unexpected-response",
    from: "client" | "target",
    data: any
  ) => Promise<void>;
}) {
  // ERROR EVENTS
  clientWs.on("error", (error) => {
    console.error("Client WebSocket error:", error);
    targetWs.close(1000, "Client connection error");
    on("error", "client", error);
  });
  targetWs.on("error", (error) => {
    console.error("Target WebSocket error:", error);
    clientWs.close(1000, "Target connection error");
    on("error", "target", error);
  });

  // CLOSE EVENTS
  let hasLogged = false; // Flag to prevent double logging\

  clientWs.on("close", async () => {
    if (!hasLogged) {
      hasLogged = true;
      await on("close", "client", "Client connection closed");
    }
    targetWs.close(1000, "Client connection closed");
  });
  targetWs.on("close", async () => {
    if (!hasLogged) {
      hasLogged = true;
      await on("close", "target", "Target connection closed");
    }
    clientWs.close(1000, "Target connection closed");
  });

  // MESSAGE EVENTS
  clientWs.on("message", async (data: ArrayBufferLike, isBinary: boolean) => {
    targetWs.send(data, { binary: isBinary });

    const dataCopy = Buffer.from(data);
    const message = isBinary ? dataCopy : dataCopy.toString("utf-8");
    await on("message", "client", message.toString());
  });
  targetWs.on("message", async (data: ArrayBufferLike, isBinary: boolean) => {
    clientWs.send(data, { binary: isBinary });

    const dataCopy = Buffer.from(data);
    const message = isBinary ? dataCopy : dataCopy.toString("utf-8");
    await on("message", "target", message.toString());
  });
}
