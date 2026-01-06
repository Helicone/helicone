import { Provider } from "@helicone-package/llm-mapper/types";
import { registry } from "@helicone-package/cost/models/registry";
import { heliconeProviderToModelProviderName } from "@helicone-package/cost/models/provider-helpers";
import type { ModelProviderName } from "@helicone-package/cost/models/providers";
import type { ModelProviderConfig } from "@helicone-package/cost/models/types";
import { ValidRequestBody } from "../../RequestBodyBuffer/IRequestBodyBuffer";

// === Chat Completions API Types ===
export type LLMMessage = {
  role?: string;
  content?: unknown;
  [key: string]: unknown;
};

export type ChatCompletionsPayload = {
  _type: "chat_completions";
  model?: string;
  messages?: LLMMessage[];
  tools?: unknown;
};

// === Responses API Types ===
export type ResponsesInputTextPart = {
  type: "input_text";
  text: string;
};

export type ResponsesInputImagePart = {
  type: "input_image";
  image_url?: string;
  file_id?: string;
  detail?: "high" | "low" | "auto";
};

export type ResponsesInputFilePart = {
  type: "input_file";
  file_data?: string;
  file_id?: string;
  filename?: string;
};

export type ResponsesInputContentPart =
  | ResponsesInputTextPart
  | ResponsesInputImagePart
  | ResponsesInputFilePart;

export type ResponsesMessageInputItem = {
  type?: "message";
  role: "user" | "assistant" | "system" | "developer";
  content: string | ResponsesInputContentPart[];
};

export type ResponsesFunctionCallInputItem = {
  type: "function_call";
  id?: string;
  call_id?: string;
  name: string;
  arguments: string;
};

export type ResponsesFunctionCallOutputInputItem = {
  type: "function_call_output";
  call_id: string;
  output: string;
};

export type ResponsesReasoningItem = {
  type: "reasoning";
  id: string;
  summary: Array<{ type: "summary_text"; text: string }>;
  encrypted_content?: string;
};

export type ResponsesInputItem =
  | ResponsesMessageInputItem
  | ResponsesFunctionCallInputItem
  | ResponsesFunctionCallOutputInputItem
  | ResponsesReasoningItem;

export type ResponsesPayload = {
  _type: "responses";
  model?: string;
  input: string | ResponsesInputItem[];
  instructions?: string;
  tools?: unknown;
};

// === Union Type ===
export type ParsedRequestPayload = ChatCompletionsPayload | ResponsesPayload;

// Legacy type alias for backward compatibility
export type LegacyParsedRequestPayload = {
  model?: string;
  messages?: LLMMessage[];
  tools?: unknown;
};

const DEFAULT_TOKEN_HEURISTIC = 0.25;

const MODEL_TOKEN_HEURISTICS: Record<string, number> = {
  "gpt-4o": 0.25,
  "gpt-3.5-turbo": 0.2,
  "gpt-4o-mini": 0.25,
  "gpt-o3": 0.25,
};

const NORMALIZATION_PATTERNS: Array<[RegExp, string]> = [
  [/<!--[\s\S]*?-->/g, ""],
  [/\b(id|uuid):[a-f0-9-]{36}\b/gi, ""],
  [/\s*,\s*/g, ","],
  [/\s*\.\s*/g, "."],
  [/\s*:\s*/g, ":"],
  [/\s*;\s*/g, ";"],
  [/\s*\(\s*/g, "("],
  [/\s*\)\s*/g, ")"],
  [/\s*\{\s*/g, "{"],
  [/\s*\}\s*/g, "}"],
  [/\s*\[\s*/g, "["],
  [/\s*\]\s*/g, "]"],
  [/\s*=\s*/g, "="],
  [/\s*>\s*/g, ">"],
  [/\s*<\s*/g, "<"],
];

