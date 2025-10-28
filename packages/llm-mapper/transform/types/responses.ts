import { BaseStreamEvent } from "./common";

// === REQUEST TYPES ===
// OpenAI Responses API request types (subset used by Helicone mappings)

export type ResponsesRole = "user" | "assistant" | "system" | "developer";

export interface ResponsesInputTextPart {
  type: "input_text";
  text: string;
}

export interface ResponsesInputImagePart {
  type: "input_image";
  // Either a direct URL, or a provider-specific file reference
  image_url?: string;
  file_id?: string;
  detail?: "high" | "low" | "auto";
}

export interface ResponsesInputFilePart {
  type: "input_file";
  // Either raw file data or a file id reference
  file_data?: string;
  file_id?: string;
  filename?: string;
}

export type ResponsesInputContentPart =
  | ResponsesInputTextPart
  | ResponsesInputImagePart
  | ResponsesInputFilePart;

export interface ResponsesMessageInputItem {
  // OpenAI may omit this and imply a message
  type?: "message";
  role: ResponsesRole;
  content: string | ResponsesInputContentPart[];
}

export interface ResponsesFunctionCallInputItem {
  type: "function_call";
  // Some implementations call this `id` and/or `call_id` – support both
  id?: string;
  call_id?: string;
  name: string;
  arguments: string; // JSON string
}

export interface ResponsesFunctionCallOutputInputItem {
  type: "function_call_output";
  call_id: string;
  output: string; // tool result payload (stringified)
}

export type ResponsesInputItem =
  | ResponsesMessageInputItem
  | ResponsesFunctionCallInputItem
  | ResponsesFunctionCallOutputInputItem;

export interface ResponsesToolFunction {
  name: string;
  description?: string;
  parameters?: Record<string, any>; // JSON Schema
}

export interface ResponsesToolDefinition {
  type: "function";
  function: ResponsesToolFunction;
}

export type ResponsesToolChoice =
  | "none"
  | "auto"
  | "required"
  | { type: "function"; function: { name: string } };

export interface ResponsesRequestBody {
  model: string;
  input: string | ResponsesInputItem[];
  instructions?: string;
  max_output_tokens?: number;
  metadata?: Record<string, string>;
  parallel_tool_calls?: boolean;
  previous_response_id?: string;
  reasoning?: {
    effort?: "low" | "medium" | "high" | "minimal";
  };
  text?: {
    verbosity?: "low" | "medium" | "high";
  };
  store?: boolean;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  truncation?: "auto" | "disabled";
  user?: string;
  tools?: ResponsesToolDefinition[];
  tool_choice?: ResponsesToolChoice;
  frequency_penalty?: number;
  presence_penalty?: number;
  logit_bias?: Record<string, number>;
  logprobs?: boolean;
  top_logprobs?: number;
  n?: number;
  response_format?: { type: string; json_schema?: any };
  seed?: number;
  service_tier?: string;
  stream_options?: any;
  // Deprecated parameters (pass-through if present)
  function_call?: string | { name: string };
  functions?: Array<any>;
}

// === RESPONSE TYPES ===

export interface ResponsesOutputTextPart {
  type: "output_text";
  text: string;
  annotations?: any[];
  logprobs?: any[];
  parsed?: any;
}

export interface ResponsesOutputToolCallPart {
  type: "output_tool_call";
  id: string;
  name: string;
  arguments: string; // JSON string
}

export type ResponsesOutputContentPart =
  | ResponsesOutputTextPart
  | ResponsesOutputToolCallPart;

export interface ResponsesMessageOutputItem {
  type: "message";
  id?: string;
  role: ResponsesRole; // Typically "assistant" on output
  content: ResponsesOutputContentPart[];
}

export interface ResponsesFunctionCallOutputItem {
  id: string;
  type: "function_call";
  status: "in_progress" | "completed";
  arguments: string; // JSON string
  call_id: string; // tool call id
  name: string;
  parsed_arguments?: any | null;
}

export interface ResponsesReasoningOutputItem {
  id: string;
  type: "reasoning";
  summary: any[];
}

export interface ResponsesUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens?: number;
  input_tokens_details?: {
    cached_tokens?: number;
    // provider-specific extension points could appear here
  };
  output_tokens_details?: {
    reasoning_tokens?: number;
  };
}

