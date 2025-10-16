import { Provider } from "@helicone-package/llm-mapper/types";
import { registry } from "@helicone-package/cost/models/registry";
import { heliconeProviderToModelProviderName } from "@helicone-package/cost/models/provider-helpers";
import type { ModelProviderName } from "@helicone-package/cost/models/providers";
import type { ModelProviderConfig } from "@helicone-package/cost/models/types";
import { ValidRequestBody } from "../../RequestBodyBuffer/IRequestBodyBuffer";

export type LLMMessage = {
  role?: string;
  content?: unknown;
  [key: string]: unknown;
};

export type ParsedRequestPayload = {
  model?: string;
  messages?: LLMMessage[];
  tools?: unknown;
};

const DEFAULT_TOKEN_HEURISTIC = 0.25;

const MODEL_TOKEN_HEURISTICS: Record<string, number> = {
  "gpt-4o": 0.25,
  "gpt-3.5-turbo": 0.2,
  "gpt-4o-mini": 0.25,
  "gpt-4o-nano": 0.15,
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
    return parsed as ParsedRequestPayload;
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
    if (parsedBody.messages) {
      for (const message of parsedBody.messages) {
        if (typeof message?.content === "string") {
          contentText += message.content;
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
  if (!providerName) {
    return null;
  }

  const config = findModelProviderConfig(model, providerName);
  if (!config || typeof config.contextLength !== "number") {
    return null;
  }

  return config.contextLength;
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

  for (const canonicalModel of providerModelsResult.data.values()) {
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

  const delimiterParts = lower.split(/[:\/]/);
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

export function applyTruncateStrategy(
  parsedBody: ParsedRequestPayload
): ValidRequestBody | undefined {
  if (!parsedBody.messages) {
    return;
  }

  for (const message of parsedBody.messages) {
    if (typeof message?.content === "string") {
      message.content = truncateAndNormalizeText(message.content);
    }
  }

  return JSON.stringify(parsedBody);
}

export function applyMiddleOutStrategy(
  parsedBody: ParsedRequestPayload,
  primaryModel: string,
  tokenLimit: number
): ValidRequestBody | undefined {
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
        },
        primaryModel
      )
  );

  const changed =
    JSON.stringify(trimmedMessages) !== JSON.stringify(originalMessages);
  if (!changed) {
    return;
  }

  const finalPayload: ParsedRequestPayload = {
    ...parsedBody,
    messages: trimmedMessages,
  };

  return JSON.stringify(finalPayload);
}

export function applyFallbackStrategy(
  parsedBody: ParsedRequestPayload,
  primaryModel: string,
  estimatedTokens: number,
  tokenLimit: number
): ValidRequestBody | undefined {
  const fallbackModel = selectFallbackModel(parsedBody.model);
  if (!fallbackModel) {
    return;
  }

  if (estimatedTokens >= tokenLimit) {
    parsedBody.model = fallbackModel;

    return JSON.stringify(parsedBody);
  }

  parsedBody.model = primaryModel;
  return JSON.stringify(parsedBody);
}