export function truncateAndNormalizeText(
  input: string | null | undefined
): string {
  if (!input) {
    return "";
  }

  let normalized = input;

  for (const [pattern, replacement] of NORMALIZATION_PATTERNS) {
    normalized = normalized.replace(pattern, replacement);
  }

  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

export function middleOutMessagesToFitLimit<T extends LLMMessage>(
  messages: T[],
  maxTokens: number,
  estimateTokens: (candidate: T[]) => number | null
): T[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  if (!Number.isFinite(maxTokens) || maxTokens <= 0) {
    return messages.slice(0, Math.min(messages.length, 1));
  }

  type Chunk = {
    messageIndex: number;
    order: number;
    content: string;
  };

  const original: T[] = messages.slice();

  const DEFAULT_CHUNK_SIZE = 1000;
  const DEFAULT_CHUNK_OVERLAP = 0;
  // Important: avoid char-level splitting (""), which explodes chunk counts
  // and severely hurts performance for large inputs. Keep word/line separators only.
  const DEFAULT_SEPARATORS = ["\n\n", "\n", ".", " "];

  function splitTextRecursive(
    text: string,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
    chunkOverlap: number = DEFAULT_CHUNK_OVERLAP,
    separators: string[] = DEFAULT_SEPARATORS
  ): string[] {
    if (chunkSize <= 0) return [text];
    if (text.length <= chunkSize) return [text];

    let chosenSep = separators.find((s) => s !== "" && text.includes(s));
    if (chosenSep === undefined)
      chosenSep = separators[separators.length - 1] ?? " ";

    const splits = text.split(chosenSep);
    const chunks: string[] = [];
    const joiner = chosenSep;

    let current: string[] = [];
    let currentLen = 0;

    for (const piece of splits) {
      const extra = current.length > 0 && joiner ? joiner.length : 0;
      if (currentLen + extra + piece.length > chunkSize && current.length > 0) {
        const chunk = current.join(joiner);
        if (chunk.length > chunkSize) {
          const nextSeps = separators.slice(
            Math.max(0, separators.indexOf(chosenSep) + 1)
          );
          const subs = splitTextRecursive(
            chunk,
            chunkSize,
            chunkOverlap,
            nextSeps
          );
          chunks.push(...subs);
        } else {
          chunks.push(chunk);
        }

        if (chunkOverlap > 0) {
          let remaining = chunkOverlap;
          const overlapped: string[] = [];
          for (let i = current.length - 1; i >= 0 && remaining > 0; i--) {
            const token = current[i];
            const tokenLen =
              token.length + (i > 0 && joiner ? joiner.length : 0);
            overlapped.unshift(token);
            remaining -= tokenLen;
          }
          current = overlapped;
          currentLen = overlapped.join(joiner).length;
        } else {
          current = [];
          currentLen = 0;
        }
      }

      if (piece.length > 0) {
        if (current.length > 0 && joiner) currentLen += joiner.length;
        current.push(piece);
        currentLen += piece.length;
      }
    }

    if (current.length > 0) {
      const chunk = current.join(joiner);
      if (chunk.length > chunkSize) {
        const nextSeps = separators.slice(
          Math.max(0, separators.indexOf(chosenSep) + 1)
        );
        const subs = splitTextRecursive(
          chunk,
          chunkSize,
          chunkOverlap,
          nextSeps
        );
        chunks.push(...subs);
      } else {
        chunks.push(chunk);
      }
    }

    return chunks;
  }

  const chunks: Chunk[] = [];
  const stringMessageIndexes = new Set<number>();

  for (let i = 0; i < original.length; i++) {
    const m = original[i];
    if (typeof m?.content === "string" && m.content.length > 0) {
      stringMessageIndexes.add(i);
      const parts = splitTextRecursive(m.content);
      for (let order = 0; order < parts.length; order++) {
        chunks.push({ messageIndex: i, order, content: parts[order] });
      }
    }
  }

  if (chunks.length === 0) {
    const working = original.slice();
    let currentEstimate = estimateTokens(working);
    if (currentEstimate === null || currentEstimate <= maxTokens) {
      return working;
    }

    while (working.length > 2) {
      const middleIndex = Math.floor(working.length / 2);
      working.splice(middleIndex, 1);
      currentEstimate = estimateTokens(working);
      if (currentEstimate === null || currentEstimate <= maxTokens) {
        break;
      }
    }
    return working;
  }

  function buildMessagesFromKept(kept: Set<number>): T[] {
    const byMessage = new Map<number, string[]>();
    for (let idx = 0; idx < chunks.length; idx++) {
      if (!kept.has(idx)) continue;
      const c = chunks[idx];
      if (!byMessage.has(c.messageIndex)) byMessage.set(c.messageIndex, []);
      byMessage.get(c.messageIndex)!.push(c.content);
    }

    return original.map((m, i) => {
      const clone = { ...(m as any) } as T;
      if (typeof clone?.content === "string") {
        const parts = byMessage.get(i) ?? [];
        (clone as any).content = parts.join("");
      }
      return clone;
    });
  }

  function buildMessagesWithOnlyChunk(chunkIndex: number): T[] {
    const target = chunks[chunkIndex];
    return original.map((m, i) => {
      const clone = { ...(m as any) } as T;
      if (typeof clone?.content === "string") {
        (clone as any).content =
          i === target.messageIndex ? target.content : "";
      }
      return clone;
    });
  }

  // Compute a per-chunk weight once using a simple proportional heuristic
  // derived from a single full estimate call.
  const baseTokens = estimateTokens([]) ?? 0;
  // Total content characters across all chunks
  const totalChars = chunks.reduce((acc, c) => acc + c.content.length, 0);
  // Approximate total tokens if we kept everything (one estimate call on full content)
  const allKept = new Set<number>(chunks.map((_, i) => i));
  const fullEstimate = estimateTokens(buildMessagesFromKept(allKept));

  // If estimation failed, fall back to current messages (no trimming)
  if (fullEstimate === null) {
    return buildMessagesFromKept(allKept);
  }

  // If already within budget, return original
  if (fullEstimate <= maxTokens) {
    return buildMessagesFromKept(allKept);
  }

  const budgetForChunks = Math.max(0, maxTokens - baseTokens);
  const contentTokens = Math.max(0, fullEstimate - baseTokens);
  const tokensPerChar = totalChars > 0 ? contentTokens / totalChars : 0;

  // Build weights for each chunk once
  const weights = chunks.map((c) => {
    const raw = Math.floor(tokensPerChar * c.content.length);
    // Ensure non-empty chunks have at least weight 1 when there is content budget
    if (contentTokens > 0 && c.content.length > 0) {
      return Math.max(1, raw);
    }
    return Math.max(0, raw);
  });

  // Early fallback: if budget can't even cover any content tokens, keep nothing from content
  if (budgetForChunks <= 0 || contentTokens <= 0 || totalChars === 0) {
    const keptNone = new Set<number>();
    const finalNone = buildMessagesFromKept(keptNone).filter((m) => {
      if (typeof (m as any)?.content === "string") {
        return ((m as any).content as string).length > 0;
      }
      return true;
    });
    return finalNone as T[];
  }

  // Simple contiguous middle removal: remove a centered window until we've
  // removed at least the number of tokens we need to cut. Keep the rest.
  const n = weights.length;
  const kept = new Set<number>();
  const cutTokens = Math.max(0, contentTokens - budgetForChunks);
  if (n === 0 || cutTokens <= 0) {
    // Nothing to remove
    for (let i = 0; i < n; i++) kept.add(i);
  } else {
    // Centered window [L, R) to remove
    let L = Math.floor((n - 1) / 2);
    let R = L + 1;
    let removed = 0;

    // Optionally include the very center chunk for odd lengths
    removed += weights[L];
    L -= 1;

    let takeRight = true;
    while (removed < cutTokens && (L >= 0 || R < n)) {
      if (takeRight && R < n) {
        removed += weights[R];
        R += 1;
      } else if (L >= 0) {
        removed += weights[L];
        L -= 1;
      } else if (R < n) {
        removed += weights[R];
        R += 1;
      }
      takeRight = !takeRight;
    }

    // Keep everything outside the removal window
    for (let i = 0; i < Math.max(0, L + 1); i++) kept.add(i);
    for (let i = Math.min(n, R); i < n; i++) kept.add(i);
  }

  const finalMessages = buildMessagesFromKept(kept).filter((m) => {
    if (typeof (m as any)?.content === "string") {
      return ((m as any).content as string).length > 0;
    }
    return true;
  });

  return finalMessages as T[];
}

export function getTokenHeuristic(model: string | null | undefined): number {
  if (!model) {
    return DEFAULT_TOKEN_HEURISTIC;
  }

  const normalizedModel = model.toLowerCase();
  if (normalizedModel in MODEL_TOKEN_HEURISTICS) {
    return MODEL_TOKEN_HEURISTICS[normalizedModel];
  }

  for (const [prefix, heuristic] of Object.entries(MODEL_TOKEN_HEURISTICS)) {
    if (normalizedModel.startsWith(prefix)) {
      return heuristic;
    }
  }

  return DEFAULT_TOKEN_HEURISTIC;
}

export function extractModelCandidates(modelField: unknown): string[] {
  if (typeof modelField !== "string") {
    return [];
  }

  return modelField
    .split(",")
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.length > 0);
}