export interface ResponsesResponseBody {
  id: string;
  object: "response";
  created?: number;
  created_at?: number;
  status?: string; // e.g. "in_progress", "completed"
  background?: boolean;
  error?: any | null;
  incomplete_details?: any | null;
  instructions?: string | null;
  max_output_tokens?: number | null;
  max_tool_calls?: number | null;
  model: string;
  system_fingerprint?: string;
  output: (
    | ResponsesMessageOutputItem
    | ResponsesFunctionCallOutputItem
    | ResponsesReasoningOutputItem
  )[];
  parallel_tool_calls?: boolean;
  previous_response_id?: string | null;
  prompt_cache_key?: string | null;
  reasoning?: { effort?: "minimal" | "low" | "medium" | "high" | null; summary?: string | null };
  safety_identifier?: string | null;
  service_tier?: string | null;
  store?: boolean;
  temperature?: number;
  text?: { format?: { type: string }; verbosity?: "low" | "medium" | "high" };
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
  tools?: (ResponsesToolDefinition & Record<string, any>)[];
  top_logprobs?: number;
  top_p?: number;
  truncation?: string;
  usage?: ResponsesUsage;
  user?: string | null;
  metadata?: Record<string, any>;
  output_parsed?: any | null;
}

// === STREAMING TYPES (SSE) ===

export interface ResponseCreatedEvent extends BaseStreamEvent {
  type: "response.created";
  sequence_number?: number;
  response: ResponsesResponseBody;
}

export interface ResponseInProgressEvent extends BaseStreamEvent {
  type: "response.in_progress";
  sequence_number?: number;
  response: ResponsesResponseBody;
}

export interface ResponseOutputItemAddedEvent extends BaseStreamEvent {
  type: "response.output_item.added";
  sequence_number?: number;
  output_index: number;
  item:
    | (ResponsesMessageOutputItem & { status: "in_progress" | "completed" })
    | ResponsesFunctionCallOutputItem
    | ResponsesReasoningOutputItem;
}

export interface ResponseContentPartAddedEvent extends BaseStreamEvent {
  type: "response.content_part.added";
  sequence_number?: number;
  item_id: string;
  output_index: number;
  content_index: number;
  part: { type: "output_text"; text: string; annotations?: any[]; logprobs?: any[] } | any;
}

export interface ResponseOutputTextDeltaEvent extends BaseStreamEvent {
  type: "response.output_text.delta";
  sequence_number?: number;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
  logprobs?: any[];
  obfuscation?: string;
}

export interface ResponseOutputTextDoneEvent extends BaseStreamEvent {
  type: "response.output_text.done";
  sequence_number?: number;
  item_id: string;
  output_index: number;
  content_index: number;
  text: string;
  logprobs?: any[];
}

export interface ResponseOutputItemDoneEvent extends BaseStreamEvent {
  type: "response.output_item.done";
  sequence_number?: number;
  output_index: number;
  item:
    | (ResponsesMessageOutputItem & { status: "completed" | "in_progress" })
    | ResponsesFunctionCallOutputItem;
}

export interface ResponseFunctionCallArgumentsDeltaEvent extends BaseStreamEvent {
  type: "response.function_call_arguments.delta";
  sequence_number?: number;
  item_id: string;
  output_index: number;
  delta: string;
  obfuscation?: string;
}

export interface ResponseFunctionCallArgumentsDoneEvent extends BaseStreamEvent {
  type: "response.function_call_arguments.done";
  sequence_number?: number;
  item_id: string;
  output_index: number;
  arguments: string;
}

export interface ResponseCompletedEvent extends BaseStreamEvent {
  type: "response.completed";
  sequence_number?: number;
  response: ResponsesResponseBody;
}

export interface ResponseErrorEvent extends BaseStreamEvent {
  type: "response.error";
  sequence_number?: number;
  error: {
    type: string;
    message: string;
  };
}

export type ResponsesStreamEvent =
  | ResponseCreatedEvent
  | ResponseInProgressEvent
  | ResponseOutputItemAddedEvent
  | ResponseContentPartAddedEvent
  | ResponseOutputTextDeltaEvent
  | ResponseOutputTextDoneEvent
  | ResponseOutputItemDoneEvent
  | ResponseCompletedEvent
  | ResponseErrorEvent
  | ResponseFunctionCallArgumentsDeltaEvent
  | ResponseFunctionCallArgumentsDoneEvent;
