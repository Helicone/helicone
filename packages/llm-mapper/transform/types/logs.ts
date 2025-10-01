import {
  ChatCompletionChunk,
  OpenAIResponseBody
} from "./openai";
import {
  AnthropicResponseBody
} from "./anthropic";

export interface OpenAILog extends OpenAIResponseBody {
  streamed_data?: ChatCompletionChunk[]; // list of streamed data chunks
}

export interface AnthropicLog extends AnthropicResponseBody {
  // we store it as a string for Anthropic streamed logs
  // TODO: store as list of chunks (involves fixing body processors + retaining backwards compat)
  streamed_data?: string;
}