export function getPrimaryModel(modelField: unknown): string | null {
  const candidates = extractModelCandidates(modelField);
  return candidates[0] ?? null;
}

export function selectFallbackModel(modelField: unknown): string | null {
  const candidates = extractModelCandidates(modelField);
  if (candidates.length === 0) {
    return null;
  }
  return candidates[1] ?? candidates[0];
}

export function serializeTools(tools: unknown): string {
  if (!tools) {
    return "";
  }
  if (typeof tools === "string") {
    return tools;
  }
  try {
    return JSON.stringify(tools);
  } catch (error) {
    return "";
  }
}

/**
 * Detects if the parsed body is a Responses API request.
 * Responses API has `input` field instead of `messages`.
 */
export function isResponsesApiPayload(parsed: any): boolean {
  return (
    parsed &&
    typeof parsed === "object" &&
    "input" in parsed &&
    !("messages" in parsed)
  );
}

/**
 * Detects if the parsed body is a Chat Completions API request.
 */
export function isChatCompletionsPayload(parsed: any): boolean {
  return parsed && typeof parsed === "object" && "messages" in parsed;
}

/**
 * Extracts text content from a Responses API input item.
 */
export function extractTextFromResponsesInputItem(
  item: ResponsesInputItem
): string {
  if (!item) return "";

  // Message input item
  if (!item.type || item.type === "message") {
    const messageItem = item as ResponsesMessageInputItem;
    if (typeof messageItem.content === "string") {
      return messageItem.content;
    }
    if (Array.isArray(messageItem.content)) {
      return messageItem.content
        .filter((part): part is ResponsesInputTextPart => part.type === "input_text")
        .map((part) => part.text)
        .join(" ");
    }
    return "";
  }

  // Function call input
  if (item.type === "function_call") {
    const funcItem = item as ResponsesFunctionCallInputItem;
    return funcItem.arguments || "";
  }

  // Function call output
  if (item.type === "function_call_output") {
    const outputItem = item as ResponsesFunctionCallOutputInputItem;
    return outputItem.output || "";
  }

  // Reasoning item
  if (item.type === "reasoning") {
    const reasoningItem = item as ResponsesReasoningItem;
    return reasoningItem.summary
      ?.map((s) => s.text)
      .join(" ") || "";
  }

  return "";
}

