import crypto from "crypto";
import { Headers } from "node-fetch";
import { WebSocket, WebSocketServer } from "ws";
import { Provider } from "../../packages/llm-mapper/types";
import { RequestWrapper } from "../requestWrapper/requestWrapper";

/* -------------------------------------------------------------------------- */
// NOTE: "failed: Invalid frame header" is currently being experienced after first minute on local -> local connection causing client side drop
// TODO: If this problem occurs in production, we will have to dig in further.
/* -------------------------------------------------------------------------- */
export async function webSocketProxyForwarder(
  requestWrapper: RequestWrapper,
  provider: Provider
) {
  if (provider !== "OPENAI") {
    console.log("Provider", provider);
    throw new Error("Only OpenAI WebSocket proxy is supported");
  }

  const req = requestWrapper.getRequest();
  const socket = req.socket;
  const head = Buffer.alloc(0);

  // Create a WebSocket server to handle the upgrade
  const wss = new WebSocketServer({ noServer: true });

  return new Promise((resolve, reject) => {
    wss.handleUpgrade(req, socket, head, async (clientWs) => {
      // 1. Extract API key from protocols
      const protocols =
        req.headers["sec-websocket-protocol"]
          ?.split(",")
          .map((p) => p.trim()) || [];
      const apiKeyProtocol = protocols.find((p) =>
        p.startsWith("openai-insecure-api-key.")
      );
      const heliconeAuthProtocol = protocols.find((p) =>
        p.startsWith("Helicone-Auth.")
      );
      const apiKey = apiKeyProtocol?.split(".")[1];
      const heliconeAuth = heliconeAuthProtocol?.split(".")[1];

      if (!apiKey) {
        clientWs.close(1002, "Missing API key");
        reject(new Error("Missing API key"));
        return;
      }

      if (!heliconeAuth) {
        clientWs.close(1002, "Missing Helicone auth key");
        reject(new Error("Missing Helicone auth key"));
        return;
      }

      // Add Helicone auth to the request wrapper
      requestWrapper.remapHeaders(
        new Headers({
          ...Object.fromEntries(requestWrapper.getHeaders()),
        })
      );

      // Set up heliconeAuthV2 field
      requestWrapper.heliconeHeaders.heliconeAuthV2 = {
        token: `Bearer ${heliconeAuth}`,
        _type: "bearer",
      };

      // 2. Connect to OpenAI
      const targetUrl =
        "wss://api.openai.com/v1/realtime" + requestWrapper.url.search;
      const openaiWs = new WebSocket(
        targetUrl,
        ["realtime", "openai-beta.realtime-v1"],
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      let clientClosed = false;
      let openaiClosed = false;
      const startTime = new Date();
      let firstMessageTime: Date | null = null;
      let lastMessageTime: Date | null = null;
      const messages: { type: string; content: any; timestamp: string }[] = [];

      // 3. Set up Error Handlers
      clientWs.on("error", (error) => {
        console.error("Client WebSocket error:", error);
        clientClosed = true;
        if (!openaiClosed) {
          openaiWs.close(1000, "Client connection error");
        }
      });

      openaiWs.on("error", (error) => {
        console.error("OpenAI WebSocket error:", error);
        openaiClosed = true;
        if (!clientClosed) {
          clientWs.close(1000, "Internal error");
        }
        reject(error);
      });

      // 4. Set up Close Handlers
      clientWs.on("close", (code, reason) => {
        console.log("Client connection closed:", {
          code,
          reason: reason.toString(),
        });
        clientClosed = true;
        if (!openaiClosed) {
          openaiWs.close(1000, reason);
        }
      });

      openaiWs.on("close", async (code, reason) => {
        console.log("OpenAI connection closed:", {
          code,
          reason: reason.toString(),
        });
        openaiClosed = true;
        if (!clientClosed) {
          clientWs.close(1000, reason);
        }

        // Log WebSocket session data
        const sessionData = {
          requestId: crypto.randomUUID(),
          userId: requestWrapper.heliconeHeaders.userId,
          startTime,
          endTime: lastMessageTime ?? new Date(),
          duration: lastMessageTime
            ? lastMessageTime.getTime() - startTime.getTime()
            : 0,
          timeToFirstToken: firstMessageTime
            ? firstMessageTime.getTime() - startTime.getTime()
            : null,
          totalMessages: messages.length,
          clientMessages: messages.filter((msg) => msg.type === "client")
            .length,
          serverMessages: messages.filter((msg) => msg.type === "server")
            .length,
          path: requestWrapper.url.href,
          targetUrl,
          provider,
          modelOverride: requestWrapper.heliconeHeaders.modelOverride,
          properties: requestWrapper.heliconeHeaders.heliconeProperties,
        };

        console.log("WebSocket session completed:", sessionData);

        // TODO: Implement proper database logging when database infrastructure is ready
        // For now, we just log the session data to console
      });

      // 5. Set up Open Handlers
      openaiWs.on("open", () => {
        console.log("OpenAI connection established");

        // A. Forward messages in both directions
        clientWs.on("message", (data) => {
          if (openaiClosed) {
            console.warn(
              "Attempted to send message to closed OpenAI connection"
            );
            return;
          }
          try {
            const parsed = JSON.parse(data.toString());
            messages.push({
              type: "client",
              content: parsed,
              timestamp: new Date().toISOString(),
            }); // Log client message
            openaiWs.send(JSON.stringify(parsed));
          } catch (e) {
            console.error("Invalid JSON from client:", e);
            clientWs.close(1007, "Invalid JSON message");
          }
        });
        openaiWs.on("message", (data) => {
          if (clientClosed) {
            console.warn(
              "Attempted to send message to closed client connection"
            );
            return;
          }
          try {
            const parsed = JSON.parse(data.toString());
            if (!firstMessageTime) {
              firstMessageTime = new Date();
            }
            lastMessageTime = new Date();
            messages.push({
              type: "server",
              content: parsed,
              timestamp: new Date().toISOString(),
            }); // Log OpenAI message
            clientWs.send(JSON.stringify(parsed));
          } catch (e) {
            console.error("Invalid JSON from OpenAI:", e);
            console.error("Raw message:", data.toString());
          }
        });

        // B. Resolve the Promise
        resolve(true);
      });
    });
  });
}
