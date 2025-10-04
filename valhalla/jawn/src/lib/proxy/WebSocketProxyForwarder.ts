import internal from "stream";
import { WebSocket, WebSocketServer } from "ws";
import { SocketMessage } from "../../types/realtime";
import { safeJsonParse } from "../../utils/helpers";
import { HeliconeQueueProducer } from "../clients/HeliconeQueueProducer";
import { RequestWrapper } from "../requestWrapper/requestWrapper";
import { getHeliconeAuthClient } from "../../packages/common/auth/server/AuthClientFactory";
import { S3Client } from "../shared/db/s3Client";
import { S3Manager } from "./S3Manager";
import { handleSocketSession } from "./WebSocketProxyRequestHandler";

/* -------------------------------------------------------------------------- */
// NOTE: "failed: Invalid frame header" is currently being experienced after first minute on local -> local connection causing client side drop
// TODO: If this problem occurs in production, we will have to dig further.
/* -------------------------------------------------------------------------- */

const REALTIME_LOGGING_INTERVAL = 15000; // 15 seconds

// Create a WebSocket server to handle the upgrade
const wss = new WebSocketServer({ noServer: true });

// Helper function to log the current session
async function logCurrentSession(
  loggedRequestId: string | null,
  messages: SocketMessage[],
  requestWrapper: RequestWrapper,
): Promise<{
  requestId: string | null;
}> {
  try {
    const authClient = getHeliconeAuthClient();
    // 1. Create loggable object
    const { loggable } = await handleSocketSession(
      messages,
      requestWrapper,
      loggedRequestId ?? undefined,
    );
    const requestId = await loggable.getRequestId();

    // 2. Get the auth
    const { data: auth, error: authError } = await requestWrapper.auth();
    if (authError !== null) {
      console.error("Error getting auth", authError);
      return { requestId };
    }

    // 3. Get the auth params
    const { data: authParams, error: authParamsError } =
      await authClient.authenticate(auth);
    if (authParamsError || !authParams) {
      console.error("Error getting auth params", authParamsError);
      return { requestId };
    }

    // 4. Get the org params
    const { data: orgParams, error: orgParamsError } =
      await authClient.getOrganization(authParams);

    if (orgParamsError || !orgParams) {
      console.error("Error getting organization", orgParamsError);
      return { requestId };
    }
    // 5. Log the session
    const result = await loggable.log(
      {
        s3Manager: new S3Manager(
          new S3Client(
            process.env.S3_ACCESS_KEY || undefined,
            process.env.S3_SECRET_KEY || undefined,
            process.env.S3_ENDPOINT ?? "",
            process.env.S3_BUCKET_NAME ?? "",
            (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2",
          ),
        ),
        kafkaProducer: new HeliconeQueueProducer(),
      },
      authParams,
      orgParams,
      requestWrapper.heliconeHeaders,
    );

    if (result.error) {
      console.error("Error logging WebSocket session:", result.error);
    }

    return { requestId };
  } catch (error) {
    console.error("Error handling socket session:", error);
    return { requestId: null };
  }
}

export function webSocketProxyForwarder(
  requestWrapper: RequestWrapper,
  socket: internal.Duplex,
  head: Buffer,
) {
  const req = requestWrapper.getRequest();

  wss.handleUpgrade(req, socket, head, async (clientWs) => {
    // Keep message events in memory for logging.
    const messages: SocketMessage[] = [];

    // Buffer to store early incoming messages from the client.
    const messageBuffer: Array<{ data: ArrayBufferLike; isBinary: boolean }> =
      [];

    let requestId: string | null = null;
    let loggingInterval: NodeJS.Timeout | null = null;

    // Attach a temporary listener to capture messages until the target is ready.
    const tempListener = (data: ArrayBufferLike, isBinary: boolean) => {
      messageBuffer.push({ data, isBinary });
      // Also log the message
      const dataCopy = Buffer.from(data);
      // Always convert to string for message logging
      const message = dataCopy.toString("utf-8");
      const content = safeJsonParse(message) ?? {};
      messages.push({
        type: "message",
        content,
        timestamp: new Date().toISOString(),
        from: "client",
      });
    };
    clientWs.on("message", tempListener);

    // Create a new WebSocket connection depending on the endpoint
    const searchParams = new URLSearchParams(requestWrapper.url.search);
    const azureResource = searchParams.get("resource");
    const azureDeployment = searchParams.get("deployment");
    const azureApiVersion = "2024-10-01-preview"; // 2024-12-17 or 2024-10-01-preview
    const isAzure = azureResource && azureDeployment;
    const targetUrl = isAzure
      ? `wss://${azureResource}.openai.azure.com/openai/realtime?api-version=${azureApiVersion}&deployment=${azureDeployment}`
      : `wss://api.openai.com/v1/realtime${requestWrapper.url.search}`;

    const openaiWs = new WebSocket(targetUrl, {
      headers: {
        ...(isAzure
          ? {
              "api-key": requestWrapper.getAuthorization()?.split(" ")[1],
            }
          : {
              Authorization: requestWrapper.getAuthorization(),
            }),
        "OpenAI-Beta": "realtime=v1",
      },
    });

    openaiWs.on("error", (error) => {
      console.error(
        `WebSocket connection error: ${error.message} | Type: ${
          error.name
        } | Code: ${(error as any).code || "N/A"} | Stack: ${
          error.stack?.split("\n")[1]?.trim() || "N/A"
        } | Target URL: ${targetUrl} | Headers: ${JSON.stringify({
          Authorization: requestWrapper.getAuthorization()
            ? "Bearer [REDACTED]"
            : "None",
          "OpenAI-Beta": "realtime=v1",
        })} | Request path: ${
          requestWrapper.url.pathname
        } | Azure params: resource=${azureResource}, deployment=${azureDeployment} | Timestamp: ${new Date().toISOString()}`,
      );
    });

    openaiWs.on("open", async () => {
      // Remove the temporary listener and flush any buffered messages.
      clientWs.off("message", tempListener);
      messageBuffer.forEach(({ data, isBinary }) => {
        openaiWs.send(data, { binary: isBinary });
      });

      loggingInterval = setInterval(async () => {
        const { requestId: newRequestId } = await logCurrentSession(
          requestId,
          [...messages],
          requestWrapper,
        );
        requestId = newRequestId;
      }, REALTIME_LOGGING_INTERVAL);

      // Link the WebSocket connections, with a callback for events.
      linkWebSocket({
        clientWs,
        targetWs: openaiWs,
        on: async (messageType, from, data) => {
          /* -------------------------------------------------------------------------- */
          /*                            Append Message Events                           */
          /* -------------------------------------------------------------------------- */
          if (messageType === "message") {
            const content = safeJsonParse(data as string) ?? {};
            messages.push({
              type: messageType,
              content,
              timestamp: new Date().toISOString(),
              from,
            });
          } else if (messageType === "close") {
            /* -------------------------------------------------------------------------- */
            /*                            Handle Closing Event                            */
            /* -------------------------------------------------------------------------- */
            if (loggingInterval) {
              clearInterval(loggingInterval);
            }
            const { requestId: newRequestId } = await logCurrentSession(
              requestId,
              [...messages],
              requestWrapper,
            );
            requestId = newRequestId;
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
    data: string | Error,
  ) => Promise<void>;
}) {
  // MESSAGE EVENTS
  clientWs.on("message", async (data: ArrayBufferLike, isBinary: boolean) => {
    targetWs.send(data, { binary: isBinary });

    const dataCopy = Buffer.from(data);
    // Always convert to string for consistency when sending to the callback
    const message = dataCopy.toString("utf-8");
    await on("message", "client", message);
  });
  targetWs.on("message", async (data: ArrayBufferLike, isBinary: boolean) => {
    clientWs.send(data, { binary: isBinary });

    const dataCopy = Buffer.from(data);
    // Always convert to string for consistency when sending to the callback
    const message = dataCopy.toString("utf-8");
    await on("message", "target", message);
  });

  // CLOSE EVENTS
  let hasLogged = false; // Flag to prevent double logging

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
}
