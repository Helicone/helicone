import { LlmSchema, Message } from "../../types";
import { isJSON } from "../../utils/contentHelpers";
import { MapperFn } from "../types";

interface SocketMessage {
  type: string; // "message" or "error"
  from: "client" | "target"; // Origin of the message
  timestamp: string; // ISO string
  content: RealtimeMessage;
}
type RealtimeMessage = {
  type: // client
  | "session.update" // SHOW: Count as user message
    | "input_audio_buffer.append" // SHOW: Combine with others to get full user audio data
    | "input_audio_buffer.commit"
    | "input_audio_buffer.clear"
    | "conversation.item.create"
    | "conversation.item.truncate"
    | "conversation.item.delete"
    | "response.create" // SHOW: Count as user message (text)
    | "response.cancel"
    // target
    | "error"
    | "session.created"
    | "session.updated"
    | "conversation.created"
    | "conversation.item.created" // SHOW: Count as user or assistant message (audio or text)
    | "conversation.item.input_audio_transcription.failed"
    | "conversation.item.input_audio_transcription.completed" // SHOW: Count as user message (audio)
    | "conversation.item.truncated"
    | "conversation.item.deleted" // USE: Find and delete the item with this id, maybe still show deleted items as super truncated messages?
    | "input_audio_buffer.committed"
    | "input_audio_buffer.cleared"
    | "input_audio_buffer.speech_started"
    | "input_audio_buffer.speech_stopped"
    | "response.created"
    | "response.done" // SHOW: Count as assistant message (audio or text depending on response.output.content type "text" or "audio")
    | "response.output_item.added"
    | "response.output_item.done"
    | "response.content_part.added"
    | "response.content_part.done"
    | "response.text.delta"
    | "response.text.done"
    | "response.audio_transcript.delta"
    | "response.audio_transcript.done"
    | "response.audio.delta" // SHOW: Combine with others to get full assistant audio data
    | "response.audio.done"
    | "response.audio.combined" // Custom type for combined audio buffers (assistant audio)
    | "response.function_call_arguments.delta"
    | "response.function_call_arguments.done"
    | "rate_limits.updated"
    | "input_audio_buffer.combined"; // Custom type for combined audio buffers (user audio)

  // With type "response.create"
  response?: {
    object: string; // "ex: "realtime.response"
    modalities?: string[]; // ex: ["text", "audio"]
    instructions?: string;
    output?: {
      type: "message" | "function_call" | "function_call_output";
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
  // With type "session.created", "session.update", "session.updated"
  session?: {
    input_audio_format?: string; // "pcm16", "g711_ulaw", or "g711_alaw"
    input_audio_noise_reduction?: object | null; // Configuration for input audio noise reduction
    input_audio_transcription?: object | null; // Configuration for input audio transcription
    instructions?: string; // Default system instructions
    max_response_output_tokens?: number | "inf"; // Max output tokens, integer between 1-4096 or "inf"
    modalities?: string[]; // Set of modalities the model can respond with, e.g. ["text"] to disable audio
    model?: string; // The Realtime model used for this session
    output_audio_format?: string; // "pcm16", "g711_ulaw", or "g711_alaw"
    temperature?: number; // Sampling temperature, limited to [0.6, 1.2]
    tool_choice?: string; // "auto", "none", "required", or specify a function
    tools?: any[]; // Tools (functions) available to the model
    turn_detection?: object | null; // Configuration for turn detection
    voice?: string; // Voice model uses to respond (alloy, ash, ballad, coral, etc.)
  };
  // With type "conversation.item.create"
  item?: {
    id?: string; // ex: "msg_001"
    type: string; // "function_call_output" or "message"
    // For "function_call" and "function_call_output":
    name?: string; //  ex: "get_weather" (only for "function_call")
    call_id?: string; // ex: "call_123"
    output?: string; // ex: '{"temperature": 72, "conditions": "sunny", "location": "San Francisco"}'
    content?: {
      // For "message":
      type: string; // "input_audio" or other types
      text?: string; // For "input_text" type: Text input
      audio?: string; // For "input_audio" type: Base64 encoded audio
      transcript?: string; // For "input_audio" type: Transcribed text
    }[];
  };
  // With type "conversation.item.delete"
  event_id?: string; // ex: "event_901"
  item_id?: string; // ex: "msg_003"
  // With type "conversation.item.input_audio_transcription.completed"
  transcript?: string; // ex: "Hello, how are you?"
  // With type "input_audio_buffer.append" or "input_audio_buffer.combined"
  audio?: string; // Base64 encoded audio data (single chunk or combined chunks)
  // With type "response.audio.delta"
  delta?: string; // "Base64 encoded audio"
};

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
      request: requestMessages[0]?.content || "",
      response: responseMessages[0]?.content || "",
      concatenatedMessages: allMessages,
    },
  };
};


