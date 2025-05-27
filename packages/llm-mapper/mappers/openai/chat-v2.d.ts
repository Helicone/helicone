import { LlmSchema } from "../../types";
/**
 * Simplified interface for the OpenAI Chat request format
 */
interface OpenAIChatRequest {
    model?: string;
    messages?: {
        role: string;
        content: string | Array<{
            type: string;
            text?: string;
            image_url?: {
                url: string;
            };
        }>;
        name?: string;
    }[];
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    max_completion_tokens?: number;
    stream?: boolean;
    stop?: string[] | string;
    tools?: {
        type: "function";
        function: {
            name: string;
            description: string;
            parameters: Record<string, any>;
        };
    }[];
    tool_choice?: "none" | "auto" | "required" | {
        type: string;
        function?: {
            type: "function";
            name: string;
        };
    };
    parallel_tool_calls?: boolean;
    reasoning_effort?: "low" | "medium" | "high";
    frequency_penalty?: number;
    presence_penalty?: number;
    logit_bias?: Record<string, number>;
    logprobs?: boolean;
    top_logprobs?: number;
    n?: number;
    modalities?: string[];
    prediction?: any;
    audio?: any;
    response_format?: {
        type: string;
        json_schema?: any;
    };
    seed?: number;
    service_tier?: string;
    store?: boolean;
    stream_options?: any;
    metadata?: Record<string, string>;
    user?: string;
    function_call?: string | {
        name: string;
    };
    functions?: Array<any>;
}
/**
 * Build the simplified OpenAI Chat mapper with proper type safety
 */
export declare const openaiChatMapper: import("../../path-mapper").PathMapper<OpenAIChatRequest, import("../../types").LLMRequestBody>;
/**
 * Maps an OpenAI request to our internal format
 */
export declare const mapOpenAIRequestV2: ({ request, response, model, }: {
    request: OpenAIChatRequest;
    response: any;
    statusCode?: number;
    model: string;
}) => LlmSchema;
export {};
