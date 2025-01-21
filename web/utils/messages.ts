import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// TODO: TEMPORARY with missing models info
export function canAddPrefill(provider: string): boolean {
  return provider === "anthropic";
}

export function canAddMessagePair(
  messages: ChatCompletionMessageParam[]
): boolean {
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.role === "user";
}

export function canAddPrefillMessage(
  messages: ChatCompletionMessageParam[]
): boolean {
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.role === "user";
}

export function isRemovableMessage(
  messages: ChatCompletionMessageParam[],
  index: number
): boolean {
  // First system and user messages are not removable
  if (index <= 1) return false;
  return true;
}

export function removeMessagePair(
  messages: ChatCompletionMessageParam[],
  index: number
): ChatCompletionMessageParam[] {
  // If it's an assistant message followed by a user message, remove both
  if (
    index < messages.length - 1 &&
    messages[index].role === "assistant" &&
    messages[index + 1].role === "user"
  ) {
    return [...messages.slice(0, index), ...messages.slice(index + 2)];
  }
  // If it's a single assistant message (prefill), just remove it
  return [...messages.slice(0, index), ...messages.slice(index + 1)];
}
