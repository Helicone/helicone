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
<<<<<<< HEAD
=======
  // ERORRS
>>>>>>> realtime-jawn-semi-working
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
<<<<<<< HEAD
=======

>>>>>>> realtime-jawn-semi-working
  targetWs.on("close", () => {
    clientWs.close(1000, "Target connection closed");
    on("close", "target", "Target connection closed");
  });
  clientWs.on("close", () => {
    targetWs.close(1000, "Client connection closed");
    on("close", "client", "Client connection closed");
  });
<<<<<<< HEAD
=======

>>>>>>> realtime-jawn-semi-working
  clientWs.on("message", (data: ArrayBufferLike, isBinary: boolean) => {
    const dataCopy = Buffer.from(data);

    targetWs.send(data, { binary: isBinary });
    const message = isBinary ? dataCopy : dataCopy.toString("utf-8");
    on("message", "client", message.toString());
  });
<<<<<<< HEAD
=======

>>>>>>> realtime-jawn-semi-working
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
              content: JSON.parse(data),
              timestamp: new Date().toISOString(),
              from,
            });
          } else if (messageType === "close") {
            console.log("Messages:", messages);
            const stitchedMessages = stitchMessages(
              messages.map((message) => message.content)
            );
            console.log("Stitched messages:", stitchedMessages);
          }
        },
      });
    });
  });
}

// HI TINO EVERYTHING BELOW HERE IS NOT WELL TESTED AND WAS CREATED BY CURSOR
interface BaseMessage {
  type: string;
  event_id?: string;
  timestamp: string;
}

interface SessionCreatedMessage extends BaseMessage {
  type: "session.created";
  session: {
    id: string;
    object: string;
    model: string;
    expires_at: number;
    modalities: string[];
    instructions: string;
    voice: string;
    turn_detection: any;
    input_audio_format: string;
    output_audio_format: string;
    input_audio_transcription: any;
    tool_choice: string;
    temperature: number;
    max_response_output_tokens: string;
    client_secret: any;
    tools: any[];
  };
}

interface ResponseCreateMessage extends BaseMessage {
  type: "response.create";
  response: {
    modalities: string[];
    instructions: string;
  };
}

interface AudioTranscriptDeltaMessage extends BaseMessage {
  type: "response.audio_transcript.delta";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

interface AudioTranscriptDoneMessage extends BaseMessage {
  type: "response.audio_transcript.done";
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  transcript: string;
}

interface RateLimitsMessage extends BaseMessage {
  type: "rate_limits.updated";
  rate_limits: Array<{
    name: string;
    limit: number;
    remaining: number;
    reset_seconds: number;
  }>;
}

interface ResponseDoneMessage extends BaseMessage {
  type: "response.done";
  response: {
    object: string;
    id: string;
    status: string;
    output: any[];
    conversation_id: string;
    modalities: string[];
    voice: string;
    output_audio_format: string;
    temperature: number;
    max_output_tokens: string;
    usage: any;
    metadata: any;
  };
}

type WebSocketMessage =
  | SessionCreatedMessage
  | ResponseCreateMessage
  | AudioTranscriptDeltaMessage
  | AudioTranscriptDoneMessage
  | RateLimitsMessage
  | ResponseDoneMessage;

function stitchMessages(messages: WebSocketMessage[]) {
  const stitchedMessages: {
    type: string;
    content: any;
    timestamp: string;
    from: "client" | "target";
  }[] = [];

  let currentMessage: any = null;
  let currentTranscript = "";

  for (const message of messages) {
    const type = message.type;

    // Handle session creation
    if (type === "session.created") {
      stitchedMessages.push({
        type: "session.created",
        content: message.session,
        timestamp: message.timestamp,
        from: "target",
      });
      continue;
    }

    // Handle response creation
    if (type === "response.create") {
      currentMessage = {
        type: "response",
        content: message.response,
        timestamp: message.timestamp,
        from: "target",
      };
      continue;
    }

    // Handle audio transcript deltas
    if (type === "response.audio_transcript.delta") {
      currentTranscript += message.delta;
      continue;
    }

    // Handle completed transcript
    if (type === "response.audio_transcript.done") {
      if (currentMessage) {
        currentMessage.content.transcript = message.transcript;
        stitchedMessages.push(currentMessage);
        currentMessage = null;
        currentTranscript = "";
      }
      continue;
    }

    // Handle rate limits
    if (type === "rate_limits.updated") {
      stitchedMessages.push({
        type: "rate_limits",
        content: message.rate_limits,
        timestamp: message.timestamp,
        from: "target",
      });
      continue;
    }

    // Handle response completion
    if (type === "response.done") {
      stitchedMessages.push({
        type: "response.completed",
        content: message.response,
        timestamp: message.timestamp,
        from: "target",
      });
      continue;
    }
  }

  return stitchedMessages;
}
