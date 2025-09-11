export interface AntRequestBody {
  model: string;
  messages: {
    role: "user" | "assistant" | "system";
    content: string | ContentBlock[];
  }[];
  max_tokens: number;
  metadata?: {
    user_id?: string;
  };
  system?: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
  tools?: AnthropicTool[];
  tool_choice?: AnthropicToolChoice;
}

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export type AnthropicToolChoice = 
  | { type: "auto" }
  | { type: "any" }
  | { type: "tool"; name: string };

export interface ContentBlock {
  type: "text" | "image" | "tool_use" | "tool_result";
  text?: string;
  source?: {
    type: "base64" | "url";
    media_type: string;
    data: string;
  };
  // tool_use fields
  id?: string;
  name?: string;
  input?: Record<string, any>;
  // tool_result fields
  tool_use_id?: string;
  content?: string;
}
