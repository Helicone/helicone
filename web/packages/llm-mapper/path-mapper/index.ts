import { anthropicChatMapper } from "../mappers/anthropic/chat-v2";
import { googleChatMapper } from "../mappers/gemini/chat-v2";
import { openaiChatMapper } from "../mappers/openai/chat-v2";
import { MapperBuilder } from "./builder";
import { PathMapper } from "./core";

// Export a simple object with all mappers for easy access
export const mappers = {
  "openai-chat": openaiChatMapper,
  "anthropic-chat": anthropicChatMapper,
  "gemini-chat": googleChatMapper,
} as const;

// Type for available mapper names
export type MapperName = keyof typeof mappers;

// Helper function to get a mapper by name with proper typing
export function getMapper<T extends MapperName>(name: T): (typeof mappers)[T] {
  return mappers[name];
}

// Export types
export { MapperBuilder, PathMapper };
