/* -------------------------------------------------------------------------- */
/*                               SOCKET MESSAGES                              */
/* -------------------------------------------------------------------------- */
export type SocketMessage = {
  type: string;
  content: any;
  timestamp: string;
  from: "client" | "target";
};

/* -------------------------------------------------------------------------- */
/*                              REALTIME MESSAGES                             */
/* -------------------------------------------------------------------------- */
export type BaseContentPart = {
  type: string;
};

export type TextContentPart = BaseContentPart & {
  type: "text";
  text: string;
};

export type InputTextContentPart = BaseContentPart & {
  type: "input_text";
  text: string;
};

export type InputAudioContentPart = BaseContentPart & {
  type: "input_audio";
  audio: string; // base64 encoded audio
  transcript?: string;
};

export type OutputAudioContentPart = BaseContentPart & {
  type: "output_audio";
  audio: string; // base64 encoded audio
  transcript?: string;
};

export type ContentPart =
  | TextContentPart
  | InputTextContentPart
  | InputAudioContentPart
  | OutputAudioContentPart;

export type MessageRole = "user" | "assistant" | "system" | "function";

export type MessageStatus = "in_progress" | "completed" | "error";

export type Message = {
  id: string;
  object: "realtime.item";
  type: "message";
  status: MessageStatus;
  role: MessageRole;
  content: ContentPart[];
};

export type FunctionCall = {
  id: string;
  object: "realtime.item";
  type: "function_call";
  status: MessageStatus;
  function: {
    name: string;
    arguments: string; // JSON string
  };
};

export type FunctionCallResponse = {
  id: string;
  object: "realtime.item";
  type: "function_call_response";
  status: MessageStatus;
  function: {
    name: string;
    response: string; // JSON string
  };
};

export type RealtimeMessage = Message | FunctionCall | FunctionCallResponse;

/* -------------------------------------------------------------------------- */
/*                            OPENAI CHAT MESSAGES                            */
/* -------------------------------------------------------------------------- */
export type OpenAIChatMessage = {
  role: MessageRole;
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
};

/**
 * Helper function to convert socket messages to Realtime API messages
 * @param socketMessages Array of socket messages
 * @returns Array of Realtime API messages
 */
export function socketToRealtimeMessages(
  socketMessages: SocketMessage[]
): RealtimeMessage[] {
  return socketMessages
    .filter((m) => m.type === "message" && m.content.type)
    .map((m) => {
      const base = {
        id: crypto.randomUUID(),
        object: "realtime.item" as const,
        type: m.content.type as
          | "message"
          | "function_call"
          | "function_call_response",
        status: "completed" as const,
      };

      if (m.content.type === "message") {
        return {
          ...base,
          type: "message" as const,
          role:
            m.from === "client" ? ("user" as const) : ("assistant" as const),
          content: [
            {
              type: m.content.content?.type || "text",
              ...(m.content.content?.text && {
                text: m.content.content.text,
              }),
              ...(m.content.content?.audio && {
                audio: m.content.content.audio,
              }),
              ...(m.content.content?.transcript && {
                transcript: m.content.content.transcript,
              }),
            },
          ],
        };
      } else if (m.content.type === "function_call") {
        return {
          ...base,
          type: "function_call" as const,
          function: {
            name: m.content.name || "",
            arguments: m.content.arguments || "{}",
          },
        };
      } else if (m.content.type === "function_call_response") {
        return {
          ...base,
          type: "function_call_response" as const,
          function: {
            name: m.content.name || "",
            response: m.content.response || "{}",
          },
        };
      } else {
        // Default case - treat as a message
        return {
          ...base,
          type: "message" as const,
          role:
            m.from === "client" ? ("user" as const) : ("assistant" as const),
          content: [
            {
              type: "text",
              text: JSON.stringify(m.content),
            },
          ],
        };
      }
    });
}

/**
 * Helper function to convert Realtime API messages to OpenAI chat format
 * @param messages Array of Realtime API messages
 * @returns Array of OpenAI chat format messages
 */
export function realtimeToChatMessages(
  messages: (Message | FunctionCall | FunctionCallResponse)[]
): OpenAIChatMessage[] {
  return messages.map((msg): OpenAIChatMessage => {
    if (msg.type === "message") {
      // For message type, concatenate all text content
      const content = msg.content
        .map((part) => {
          switch (part.type) {
            case "text":
            case "input_text":
              return part.text;
            case "input_audio":
            case "output_audio":
              return part.transcript || "";
            default:
              return "";
          }
        })
        .filter((text) => text.length > 0)
        .join("\n");

      return {
        role: msg.role,
        content,
      };
    } else if (msg.type === "function_call") {
      return {
        role: "assistant",
        content: "",
        function_call: {
          name: msg.function.name,
          arguments: msg.function.arguments,
        },
      };
    } else {
      // Function call response
      return {
        role: "function",
        name: msg.function.name,
        content: msg.function.response,
      };
    }
  });
}
