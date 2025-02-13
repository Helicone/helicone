import { LlmSchema, Message } from "../../types";
import { MapperFn } from "../types";

export const mapRealtimeRequest: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const requestMessages = mapRealtimeMessages(request?.messages || []);
  const responseMessages = mapRealtimeMessages(response?.messages || []);
  const allMessages = [...requestMessages, ...responseMessages];

  const llmSchema: LlmSchema = {
    request: {
      model: model || request?.model || "gpt-4o-realtime",
      messages: requestMessages,
      stream: true,
    },
    response: {
      messages: responseMessages,
    },
  };

  return {
    schema: llmSchema,
    preview: {
      request: requestMessages[0].content || "",
      response: responseMessages[0].content || "",
      concatenatedMessages: allMessages,
    },
  };
};

interface SocketMessage {
  type: string; // "message" or "error"
  from: "client" | "target"; // Origin of the message
  timestamp: string; // ISO string
  content: RealtimeMessage;
}
type RealtimeMessage = {
  type: // client
  | "session.update" // SHOW: Count as user message
    | "input_audio_buffer.append"
    | "input_audio_buffer.commit"
    | "input_audio_buffer.clear"
    | "conversation.item.create"
    | "conversation.item.truncate"
    | "conversation.item.delete"
    | "response.create"
    | "response.cancel"
    // target
    | "error"
    | "session.created"
    | "session.updated"
    | "conversation.created"
    | "conversation.item.created"
    | "conversation.item.input_audio_transcription.failed"
    | "conversation.item.input_audio_transcription.completed" // SHOW: Count as user message (audio)
    | "conversation.item.truncated"
    | "conversation.item.deleted"
    | "input_audio_buffer.committed"
    | "input_audio_buffer.cleared"
    | "input_audio_buffer.speech_started"
    | "input_audio_buffer.speech_stopped"
    | "response.created" // SHOW: Count as user message (text)
    | "response.done" // SHOW: Count as assistant message (audio or text depending on response.output.content type "text" or "audio")
    | "response.output_item.added"
    | "response.output_item.done"
    | "response.content_part.added"
    | "response.content_part.done"
    | "response.text.delta"
    | "response.text.done"
    | "response.audio_transcript.delta"
    | "response.audio_transcript.done"
    | "response.audio.delta"
    | "response.audio.done"
    | "response.function_call_arguments.delta"
    | "response.function_call_arguments.done"
    | "rate_limits.updated";

  response?: {
    object: string; // "ex: "realtime.response"
    modalities?: string[]; // ex: ["text", "audio"]
    instructions?: string;
    output?: {
      type: string; // "message", "function_call", or "function_call_output"
      id: string; // ex: "item_AzRaB38BlG1R3MJ1Ddevm"
      object: string; // "ex: "realtime.item"
      // Message specific items
      content?: {
        type: string; // "text" or "audio"
        text?: string; // Text output
        audio?: string; // Audio output in base64
        transcript?: string; // Audio output in transcribed text
      }[];
      // Function call specific items
      name?: string; // ex: "get_weather"
      call_id?: string; // ex: "call_123"
      arguments?: string; // ex: '{"location": "San Francisco"}'
      output?: any;
    }[];
  };
  session?: {}; // With session.created, session.update, session.updated
  item?: {
    // With converstaion.item.create
    type: string; // "function_call_output"
    call_id: string; // ex: "call_123"
    output: string; // ex: '{"temperature": 72, "conditions": "sunny", "location": "San Francisco"}'
  };
};
const mapRealtimeMessages = (messages: SocketMessage[]): Message[] => {
  if (!messages?.length) return [];

  return messages
    .map((msg: SocketMessage) => {
      // Only process specific message types that we want to show
      const output = msg.content?.response?.output?.[0];
      const item = msg.content?.item;

      switch (msg.content.type) {
        case "response.create":
          // -> User: Text
          return {
            role: "user",
            _type: "text",
            content: msg.content?.response?.instructions,
            timestamp: msg.timestamp,
          };

        case "conversation.item.input_audio_transcription.completed":
          // -> User: Audio
          return {
            role: "user",
            _type: "audio",
            content:
              msg.content.response?.output?.[0]?.content?.[0]?.transcript,
            timestamp: msg.timestamp,
          };

        case "response.done":
          if (output?.content?.[0]) {
            // -> Assistant: Text or Audio
            return {
              role: "assistant",
              _type: output?.content?.[0]?.text ? "text" : "audio",
              content:
                output?.content?.[0]?.text || output?.content?.[0]?.transcript,
              timestamp: msg.timestamp,
            };
          }

          if (output?.type === "function_call") {
            // -> Assistant: Function call
            return {
              role: "assistant",
              _type: "functionCall",
              tool_call_id: output.output?.call_id,
              tool_calls: [
                {
                  name: output.name,
                  arguments: JSON.parse(output.arguments || "{}"),
                },
              ],
              timestamp: msg.timestamp,
            };
          }
          break;

        case "conversation.item.create":
          if (item?.type === "function_call_output") {
            // -> Assistant: Function call output
            return {
              role: "user",
              _type: "function",
              tool_call_id: item?.call_id,
              content: item?.output,
              timestamp: msg.timestamp,
            };
          }
          break;

        case "session.update":
          // -> User: Session update
          return {
            role: "user",
            _type: "message",
            content: JSON.stringify(msg.content),
            timestamp: msg.timestamp,
          };

        default:
          return null;
      }
    })
    .filter((msg) => msg !== null)
    .sort(
      (a, b) =>
        new Date(a?.timestamp || 0).getTime() -
        new Date(b?.timestamp || 0).getTime()
    ) as Message[];
};
