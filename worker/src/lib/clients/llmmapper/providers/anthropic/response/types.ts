export interface AntResponseBody {
  id: string;
  type: "message";
  role: "assistant";
  content: ContentBlock[];
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | "pause_turn" | "refusal" | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation?: {
      ephemeral_5m_input_tokens?: number;
      ephemeral_1h_input_tokens?: number;
    };
    server_tool_use?: {
      web_search_requests?: number;
    };
    service_tier?: string;
  };
}

export interface ContentBlock {
  type: "text" | "tool_use" | "thinking" | "server_tool_use";
  text?: string;
  id?: string;
  name?: string;
  input?: object;
  thinking?: string;
  signature?: string;
}
