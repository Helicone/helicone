import { LlmSchema } from "../../types";
/**
 * Simplified interface for the Google (Gemini) Chat request format
 */
interface GoogleChatRequest {
    model?: string;
    contents?: Array<{
        role?: string;
        parts?: Array<{
            text?: string;
            inlineData?: {
                data?: string;
            };
            functionCall?: {
                name: string;
                args: Record<string, any>;
            };
        }> | {
            text?: string;
            inlineData?: {
                data?: string;
            };
            functionCall?: {
                name: string;
                args: Record<string, any>;
            };
        };
    }> | {
        role?: string;
        parts?: Array<{
            text?: string;
            inlineData?: {
                data?: string;
            };
            functionCall?: {
                name: string;
                args: Record<string, any>;
            };
        }> | {
            text?: string;
            inlineData?: {
                data?: string;
            };
            functionCall?: {
                name: string;
                args: Record<string, any>;
            };
        };
    };
    generationConfig?: {
        temperature?: number;
        topP?: number;
        maxOutputTokens?: number;
        candidateCount?: number;
        stopSequences?: string[];
    };
}
/**
 * Build the Google Chat mapper with proper type safety
 */
export declare const googleChatMapper: import("../../path-mapper").PathMapper<GoogleChatRequest, import("../../types").LLMRequestBody>;
/**
 * Maps a Google/Gemini request to our internal format
 */
export declare const mapGeminiRequestV2: ({ request, response, statusCode, model, }: {
    request: GoogleChatRequest;
    response: any;
    statusCode?: number;
    model: string;
}) => LlmSchema;
export {};
