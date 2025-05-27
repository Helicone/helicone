import { LlmSchema } from "../../types";
/**
 * Simplified interface for the Anthropic Chat request format
 */
interface AnthropicChatRequest {
    model?: string;
    messages?: {
        role: string;
        content: string | Array<any>;
    }[];
    system?: string;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    stream?: boolean;
    stop_sequences?: string[];
    tools?: {
        name: string;
        description: string;
        input_schema: Record<string, any>;
    }[];
    tool_choice?: {
        type: "auto" | "any" | "tool" | string;
        disable_parallel_tool_use?: boolean;
        name?: string;
    };
    thinking?: {
        type: "enabled";
        budget_tokens: number;
    };
}
/**
 * Build the simplified Anthropic Chat mapper with proper type safety
 */
export declare const anthropicChatMapper: import("../../path-mapper").PathMapper<AnthropicChatRequest, import("../../types").LLMRequestBody>;
/**
 * Maps an Anthropic request to our internal format
 */
export declare const mapAnthropicRequestV2: ({ request, response, model, }: {
    request: AnthropicChatRequest;
    response: any;
    statusCode?: number;
    model: string;
}) => LlmSchema;
export {};