/**
 * Extracts all text content from a Responses API payload.
 */
export function extractTextFromResponsesPayload(
  payload: ResponsesPayload
): string {
  let text = "";

  // Add instructions if present
  if (payload.instructions) {
    text += payload.instructions + " ";
  }

  // Handle input
  if (typeof payload.input === "string") {
    text += payload.input;
  } else if (Array.isArray(payload.input)) {
    for (const item of payload.input) {
      text += extractTextFromResponsesInputItem(item) + " ";
    }
  }

  return text.trim();
}

/**
 * Converts a Responses API input to LLMMessage array for processing.
 * This allows reuse of existing message-based strategies.
 */
export function responsesInputToMessages(
  payload: ResponsesPayload
): LLMMessage[] {
  const messages: LLMMessage[] = [];

  // Add instructions as system message if present
  if (payload.instructions) {
    messages.push({
      role: "system",
      content: payload.instructions,
      _source: "instructions",
    });
  }

  // Handle string input
  if (typeof payload.input === "string") {
    messages.push({
      role: "user",
      content: payload.input,
      _source: "input_string",
    });
    return messages;
  }

  // Handle array input
  if (Array.isArray(payload.input)) {
    for (const item of payload.input) {
      if (!item.type || item.type === "message") {
        const messageItem = item as ResponsesMessageInputItem;
        let content: string;
        if (typeof messageItem.content === "string") {
          content = messageItem.content;
        } else if (Array.isArray(messageItem.content)) {
          content = messageItem.content
            .filter((part): part is ResponsesInputTextPart => part.type === "input_text")
            .map((part) => part.text)
            .join(" ");
        } else {
          content = "";
        }
        messages.push({
          role: messageItem.role,
          content,
          _source: "input_message",
          _originalContent: messageItem.content,
        });
      } else if (item.type === "function_call") {
        const funcItem = item as ResponsesFunctionCallInputItem;
        messages.push({
          role: "assistant",
          content: `Function call: ${funcItem.name}(${funcItem.arguments})`,
          _source: "input_function_call",
          _originalItem: funcItem,
        });
      } else if (item.type === "function_call_output") {
        const outputItem = item as ResponsesFunctionCallOutputInputItem;
        messages.push({
          role: "tool",
          content: outputItem.output,
          _source: "input_function_output",
          _originalItem: outputItem,
        });
      } else if (item.type === "reasoning") {
        const reasoningItem = item as ResponsesReasoningItem;
        messages.push({
          role: "assistant",
          content: reasoningItem.summary?.map((s) => s.text).join(" ") || "",
          _source: "input_reasoning",
          _originalItem: reasoningItem,
        });
      }
    }
  }

  return messages;
}

/**
 * Converts processed LLMMessages back to Responses API input format.
 */
