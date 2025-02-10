import { LlmSchema, Message } from "../../types";
import { MapperFn } from "../types";

interface RealtimeMessage {
  type: string;
  content: {
    type: string; // "response.created", "response.done", "response.audio_transcript.delta", "session.update"
    response?: {
      object: string; // "ex: "realtime.response"
      modalities?: string[]; // ex: ["text", "audio"]
      instructions?: string;
      output?: {
        type: string; // "message" or "function_call"
        id: string; // ex: "item_AzRaB38BlG1R3MJ1Ddevm"
        object: string; // "ex: "realtime.item"
        // Message specific items
        content?: {
          type: string; // "text" or "audio"
          text?: string; // Text output
          transcript?: string; // Audio output
        }[];
        // Function call specific items
        call_id: string; // ex: "call_123"
        name: string; // ex: "get_weather"
        arguments: string; // ex: '{"location": "San Francisco"}'
      }[];
    };
    event_id?: string;
    output?: any[];
    delta?: string;
  };
  timestamp: string;
  from: "client" | "target";
}

const getRequestMessages = (request: any): Message[] => {
  if (!request.messages?.length) return [];

  return request.messages.map((msg: RealtimeMessage) => {
    let content;
    if (msg.type === "session.update") {
      content = JSON.stringify(msg);
    } else {
      content =
        msg.content?.response?.instructions ||
        msg.content?.response?.output?.[0]?.content?.[0]?.transcript ||
        (Array.isArray(msg.content?.response?.output)
          ? JSON.stringify(msg.content?.response?.output)
          : JSON.stringify(msg.content));
    }

    return {
      content,
      role: msg.from === "client" ? "user" : "assistant",
      _type: "message",
      timestamp: msg.timestamp,
      modality: msg.content?.response?.modalities?.[0] || "text",
    };
  });
};

const getRequestText = (requestBody: any): string => {
  try {
    if (!requestBody?.messages?.length) return "";

    // Get all user messages and their instructions
    const userMessages = requestBody.messages
      .filter((msg: RealtimeMessage) => msg.from === "client")
      .map((msg: RealtimeMessage) => msg.content?.response?.instructions)
      .filter(Boolean)
      .join("\n");

    return userMessages || "Realtime conversation";
  } catch (error) {
    console.error("Error parsing request text:", error);
    return "error_parsing_request";
  }
};

const getResponseText = (
  responseBody: any,
  statusCode: number = 200
): string => {
  if (!responseBody || statusCode === 0) return "";

  if ("error" in responseBody) {
    return (
      responseBody.error?.heliconeMessage ||
      responseBody.error?.message ||
      "Error occurred"
    );
  }

  try {
    if (![200, 201, -3].includes(statusCode)) {
      return responseBody?.error?.message || responseBody?.helicone_error || "";
    }

    // Find the last "response.done" message
    const doneMessage = responseBody.messages?.findLast(
      (msg: RealtimeMessage) => msg.content?.type === "response.done"
    );

    if (doneMessage) {
      const output = doneMessage.content?.response?.output;
      if (output?.length > 0) {
        const transcripts = output
          .map((item: any) =>
            item.content
              ?.filter((c: any) => c.type === "audio" || c.type === "text")
              ?.map((c: any) => c.transcript || c.text)
              .join(" ")
          )
          .filter(Boolean)
          .join("\n");

        return transcripts || JSON.stringify(output);
      }
    }

    // Fallback to concatenating all assistant messages
    const assistantMessages = responseBody.messages
      ?.filter((msg: RealtimeMessage) => msg.from === "target")
      ?.map((msg: RealtimeMessage) => {
        if (msg.content?.type === "response.audio_transcript.delta") {
          return msg.content.delta;
        }
        return null;
      })
      .filter(Boolean)
      .join("");

    return assistantMessages || JSON.stringify(responseBody);
  } catch (error) {
    console.error("Error parsing response text:", error);
    return "error_parsing_response";
  }
};

const getLLMSchemaResponse = (response: any) => {
  if ("error" in response) {
    return {
      error: {
        heliconeMessage:
          response.error?.heliconeMessage ||
          response.error?.message ||
          "Error occurred",
      },
    };
  }

  const messages: Message[] = [];
  let currentMessage: Partial<Message> = {};
  let hasFinalResponse = false;

  response.messages?.forEach((msg: RealtimeMessage) => {
    if (msg.content?.type === "response.done") {
      const output = msg.content.response?.output;
      if (output?.length) {
        // Clear any partial message since we have the final response
        currentMessage = {};
        hasFinalResponse = true;

        output.forEach((item: any) => {
          if (item.type === "function_call") {
            messages.push({
              role: "assistant",
              _type: "functionCall",
              tool_calls: [
                {
                  name: item.name,
                  arguments: JSON.parse(item.arguments || "{}"),
                },
              ],
              timestamp: msg.timestamp,
            });
          } else {
            messages.push({
              content: undefined,
              contentArray: item.content,
              role: "assistant",
              _type: "contentArray",
              timestamp: msg.timestamp,
            });
          }
        });
      }
    } else if (
      !hasFinalResponse &&
      msg.content?.type === "response.audio_transcript.delta"
    ) {
      if (!currentMessage.content) {
        currentMessage = {
          content: msg.content.delta,
          role: "assistant",
          _type: "message",
          timestamp: msg.timestamp,
        };
      } else {
        currentMessage.content += msg.content.delta;
      }
    } else if (msg.content?.type === "response.created") {
      if (currentMessage.content) {
        messages.push(currentMessage as Message);
        currentMessage = {};
      }
    }
  });

  // Only add the current message if we don't have a final response
  if (!hasFinalResponse && currentMessage.content) {
    messages.push(currentMessage as Message);
  }

  return {
    messages: messages.sort(
      (a, b) =>
        new Date(a.timestamp || 0).getTime() -
        new Date(b.timestamp || 0).getTime()
    ),
    model: response.model,
  };
};

export const mapRealtimeRequest: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const requestMessages = getRequestMessages(request);
  const responseData = getLLMSchemaResponse(response);

  const llmSchema: LlmSchema = {
    request: {
      model: model || request?.model || "gpt-4o-realtime",
      messages: requestMessages,
      stream: true,
    },
    response: responseData?.error
      ? responseData
      : {
          messages: responseData?.messages || [],
          model: responseData?.model || model || request?.model,
        },
  };

  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(response, statusCode),
      concatenatedMessages: [
        ...requestMessages,
        ...(responseData?.messages || []),
      ],
    },
  };
};