const combineAudioBuffers = (audioBuffer: SocketMessage[], audio_key: "audio" | "delta", type: RealtimeMessage["type"]) => {
  // When we hit a commit, we create a combined message from all appends in the current group
  const firstMsg = audioBuffer[0];
  const lastMsg = audioBuffer[audioBuffer.length - 1];

  // Properly combine audio buffers - this is safer than just joining strings
  // First, collect all base64 audio chunks
  const audioChunks = audioBuffer
    .map((m) => m.content[audio_key] || "")
    .filter((chunk) => chunk.length > 0);

  // If we have valid chunks, combine them
  let combinedAudio = audioChunks.join("");

  const combinedMsg: SocketMessage = {
    type: firstMsg.type,
    from: lastMsg.from,
    timestamp: lastMsg.timestamp,
    content: {
      type: type,
      audio: combinedAudio,
    },
  };

  return combinedMsg;
}

// Helper function to group audio buffer append messages
const groupAudioBufferMessages = (
  messages: SocketMessage[]
): SocketMessage[] => {
  const result: SocketMessage[] = [];
  let currentAudioGroup: SocketMessage[] = [];
  let targetAudioGroup: SocketMessage[] = [];

  // First pass: identify groups of audio buffer messages
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.content.type === "response.audio.delta") {
      targetAudioGroup.push(msg);
    } else if (msg.content.type === "response.audio.done" &&
      targetAudioGroup.length > 0
    ) {
      result.push(combineAudioBuffers(targetAudioGroup, "delta", "response.audio.combined"));
      targetAudioGroup = [];
    } else if (msg.content.type === "input_audio_buffer.append") {
      currentAudioGroup.push(msg);
    } else if (
      msg.content.type === "input_audio_buffer.commit" &&
      currentAudioGroup.length > 0
    ) {
      result.push(combineAudioBuffers(currentAudioGroup, "audio", "input_audio_buffer.combined"));
      currentAudioGroup = []; // Reset the group
    }
    result.push(msg);
  }

  // Add any remaining input audio buffer messages that weren't committed
  if (currentAudioGroup.length > 0) {
    const firstMsg = currentAudioGroup[0];

    // Same safe combining approach as above
    const audioChunks = currentAudioGroup
      .map((m) => m.content.audio || "")
      .filter((chunk) => chunk.length > 0);

    let combinedAudio = "";
    if (audioChunks.length > 0) {
      combinedAudio = audioChunks.join("");
    }

    const combinedMsg: SocketMessage = {
      type: firstMsg.type,
      from: firstMsg.from,
      timestamp: firstMsg.timestamp,
      content: {
        type: "input_audio_buffer.combined",
        audio: combinedAudio,
      },
    };

    result.push(combinedMsg);
  }

  return result;
};