export function messagesToResponsesInput(
  messages: LLMMessage[],
  originalPayload: ResponsesPayload
): ResponsesPayload {
  const result: ResponsesPayload = {
    ...originalPayload,
    _type: "responses",
  };

  // Extract instructions from system message if it was from instructions
  const instructionsMessage = messages.find(
    (m) => m._source === "instructions"
  );
  if (instructionsMessage && typeof instructionsMessage.content === "string") {
    result.instructions = instructionsMessage.content;
  }

  // Check if original input was a string
  const stringInputMessage = messages.find(
    (m) => m._source === "input_string"
  );
  if (stringInputMessage && typeof stringInputMessage.content === "string") {
    result.input = stringInputMessage.content;
    return result;
  }

  // Convert messages back to input items
  const inputItems: ResponsesInputItem[] = [];
  for (const message of messages) {
    if (message._source === "instructions") continue; // Already handled

    if (message._source === "input_message") {
      const item: ResponsesMessageInputItem = {
        role: message.role as "user" | "assistant" | "system" | "developer",
        content:
          message._originalContent !== undefined
            ? (message._originalContent as string | ResponsesInputContentPart[])
            : (message.content as string),
      };
      // Update text content if it was modified
      if (
        typeof message._originalContent === "string" &&
        typeof message.content === "string"
      ) {
        item.content = message.content;
      } else if (
        Array.isArray(message._originalContent) &&
        typeof message.content === "string"
      ) {
        // Content was flattened to string, need to reconstruct
        const textParts = message._originalContent.filter(
          (p: any) => p.type === "input_text"
        );
        if (textParts.length === 1) {
          textParts[0].text = message.content;
          item.content = message._originalContent;
        } else {
          // Multiple text parts or mixed content - use string
          item.content = message.content;
        }
      }
      inputItems.push(item);
    } else if (
      message._source === "input_function_call" &&
      message._originalItem
    ) {
      inputItems.push(message._originalItem as ResponsesFunctionCallInputItem);
    } else if (
      message._source === "input_function_output" &&
      message._originalItem
    ) {
      inputItems.push(
        message._originalItem as ResponsesFunctionCallOutputInputItem
      );
    } else if (
      message._source === "input_reasoning" &&
      message._originalItem
    ) {
      inputItems.push(message._originalItem as ResponsesReasoningItem);
    }
  }

  result.input = inputItems;
  return result;
}

export function parseRequestPayload(
  body: ValidRequestBody
): ParsedRequestPayload | null {
  if (!body || typeof body !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    // Detect and tag the payload type
    if (isResponsesApiPayload(parsed)) {
      return {
        ...parsed,
        _type: "responses",
      } as ResponsesPayload;
    }

    if (isChatCompletionsPayload(parsed)) {
      return {
        ...parsed,
        _type: "chat_completions",
      } as ChatCompletionsPayload;
    }

    // Default to chat completions for backward compatibility
    return {
      ...parsed,
      _type: "chat_completions",
    } as ChatCompletionsPayload;
  } catch (error) {
    return null;
  }
}

export function estimateTokenCount(
  parsedBody: ParsedRequestPayload | null,
  primaryModel: string | null
): number | null {
  if (!parsedBody) {
    return null;
  }
  try {
    let contentText = "";

    if (parsedBody._type === "responses") {
      // Responses API: extract from input and instructions
      contentText = extractTextFromResponsesPayload(parsedBody);
    } else {
      // Chat Completions API: extract from messages
      if (parsedBody.messages) {
        for (const message of parsedBody.messages) {
          if (typeof message?.content === "string") {
            contentText += message.content;
          }
        }
      }
    }

    const toolsText = serializeTools(parsedBody.tools);

    const combinedText = [toolsText, contentText]
      .filter((segment) => segment.length > 0)
      .join(" ");

    const heuristic = getTokenHeuristic(primaryModel ?? undefined);
    const estimated = Math.ceil(
      (combinedText.length + toolsText.length) * heuristic
    );

    return Number.isFinite(estimated) ? estimated : null;
  } catch (error) {
    return null;
  }
}

/**
 * Attempts to read the requested completion/output token limit from the parsed body.
 * Supports multiple common field names used across providers. Falls back to 0.
 */
// Note: completion token extraction is done within HeliconeProxyRequest.applyTokenLimitExceptionHandler

export function getModelTokenLimit(
  provider: Provider,
  model: string | null | undefined
): number | null {
  if (!model) {
    return null;
  }

  const providerName = heliconeProviderToModelProviderName(provider);

  // If provider is not recognized (e.g., CUSTOM), search across all providers
  if (!providerName) {
    return getModelTokenLimitAnyProvider(model);
  }

  const config = findModelProviderConfig(model, providerName);
  if (!config || typeof config.contextLength !== "number") {
    return null;
  }

  return config.contextLength;
}

/**
 * Get the token limit for a model by searching across all providers.
 * This is used when the provider is unknown (e.g., AI Gateway with CUSTOM provider).
 */
export function getModelTokenLimitAnyProvider(
  model: string | null | undefined
): number | null {
  if (!model) {
    return null;
  }

  // Build candidates including stripping provider prefixes (e.g., "meta-llama/model" -> "model")
  const candidates = buildLookupCandidatesWithPrefixStripping(model);

  for (const candidate of candidates) {
    const configsResult = registry.getModelProviderConfigs(candidate);
    if (configsResult.error === null && configsResult.data && configsResult.data.length > 0) {
      // Return the first config with a valid contextLength
      for (const config of configsResult.data) {
        if (typeof config.contextLength === "number") {
          return config.contextLength;
        }
      }
    }
  }

  return null;
}

