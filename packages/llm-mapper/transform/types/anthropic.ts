import {
  Role,
  AnthropicStopReason,
  AnthropicUsage,
  AnthropicContentBlock,
  AnthropicTool,
  AnthropicWebSearchTool,
  AnthropicToolChoice,
  BaseStreamEvent,
  WebSearchCitation,
} from "./common";

// === REQUEST TYPES ===
export interface AnthropicRequestBody {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  metadata?: {
    user_id?: string;
  };
  system?: string | AnthropicContentBlock[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
  tools?: (AnthropicTool | AnthropicWebSearchTool)[];
  tool_choice?: AnthropicToolChoice;
  thinking?: AnthropicThinkingConfig;
  /**
   * Context management configuration for automatic context editing.
   * @see https://docs.anthropic.com/en/docs/build-with-claude/context-editing
   */
  context_management?: AnthropicContextManagement;
}

export type AnthropicThinkingConfig = {
  type: "enabled";
  budget_tokens: number;
} | {
  type: "disabled";
};

/**
 * Context management configuration for Anthropic's context editing feature.
 * Uses an edits array with versioned strategy types.
 *
 * @see https://docs.anthropic.com/en/docs/build-with-claude/context-editing
 */
export interface AnthropicContextManagement {
  edits: AnthropicContextEdit[];
}

export type AnthropicContextEdit =
  | AnthropicClearToolUsesEdit
  | AnthropicClearThinkingEdit;

export interface AnthropicClearToolUsesEdit {
  type: "clear_tool_uses_20250919";
  trigger?: { type: "input_tokens" | "tool_uses"; value: number };
  keep?: { type: "tool_uses"; value: number };
  clear_at_least?: { type: "input_tokens"; value: number };
  exclude_tools?: string[];
  clear_tool_inputs?: boolean;
}

export interface AnthropicClearThinkingEdit {
  type: "clear_thinking_20251015";
  keep?: { type: "thinking_turns"; value: number } | "all";
}

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
}

// === RESPONSE TYPES ===
export interface AnthropicResponseBody {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: AnthropicStopReason;
  stop_sequence: string | null;
  usage: AnthropicUsage;
}

// === STREAMING TYPES ===
// TODO: rigorously test and check these streaming types
export interface MessageStartEvent extends BaseStreamEvent {
  type: "message_start";
  message: {
    id: string;
    type: "message";
    role: "assistant";
    content: AnthropicContentBlock[];
    model: string;
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: Omit<AnthropicUsage, "service_tier">; // service_tier not in streaming start (?)
  };
}

export interface ContentBlockStartEvent extends BaseStreamEvent {
  type: "content_block_start";
  index: number;
  content_block: Pick<
    AnthropicContentBlock,
    "type" | "text" | "id" | "name" | "input" | "thinking" | "citations"
  >;
}

export interface ContentBlockDeltaEvent extends BaseStreamEvent {
  type: "content_block_delta";
  index: number;
  delta:
    | { type: "text_delta"; text: string }
    | { type: "input_json_delta"; partial_json: string }
    | { type: "thinking_delta"; thinking: string }
    | { type: "signature_delta"; signature: string }
    | { type: "citations_delta"; citation: WebSearchCitation };
}

export interface ContentBlockStopEvent extends BaseStreamEvent {
  type: "content_block_stop";
  index: number;
}

export interface MessageDeltaEvent extends BaseStreamEvent {
  type: "message_delta";
  delta: {
    stop_reason: string | null;
    stop_sequence: string | null;
  };
  usage: Omit<AnthropicUsage, "service_tier">; // service_tier not in streaming delta
}

export interface MessageStopEvent extends BaseStreamEvent {
  type: "message_stop";
}

export interface PingEvent extends BaseStreamEvent {
  type: "ping";
}

export interface ErrorEvent extends BaseStreamEvent {
  type: "error";
  error: {
    type: string;
    message: string;
  };
}

export type AnthropicStreamEvent =
  | MessageStartEvent
  | ContentBlockStartEvent
  | ContentBlockDeltaEvent
  | ContentBlockStopEvent
  | MessageDeltaEvent
  | MessageStopEvent
  | PingEvent
  | ErrorEvent;

export type {
  AnthropicStopReason,
  AnthropicUsage,
  AnthropicContentBlock,
  AnthropicTool,
  AnthropicWebSearchTool,
  AnthropicToolChoice,
} from "./common";