const mapRealtimeMessages = (messages: SocketMessage[]): Message[] => {
  if (!messages?.length) return [];

  // Group audio buffer messages before processing
  const groupedMessages = groupAudioBufferMessages(messages);

  // Track deleted item IDs
  const deletedItemIds = new Set<string>();
  groupedMessages.forEach((msg) => {
    if (
      msg.content.type === "conversation.item.delete" &&
      msg.content.item_id
    ) {
      deletedItemIds.add(msg.content.item_id);
    }
  });

  let userTentativeMessage : Message | null = null;
  let targetTentativeMessage : Message | null = null;
  let userAudioTentativeMessage : Message | null = null;
  let targetAudioTentativeMessage : Message | null = null;
  let message: Message | null = null;

  return groupedMessages
    .map((msg: SocketMessage) => {
      // Only process specific message types that we want to show
      const output = msg.content?.response?.output?.[0];
      const item = msg.content?.item;

      switch (msg.content.type) {
        case "input_audio_buffer.speech_started":
          if (!userTentativeMessage) {
            userTentativeMessage = {
              role: "user",
              _type: "audio",
              content: "",
              start_timestamp: msg.timestamp,
              trigger_event_id: msg.content.type,
            }
          }
          break;
        case "input_audio_buffer.append":
          if (!userAudioTentativeMessage) {
            userAudioTentativeMessage = {
              role: "user",
              _type: "audio",
              content: "",
              audio_data: "",
              start_timestamp: msg.timestamp,
              trigger_event_id: msg.content.type,
            }
          }
          break;
        case "input_audio_buffer.combined":
          message = {
            ...userAudioTentativeMessage,
            role: "user",
            _type: "audio",
            content: "Input Audio",
            audio_data: msg.content.audio,
            timestamp: msg.timestamp,
            ending_event_id: msg.content.type,
          };
          userAudioTentativeMessage = null;
          return message;
        case "response.audio.delta":
          if (!targetAudioTentativeMessage) {
            targetAudioTentativeMessage = {
              role: "assistant",
              _type: "audio",
              start_timestamp: msg.timestamp,
              trigger_event_id: msg.content.type,
            }
          }
          break;
        case "response.audio.combined":
          message = {
            ...targetAudioTentativeMessage,
            role: "assistant",
            _type: "audio",
            content: "Assistant Audio",
            audio_data: msg.content.audio,
            timestamp: msg.timestamp,
            ending_event_id: msg.content.type,
          };
          targetAudioTentativeMessage = null;
          return message;
        case "response.create":
          // -> User: Text
          return msg.content?.response?.instructions
            ? {
                role: "user",
                _type: "message",
                content: msg.content.response.instructions,
                timestamp: msg.timestamp,
              }
            : null;
        case "response.created":
          if (!targetTentativeMessage) {
            targetTentativeMessage = {
              role: msg.from === "target" ? "assistant" : "user",
              _type: "audio",
              start_timestamp: msg.timestamp,
              trigger_event_id: msg.content.type,
            }
          }
          break;
        case "conversation.item.input_audio_transcription.completed":
          // -> User: Audio (transcript)
          message = msg.content?.transcript
            ? {
                ...userTentativeMessage,
                role: "user",
                _type: "audio",
                content: msg.content.transcript,
                audio_data: msg.content.item?.content?.[0]?.audio || undefined,
                timestamp: msg.timestamp,
                ending_event_id: msg.content.type,
              }
            : null;
          userTentativeMessage = null;
          return message;

        case "response.done":
          if (output?.content?.[0]) {
            // -> Assistant: Text or Audio
            const content = output.content[0];
            if (!content.text && !content.transcript) return null;
            const message = {
              ...targetTentativeMessage,
              role: "assistant",
              _type: content.text ? "text" : "audio",
              content: content.text || content.transcript || "",
              audio_data: content.audio,
              timestamp: msg.timestamp,
              ending_event_id: msg.content.type,
            };
            targetTentativeMessage = null;
            return message;
          }

          if (
            output?.type === "function_call" &&
            output.name &&
            output.arguments
          ) {
            // -> Assistant: Function call
            try {
              return {
                role: "assistant",
                _type: "functionCall",
                tool_call_id: output.call_id,
                tool_calls: [
                  {
                    name: output.name,
                    arguments: isJSON(output.arguments)
                      ? JSON.parse(output.arguments)
                      : output.arguments,
                  },
                ],
                timestamp: msg.timestamp,
              };
            } catch (e) {
              return null;
            }
          }
          return null;

        case "conversation.item.create":
          if (item?.type === "function_call_output" && item.output) {
            // -> Assistant: Function call output
            return {
              role: "user",
              _type: "function",
              tool_call_id: item.call_id,
              tool_calls: [
                {
                  name: undefined,
                  arguments: isJSON(item.output)
                    ? JSON.parse(item.output)
                    : item.output,
                },
              ],
              timestamp: msg.timestamp,
              id: item.id,
              // Check if this function call output has been deleted
              deleted: item.id ? deletedItemIds.has(item.id) : false,
            };
          }

          // Handle user-created audio items
          if (
            item?.type === "message" &&
            item.content &&
            Array.isArray(item.content) &&
            item.content[0]?.type === "input_audio"
          ) {
            return {
              role: "user",
              _type: "audio",
              content: item.content[0].transcript || "",
              audio_data: item.content[0].audio || null,
              timestamp: msg.timestamp,
              id: item.id,
              // Check if this audio item has been deleted
              deleted: item.id ? deletedItemIds.has(item.id) : false,
            };
          }

          // Handle user-created text items
          if (
            item?.type === "message" &&
            item.content &&
            Array.isArray(item.content) &&
            item.content[0]?.type === "input_text"
          ) {
            return {
              role: "user",
              _type: "message",
              content: item.content[0].text || "",
              timestamp: msg.timestamp,
              id: item.id,
              // Check if this text item has been deleted
              deleted: item.id ? deletedItemIds.has(item.id) : false,
            };
          }
          return null;

        case "session.update":
          // -> User: Session update
          return msg.content
            ? {
                role: "user",
                _type: "message",
                content: JSON.stringify(msg.content),
                timestamp: msg.timestamp,
              }
            : null;

        case "conversation.item.delete":
          // We don't create a message for delete events, we just track them
          return null;

        default:
          return null;
      }
    })
    .filter((msg) => msg !== null)
    .sort(
      // Sort by timestamp
      (a, b) =>
        new Date(((a as Message)?.start_timestamp ?? a?.timestamp) || 0).getTime() -
        new Date(((b as Message)?.start_timestamp ?? b?.timestamp) || 0).getTime()
    ) as Message[];
};