/**
 * Build lookup candidates including stripping provider prefixes.
 * Handles formats like "meta-llama/llama-prompt-guard-2-22m" -> "llama-prompt-guard-2-22m"
 */
function buildLookupCandidatesWithPrefixStripping(model: string): string[] {
  const baseCandidates = buildLookupCandidates(model);
  const allCandidates = new Set<string>(baseCandidates);

  // Also try stripping everything before "/" (provider prefix)
  if (model.includes("/")) {
    const afterSlash = model.split("/").pop();
    if (afterSlash) {
      const strippedCandidates = buildLookupCandidates(afterSlash);
      for (const c of strippedCandidates) {
        allCandidates.add(c);
      }
    }
  }

  return Array.from(allCandidates);
}

export function findModelProviderConfig(
  model: string,
  providerName: ModelProviderName
): ModelProviderConfig | null {
  const directConfig = lookupProviderConfig(model, providerName);
  if (directConfig) {
    return directConfig;
  }
  return searchProviderModels(model, providerName);
}

export function lookupProviderConfig(
  model: string,
  providerName: ModelProviderName
): ModelProviderConfig | null {
  const candidates = buildLookupCandidates(model);
  for (const candidate of candidates) {
    const result = registry.getModelProviderConfigByProviderModelId(
      candidate,
      providerName
    );
    if (result.error === null && result.data) {
      return result.data;
    }
  }
  return null;
}

export function searchProviderModels(
  model: string,
  providerName: ModelProviderName
): ModelProviderConfig | null {
  const providerModelsResult = registry.getProviderModels(providerName);
  if (providerModelsResult.error !== null || !providerModelsResult.data) {
    return null;
  }

  for (const canonicalModel of Array.from(providerModelsResult.data.values())) {
    const configsResult = registry.getModelProviderConfigs(canonicalModel);
    if (configsResult.error !== null || !configsResult.data) {
      continue;
    }

    for (const config of configsResult.data) {
      if (config.provider !== providerName) {
        continue;
      }

      if (modelIdentifierMatches(model, config.providerModelId)) {
        return config;
      }
    }
  }

  return null;
}

export function buildLookupCandidates(model: string): string[] {
  const trimmed = model.trim();
  if (!trimmed) {
    return [];
  }

  const candidates = new Set<string>();
  candidates.add(trimmed);

  const lower = trimmed.toLowerCase();
  if (lower !== trimmed) {
    candidates.add(lower);
  }

  const delimiters = [":", "-"];
  for (const delimiter of delimiters) {
    let current = trimmed;
    while (current.includes(delimiter)) {
      current = current.substring(0, current.lastIndexOf(delimiter));
      const normalized = current.trim();
      if (!normalized || candidates.has(normalized)) {
        continue;
      }
      candidates.add(normalized);
      candidates.add(normalized.toLowerCase());
    }
  }

  return Array.from(candidates);
}

export function modelIdentifierMatches(
  requestModel: string,
  providerModelId: string
): boolean {
  const requestVariants = buildModelIdentifierVariants(requestModel);
  const providerVariants = buildModelIdentifierVariants(providerModelId);

  for (const requestVariant of requestVariants) {
    for (const providerVariant of providerVariants) {
      if (requestVariant === providerVariant) {
        return true;
      }

      if (
        requestVariant.endsWith(`/${providerVariant}`) ||
        requestVariant.endsWith(`:${providerVariant}`) ||
        requestVariant.endsWith(`-${providerVariant}`)
      ) {
        return true;
      }

      if (
        providerVariant.endsWith(`/${requestVariant}`) ||
        providerVariant.endsWith(`:${requestVariant}`) ||
        providerVariant.endsWith(`-${requestVariant}`)
      ) {
        return true;
      }
    }
  }

  const sanitizedRequest = sanitizeModelIdentifier(requestModel);
  const sanitizedProvider = sanitizeModelIdentifier(providerModelId);

  if (sanitizedRequest.length === 0 || sanitizedProvider.length === 0) {
    return false;
  }

  const index = sanitizedRequest.indexOf(sanitizedProvider);
  if (index > 0) {
    return true;
  }

  return false;
}

export function buildModelIdentifierVariants(identifier: string): string[] {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return [];
  }

  const lower = trimmed.toLowerCase();
  const variants = new Set<string>([trimmed, lower]);

  const delimiterParts = lower.split(/[:/]/);
  if (delimiterParts.length > 1) {
    const lastPart = delimiterParts[delimiterParts.length - 1];
    if (lastPart) {
      variants.add(lastPart);
    }
  }

  return Array.from(variants).filter((variant) => variant.length > 0);
}

export function sanitizeModelIdentifier(identifier: string): string {
  return identifier.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolvePrimaryModel(
  parsedBody: ParsedRequestPayload | null,
  headerModelOverride: unknown
): string | null {
  const headerModel = getPrimaryModel(headerModelOverride);

  if (!parsedBody) {
    return headerModel;
  }

  const bodyModel = getPrimaryModel(parsedBody.model);
  return bodyModel ?? headerModel;
}

/**
 * Truncates and normalizes text content in a Responses API payload.
 */
function applyTruncateToResponsesPayload(
  payload: ResponsesPayload
): ResponsesPayload {
  const result = { ...payload };

  // Truncate instructions
  if (result.instructions) {
    result.instructions = truncateAndNormalizeText(result.instructions);
  }

  // Truncate input
  if (typeof result.input === "string") {
    result.input = truncateAndNormalizeText(result.input);
  } else if (Array.isArray(result.input)) {
    result.input = result.input.map((item) => {
      if (!item.type || item.type === "message") {
        const messageItem = item as ResponsesMessageInputItem;
        if (typeof messageItem.content === "string") {
          return {
            ...messageItem,
            content: truncateAndNormalizeText(messageItem.content),
          };
        }
        if (Array.isArray(messageItem.content)) {
          return {
            ...messageItem,
            content: messageItem.content.map((part) => {
              if (part.type === "input_text") {
                return {
                  ...part,
                  text: truncateAndNormalizeText(part.text),
                };
              }
              return part;
            }),
          };
        }
      }
      return item;
    });
  }

  return result;
}

export function applyTruncateStrategy(
  parsedBody: ParsedRequestPayload,
  primaryModel: string,
  tokenLimit: number | null
): ValidRequestBody | undefined {
  // Can't truncate without knowing the limit
  if (tokenLimit === null) {
    return;
  }

  // Get the token heuristic (tokens per character) for this model
  // e.g., 0.25 means ~4 chars per token
  const tokensPerChar = getTokenHeuristic(primaryModel);
  // Calculate max characters to keep (leave some buffer)
  // maxChars = tokenLimit / tokensPerChar = tokenLimit * (1 / tokensPerChar) = tokenLimit * charsPerToken
  const charsPerToken = 1 / tokensPerChar;
  const maxChars = Math.floor(tokenLimit * charsPerToken * 0.9);

  if (parsedBody._type === "responses") {
    // Responses API
    const hasContent =
      parsedBody.instructions ||
      (typeof parsedBody.input === "string" && parsedBody.input) ||
      (Array.isArray(parsedBody.input) && parsedBody.input.length > 0);

    if (!hasContent) {
      return;
    }

    const truncated = applyTruncateToResponsesPayloadWithLimit(parsedBody, maxChars);
    // Remove _type before serializing
    const { _type, ...rest } = truncated;
    return JSON.stringify(rest);
  }

  // Chat Completions API
  if (!parsedBody.messages) {
    return;
  }

  // Calculate total content length to distribute the budget
  let totalContentLength = 0;
  for (const message of parsedBody.messages) {
    if (typeof message?.content === "string") {
      totalContentLength += message.content.length;
    }
  }

  // Truncate each message proportionally
  let remainingChars = maxChars;
  for (const message of parsedBody.messages) {
    if (typeof message?.content === "string") {
      const content = message.content as string;
      const proportion = content.length / totalContentLength;
      const messageMaxChars = Math.floor(maxChars * proportion);
      message.content = truncateTextToLimit(content, Math.min(messageMaxChars, remainingChars));
      remainingChars -= (message.content as string).length;
    }
  }

  // Remove _type before serializing
  const { _type, ...rest } = parsedBody;
  return JSON.stringify(rest);
}

/**
 * Truncate text to a maximum character limit.
 */
function truncateTextToLimit(text: string, maxChars: number): string {
  if (!text || maxChars <= 0) {
    return "";
  }

  // First normalize the text
  let normalized = truncateAndNormalizeText(text);

  if (normalized.length <= maxChars) {
    return normalized;
  }

  // Truncate to max chars, trying to break at word boundary
  let truncated = normalized.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxChars * 0.8) {
    truncated = truncated.substring(0, lastSpace);
  }

  return truncated + "...";
}

/**
 * Apply truncation to Responses API payload with a character limit.
 * Prioritizes instructions (system prompt) over input since it has higher semantic weight.
 */
function applyTruncateToResponsesPayloadWithLimit(
  payload: ResponsesPayload,
  maxChars: number
): ResponsesPayload {
  const result = { ...payload };

  // Prioritize instructions (system prompt) - give it budget first, then remaining to input
  let remainingChars = maxChars;

  // Truncate instructions first (higher semantic weight, like system prompt)
  if (result.instructions) {
    // Give instructions up to 30% of budget or its full length, whichever is smaller
    const instructionsMax = Math.min(
      result.instructions.length,
      Math.floor(maxChars * 0.3)
    );
    result.instructions = truncateTextToLimit(result.instructions, instructionsMax);
    remainingChars -= result.instructions.length;
  }

  // Truncate input with remaining budget
  const inputMaxChars = Math.max(0, remainingChars);

  if (typeof result.input === "string") {
    result.input = truncateTextToLimit(result.input, inputMaxChars);
  } else if (Array.isArray(result.input)) {
    result.input = result.input.map((item) => {
      if (!item.type || item.type === "message") {
        const messageItem = item as ResponsesMessageInputItem;
        if (typeof messageItem.content === "string") {
          return {
            ...messageItem,
            content: truncateTextToLimit(messageItem.content, inputMaxChars),
          };
        }
        if (Array.isArray(messageItem.content)) {
          return {
            ...messageItem,
            content: messageItem.content.map((part) => {
              if (part.type === "input_text") {
                return {
                  ...part,
                  text: truncateTextToLimit(part.text, inputMaxChars),
                };
              }
              return part;
            }),
          };
        }
      }
      return item;
    });
  }

  return result;
}

export function applyMiddleOutStrategy(
  parsedBody: ParsedRequestPayload,
  primaryModel: string,
  tokenLimit: number | null
): ValidRequestBody | undefined {
  // Can't apply middle-out without knowing the token limit
  if (tokenLimit === null) {
    return;
  }

  if (parsedBody._type === "responses") {
    // Responses API: convert to messages, apply middle-out, convert back
    const messages = responsesInputToMessages(parsedBody);

    if (messages.length === 0) {
      return;
    }

    const trimmedMessages = middleOutMessagesToFitLimit(
      messages,
      tokenLimit,
      (candidate) => {
        // Estimate based on the candidate messages
        let contentText = "";
        for (const m of candidate) {
          if (typeof m.content === "string") {
            contentText += m.content;
          }
        }
        const toolsText = serializeTools(parsedBody.tools);
        const combinedText = [toolsText, contentText]
          .filter((s) => s.length > 0)
          .join(" ");
        const heuristic = getTokenHeuristic(primaryModel);
        return Math.ceil((combinedText.length + toolsText.length) * heuristic);
      }
    );

    const changed =
      JSON.stringify(trimmedMessages) !== JSON.stringify(messages);
    if (!changed) {
      return;
    }

    const resultPayload = messagesToResponsesInput(trimmedMessages, parsedBody);
    // Remove _type before serializing
    const { _type, ...rest } = resultPayload;
    return JSON.stringify(rest);
  }

  // Chat Completions API
  if (!Array.isArray(parsedBody.messages)) {
    return;
  }

  const originalMessages = (parsedBody.messages ?? []) as LLMMessage[];

  const trimmedMessages = middleOutMessagesToFitLimit(
    originalMessages,
    tokenLimit,
    (candidate) =>
      estimateTokenCount(
        {
          ...parsedBody,
          messages: candidate,
        } as ChatCompletionsPayload,
        primaryModel
      )
  );

  const changed =
    JSON.stringify(trimmedMessages) !== JSON.stringify(originalMessages);
  if (!changed) {
    return;
  }

  const finalPayload = {
    ...parsedBody,
    messages: trimmedMessages,
  };

  // Remove _type before serializing
  const { _type, ...rest } = finalPayload;
  return JSON.stringify(rest);
}

export function applyFallbackStrategy(
  parsedBody: ParsedRequestPayload,
  primaryModel: string,
  estimatedTokens: number | null,
  tokenLimit: number | null
): ValidRequestBody | undefined {
  const fallbackModel = selectFallbackModel(parsedBody.model);
  if (!fallbackModel) {
    return;
  }

  // Use fallback model if:
  // - tokenLimit is null (model not in registry, can't determine limit)
  // - estimatedTokens is null (can't estimate, be safe and use fallback)
  // - estimatedTokens >= tokenLimit (actually exceeded)
  const shouldUseFallback =
    tokenLimit === null ||
    estimatedTokens === null ||
    estimatedTokens >= tokenLimit;

  if (shouldUseFallback) {
    parsedBody.model = fallbackModel;
    // Remove _type before serializing
    const { _type, ...rest } = parsedBody;
    return JSON.stringify(rest);
  }

  parsedBody.model = primaryModel;
  // Remove _type before serializing
  const { _type, ...rest } = parsedBody;
  return JSON.stringify(rest);
}
