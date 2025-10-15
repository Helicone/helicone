// This will store all of the information coming from the client.

import { Provider } from "@helicone-package/llm-mapper/types";
import { approvedDomains } from "@helicone-package/cost/providers/mappings";
import { registry } from "@helicone-package/cost/models/registry";
import { heliconeProviderToModelProviderName } from "@helicone-package/cost/models/provider-helpers";
import type { ModelProviderName } from "@helicone-package/cost/models/providers";
import type { ModelProviderConfig } from "@helicone-package/cost/models/types";
import { RequestWrapper } from "../RequestWrapper";
import { buildTargetUrl } from "../clients/ProviderClient";
import { Result, ok } from "../util/results";
import {
  HeliconeTokenLimitExceptionHandler,
  IHeliconeHeaders,
} from "./HeliconeHeaders";

import { parseJSXObject } from "@helicone/prompts";
import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { MAPPERS } from "@helicone-package/llm-mapper/utils/getMappedContent";
import { getMapperType } from "@helicone-package/llm-mapper/utils/getMapperType";
import { RateLimitOptions } from "../clients/DurableObjectRateLimiterClient";
import { RateLimitOptionsBuilder } from "../util/rateLimitOptions";
import { EscrowInfo } from "../ai-gateway/types";
import { ValidRequestBody } from "../../RequestBodyBuffer/IRequestBodyBuffer";

export type RetryOptions = {
  retries: number; // number of times to retry the request
  factor: number; // exponential backoff factor
  minTimeout: number; // minimum amount of time to wait before retrying (in milliseconds)
  maxTimeout: number; // maximum amount of time to wait before retrying (in milliseconds)
};

export type HeliconeProperties = Record<string, string>;
type Nullable<T> = T | null;

const DEFAULT_TOKEN_HEURISTIC = 0.25;

const MODEL_TOKEN_HEURISTICS: Record<string, number> = {
  "gpt-4o": 0.25,
  "gpt-3.5-turbo": 0.2,
  "gpt-4o-mini": 0.25,
  "gpt-4o-nano": 0.15,
  "gpt-o3": 0.25,
};

type ParsedRequestPayload = {
  model?: string;
  messages?: LLMMessage[];
  tools?: unknown;
};

export type LLMMessage = {
  role?: string;
  content?: unknown;
  [key: string]: unknown;
};

const NORMALIZATION_PATTERNS: Array<[RegExp, string]> = [
  [/<!--[\s\S]*?-->/g, ""], // strip HTML comments
  [/\b(id|uuid):[a-f0-9-]{36}\b/gi, ""], // remove UUID-like identifiers
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

/**
 * Produces a compact representation of a text body by collapsing whitespace,
 * stripping superfluous formatting, and optionally trimming the result.
 */
export function truncateAndNormalizeText(
  input: string | null | undefined
): string {
  console.log("input", input);
  if (!input) {
    return "";
  }

  let normalized = input;

  console.log("original text", normalized);

  for (const [pattern, replacement] of NORMALIZATION_PATTERNS) {
    normalized = normalized.replace(pattern, replacement);
  }

  normalized = normalized.replace(/\s+/g, " ").trim();

  console.log("truncated text", normalized);

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

  // Helper to rebuild a candidate messages array from kept chunks
  // while preserving roles and non-string contents.
  type Chunk = {
    messageIndex: number;
    order: number; // original order within the message
    content: string;
  };

  const original: T[] = messages.slice();

  // Build chunk list from all string contents, preserving message index and order.
  // Use a recursive, separator-aware splitter akin to LangChain's RecursiveCharacterTextSplitter
  // to prefer breaking on paragraphs/lines/words before characters.
  const DEFAULT_CHUNK_SIZE = 1000;
  const DEFAULT_CHUNK_OVERLAP = 0; // avoid overlap to prevent duplication when removing chunks
  const DEFAULT_SEPARATORS = ["\n\n", "\n", ".", " ", ""]; // paragraph -> line -> sentence -> word -> char

  function splitTextRecursive(
    text: string,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
    chunkOverlap: number = DEFAULT_CHUNK_OVERLAP,
    separators: string[] = DEFAULT_SEPARATORS
  ): string[] {
    if (chunkSize <= 0) return [text];
    if (text.length <= chunkSize) return [text];

    // choose first separator found in text; fallback to char-level
    let chosenSep = separators.find((s) => s !== "" && text.includes(s));
    if (chosenSep === undefined) chosenSep = "";

    const splits = chosenSep === "" ? text.split("") : text.split(chosenSep);
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
          // rebuild current with overlap from the end
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

  // If there are no string chunks, fall back to removing entire messages
  // (previous behavior). This handles non-string content gracefully.
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

  // Helper: rebuild messages from a set of kept chunks.
  function buildMessagesFromKept(kept: Set<number>): T[] {
    // Map messageIndex -> concatenated content from kept chunks (in order)
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

  // Helper: candidate with only one specific chunk, for per-chunk token estimate.
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

  // Compute baseline (tokens with tools etc., but no message text).
  const baseTokens = estimateTokens([]) ?? 0;

  // Start with all chunks kept.
  const kept = new Set<number>(chunks.map((_, i) => i));

  // Current estimate with everything kept.
  let currentEstimate = estimateTokens(buildMessagesFromKept(kept));
  if (currentEstimate === null || currentEstimate <= maxTokens) {
    return buildMessagesFromKept(kept);
  }

  // Remove middle chunks iteratively until under limit or nothing left.
  // Always target the current middle of the remaining kept chunk indexes.
  while (
    kept.size > 0 &&
    (currentEstimate ?? Number.MAX_SAFE_INTEGER) > maxTokens
  ) {
    const keptIndexes = Array.from(kept).sort((a, b) => a - b);
    const mid = keptIndexes[Math.floor(keptIndexes.length / 2)];

    // Estimate how many tokens this middle chunk contributes.
    const onlyChunkTokens =
      (estimateTokens(buildMessagesWithOnlyChunk(mid)) ?? baseTokens) -
      baseTokens;

    kept.delete(mid);

    // Update currentEstimate by subtracting the chunk’s contribution; fallback to recompute if null.
    if (currentEstimate !== null) {
      currentEstimate = Math.max(
        baseTokens,
        currentEstimate - Math.max(0, onlyChunkTokens)
      );
    } else {
      currentEstimate = estimateTokens(buildMessagesFromKept(kept));
    }

    // Safety: if estimate behaves oddly, recompute occasionally.
    if (kept.size % 8 === 0) {
      currentEstimate = estimateTokens(buildMessagesFromKept(kept));
    }
  }

  // Build final messages and filter out any emptied string-content messages for cleanliness.
  const finalMessages = buildMessagesFromKept(kept).filter((m) => {
    if (typeof (m as any)?.content === "string") {
      return ((m as any).content as string).length > 0;
    }
    return true; // keep non-string content messages
  });

  return finalMessages as T[];
}

// This neatly formats and holds all of the state that a request can come into Helicone
export interface HeliconeProxyRequest {
  provider: Provider;
  tokenCalcUrl: Env["TOKEN_COUNT_URL"];
  rateLimitOptions: Nullable<RateLimitOptions>;
  isRateLimitedKey: boolean;
  retryOptions: IHeliconeHeaders["retryHeaders"];
  omitOptions: IHeliconeHeaders["omitHeaders"];

  body: ValidRequestBody;
  unsafeGetBodyText: () => Promise<string | null>;

  heliconeErrors: string[];
  providerAuthHash?: string;
  heliconeProxyKeyId?: string;
  api_base: string;
  heliconeProperties: HeliconeProperties;
  userId?: string;
  isStream: boolean;
  startTime: Date;
  url: URL;
  requestWrapper: RequestWrapper;
  requestId: string;
  nodeId: string | null;
  heliconePromptTemplate: TemplateWithInputs | null;
  targetUrl: URL;
  threat?: boolean;
  flaggedForModeration?: boolean;
  cf?: CfProperties;
  escrowInfo?: EscrowInfo;
}

const providerBaseUrlMappings: Record<
  "OPENAI" | "ANTHROPIC" | "CUSTOM",
  string
> = {
  OPENAI: "https://api.openai.com",
  ANTHROPIC: "https://api.anthropic.com",
  CUSTOM: "",
};

// Helps map a RequestWrapper -> HeliconProxyRequest
export class HeliconeProxyRequestMapper {
  private tokenCalcUrl: string;
  heliconeErrors: string[] = [];

  constructor(
    private request: RequestWrapper,
    private provider: Provider,
    private env: Env,
    private escrowInfo?: EscrowInfo
  ) {
    this.tokenCalcUrl = env.VALHALLA_URL;
  }

  private getTokenHeuristic(model: string | null | undefined): number {
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

  private extractModelCandidates(modelField: unknown): string[] {
    if (typeof modelField !== "string") {
      return [];
    }

    return modelField
      .split(",")
      .map((candidate) => candidate.trim())
      .filter((candidate) => candidate.length > 0);
  }

  private getPrimaryModel(modelField: unknown): string | null {
    const candidates = this.extractModelCandidates(modelField);
    return candidates[0] ?? null;
  }

  private selectFallbackModel(modelField: unknown): string | null {
    const candidates = this.extractModelCandidates(modelField);
    if (candidates.length === 0) {
      return null;
    }

    // Prefer the second candidate if present, otherwise fall back to the first.
    return candidates[1] ?? candidates[0];
  }

  private serializeTools(tools: unknown): string {
    if (!tools) {
      return "";
    }

    if (typeof tools === "string") {
      return tools;
    }

    try {
      return JSON.stringify(tools);
    } catch (error) {
      console.error("[Helicone] Failed to serialize tools for token estimate");
      return "";
    }
  }

  private parseRequestPayload(
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
      console.error("[Helicone] Failed to parse request body", error);
      return null;
    }
  }

  private estimateTokenCount(
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
      const toolsText = this.serializeTools(parsedBody.tools);

      const combinedText = [toolsText, contentText]
        .filter((segment) => segment.length > 0)
        .join(" ");

      const heuristic = this.getTokenHeuristic(primaryModel ?? undefined);
      const estimated = Math.ceil(
        (combinedText.length + toolsText.length) * heuristic
      );

      console.log("estimatedToken count", estimated);

      return Number.isFinite(estimated) ? estimated : null;
    } catch (error) {
      console.error("[Helicone] Failed to estimate request token usage", error);
      return null;
    }
  }

  private getModelTokenLimit(model: string | null | undefined): number | null {
    if (!model) {
      return null;
    }

    const providerName = heliconeProviderToModelProviderName(this.provider);
    if (!providerName) {
      return null;
    }

    const config = this.findModelProviderConfig(model, providerName);
    if (!config || typeof config.contextLength !== "number") {
      return null;
    }

    return config.contextLength;
  }

  private findModelProviderConfig(
    model: string,
    providerName: ModelProviderName
  ): ModelProviderConfig | null {
    const directConfig = this.lookupProviderConfig(model, providerName);
    if (directConfig) {
      return directConfig;
    }

    return this.searchProviderModels(model, providerName);
  }

  private lookupProviderConfig(
    model: string,
    providerName: ModelProviderName
  ): ModelProviderConfig | null {
    const candidates = this.buildLookupCandidates(model);
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

  private searchProviderModels(
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

        if (this.modelIdentifierMatches(model, config.providerModelId)) {
          return config;
        }
      }
    }

    return null;
  }

  private buildLookupCandidates(model: string): string[] {
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

  private modelIdentifierMatches(
    requestModel: string,
    providerModelId: string
  ): boolean {
    const requestVariants = this.buildModelIdentifierVariants(requestModel);
    const providerVariants = this.buildModelIdentifierVariants(providerModelId);

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

    const sanitizedRequest = this.sanitizeModelIdentifier(requestModel);
    const sanitizedProvider = this.sanitizeModelIdentifier(providerModelId);

    if (sanitizedRequest.length === 0 || sanitizedProvider.length === 0) {
      return false;
    }

    const index = sanitizedRequest.indexOf(sanitizedProvider);
    if (index > 0) {
      return true;
    }

    return false;
  }

  private buildModelIdentifierVariants(identifier: string): string[] {
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

  private sanitizeModelIdentifier(identifier: string): string {
    return identifier.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  private resolvePrimaryModel(
    parsedBody: ParsedRequestPayload | null
  ): string | null {
    const headerModel = this.getPrimaryModel(
      this.request.heliconeHeaders.modelOverride
    );

    if (!parsedBody) {
      return headerModel;
    }

    const bodyModel = this.getPrimaryModel(parsedBody.model);
    return bodyModel ?? headerModel;
  }

  private async getHeliconeTemplate() {
    if (this.request.heliconeHeaders.promptHeaders.promptId) {
      try {
        const rawJson = JSON.parse(
          await this.request.requestBodyBuffer.unsafeGetRawText()
        );

        // Get the mapper type based on the request
        const mapperType = getMapperType({
          model: rawJson.model,
          provider: this.provider,
          path: this.request.url.pathname,
          requestReferrer: this.request.requestReferrer,
        });

        // Map the request using the appropriate mapper
        const mapper = MAPPERS[mapperType];
        if (!mapper) {
          console.error(`No mapper found for type ${mapperType}`);
          return null;
        }

        const mappedResult = mapper({
          request: rawJson,
          response: { choices: [] },
          statusCode: 200,
          model: rawJson.model,
        });

        // parseJSX only on the messages to avoid tools from being touched
        const parsedJSXMessages = parseJSXObject(
          JSON.parse(JSON.stringify(mappedResult.schema.request.messages))
        );

        const templateWithInputs = {
          inputs:
            this.request.promptSettings.promptInputs ??
            parsedJSXMessages.templateWithInputs.inputs,
          autoInputs: parsedJSXMessages.templateWithInputs.autoInputs,
          template: {
            ...mappedResult.schema.request,
            messages: parsedJSXMessages.templateWithInputs.template,
          },
        };
        return templateWithInputs;
      } catch (error) {
        console.error("Error in getHeliconeTemplate:", error);
        return null;
      }
    }
    return null;
  }
  async tryToProxyRequest(): Promise<Result<HeliconeProxyRequest, string>> {
    const startTime = new Date();
    const { data: api_base, error: api_base_error } = this.getApiBase();
    if (api_base_error !== null) {
      return { data: null, error: api_base_error };
    }

    const targetUrl = buildTargetUrl(this.request.url, api_base);

    let isStream = await this.request.requestBodyBuffer.isStream();

    if (this.provider === "GOOGLE") {
      const queryParams = new URLSearchParams(targetUrl.search);
      // alt = sse is how Gemini determines if a request is a stream
      isStream = isStream || queryParams.get("alt") === "sse";
    }

    if (this.provider === "AWS" || this.provider === "BEDROCK") {
      isStream =
        isStream || targetUrl.pathname.includes("invoke-with-response-stream");
    }

    let body: ValidRequestBody;
    try {
      body = await this.request.safelyGetBody();
    } catch (e) {
      body = await this.request.unsafeGetBodyText();
    }

    const bodyWithTokenLimitExceptionHandler =
      this.applyTokenLimitExceptionHandler(body);
    if (bodyWithTokenLimitExceptionHandler) {
      body = bodyWithTokenLimitExceptionHandler;
    }

    return {
      data: {
        heliconePromptTemplate: await this.getHeliconeTemplate(),
        rateLimitOptions: this.rateLimitOptions(),
        isRateLimitedKey:
          this.request.heliconeHeaders.heliconeAuthV2?.keyType ===
          "rate-limited",
        retryOptions: this.request.heliconeHeaders.retryHeaders,
        provider: this.provider,
        tokenCalcUrl: this.tokenCalcUrl,
        providerAuthHash: await this.request.getProviderAuthHeader(),
        omitOptions: this.request.heliconeHeaders.omitHeaders,
        heliconeProxyKeyId: this.request.heliconeProxyKeyId,
        heliconeProperties: this.request.heliconeHeaders.heliconeProperties,
        userId: await this.request.getUserId(),
        heliconeErrors: this.heliconeErrors,
        api_base,
        isStream: isStream,
        body: body,
        unsafeGetBodyText: this.request.unsafeGetBodyText.bind(this.request),

        startTime,
        url: this.request.url,
        requestId:
          this.request.heliconeHeaders.requestId ?? crypto.randomUUID(),
        requestWrapper: this.request,
        nodeId: this.request.heliconeHeaders.nodeId ?? null,
        targetUrl,
        cf: this.request.cf ?? undefined,
        escrowInfo: this.escrowInfo,
      },
      error: null,
    };
  }

  public applyTokenLimitExceptionHandler(
    body: ValidRequestBody
  ): ValidRequestBody | undefined {
    const handler = this.request.heliconeHeaders.tokenLimitExceptionHandler;
    if (!handler) {
      return;
    }

    const parsedBody = this.parseRequestPayload(body);
    if (!parsedBody) {
      return;
    }

    const primaryModel = this.resolvePrimaryModel(parsedBody);
    const estimatedTokens = this.estimateTokenCount(parsedBody, primaryModel);

    if (!primaryModel) {
      return;
    }

    const tokenLimit = this.getModelTokenLimit(primaryModel);

    if (
      estimatedTokens === null ||
      tokenLimit === null ||
      estimatedTokens <= tokenLimit
    ) {
      return;
    }

    console.log("primaryModel", primaryModel);
    console.log("estimatedTokens", estimatedTokens);
    console.log("tokenLimit", tokenLimit);

    switch (handler) {
      case HeliconeTokenLimitExceptionHandler.Truncate:
        console.log("[Helicone] token limit exception handler: Truncate");
        return this.applyTruncateStrategy(parsedBody);
      case HeliconeTokenLimitExceptionHandler.MiddleOut:
        console.log("[Helicone] token limit exception handler: MiddleOut");
        return this.applyMiddleOutStrategy(
          parsedBody,
          primaryModel,
          tokenLimit
        );
      case HeliconeTokenLimitExceptionHandler.Fallback:
        console.log("[Helicone] token limit exception handler: Fallback");
        return this.applyFallbackStrategy(
          parsedBody,
          primaryModel,
          estimatedTokens,
          tokenLimit
        );
      default:
        return;
    }
  }

  private applyTruncateStrategy(
    parsedBody: ParsedRequestPayload
  ): ValidRequestBody | undefined {
    console.log("applyTruncateStrategy", parsedBody.messages);
    if (!parsedBody.messages) {
      return;
    }

    for (const message of parsedBody.messages) {
      if (typeof message?.content === "string") {
        message.content = truncateAndNormalizeText(message.content);
      }
    }

    return;
  }

  private applyMiddleOutStrategy(
    parsedBody: ParsedRequestPayload,
    primaryModel: string,
    tokenLimit: number
  ): ValidRequestBody | undefined {
    if (!Array.isArray(parsedBody.messages)) {
      console.log("parsedbody.messages not array, quitting");
      return;
    }

    const originalMessages = (parsedBody.messages ?? []) as LLMMessage[];
    console.log("originalMessages", originalMessages);

    const trimmedMessages = middleOutMessagesToFitLimit(
      originalMessages,
      tokenLimit,
      (candidate) =>
        this.estimateTokenCount(
          {
            ...parsedBody,
            messages: candidate,
          },
          primaryModel
        )
    );

    console.log("trimmedMessages", trimmedMessages);

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

  private applyFallbackStrategy(
    parsedBody: ParsedRequestPayload,
    primaryModel: string,
    estimatedTokens: number,
    tokenLimit: number
  ): ValidRequestBody | undefined {
    const fallbackModel = this.selectFallbackModel(parsedBody.model);
    if (!fallbackModel) {
      return;
    }

    if (estimatedTokens >= tokenLimit) {
      parsedBody.model = fallbackModel;

      this.request.injectCustomProperty(
        "Helicone-Token-Fallback-Model",
        fallbackModel
      );

      return JSON.stringify(parsedBody);
    }

    parsedBody.model = primaryModel;
    return JSON.stringify(parsedBody);
  }

  private validateApiConfiguration(api_base: string | undefined): boolean {
    return (
      api_base === undefined ||
      approvedDomains.some((domain) => domain.test(api_base))
    );
  }

  private getApiBase(): Result<string, string> {
    if (this.request.baseURLOverride) {
      return ok(this.request.baseURLOverride);
    }
    const api_base =
      this.request.heliconeHeaders.openaiBaseUrl ??
      this.request.heliconeHeaders.targetBaseUrl;

    if (api_base && !this.validateApiConfiguration(api_base)) {
      // return new Response(`Invalid API base "${api_base}"`, {
      return {
        data: null,
        error: `Invalid API base "${api_base}"`,
      };
    }

    // this is kind of legacy stuff. the correct way to add providers is to add it to `modifyEnvBasedOnPath` (04/28/2024)
    if (api_base) {
      return { data: api_base, error: null };
    } else if (
      this.provider === "CUSTOM" ||
      this.provider === "ANTHROPIC" ||
      this.provider === "OPENAI"
    ) {
      return {
        data: providerBaseUrlMappings[this.provider],
        error: null,
      };
    } else {
      return {
        data: null,
        error: `Invalid provider "${this.provider}"`,
      };
    }
  }

  rateLimitOptions(): HeliconeProxyRequest["rateLimitOptions"] {
    const rateLimitOptions = new RateLimitOptionsBuilder(
      this.request.heliconeHeaders.rateLimitPolicy
    ).build();

    if (rateLimitOptions.error) {
      rateLimitOptions.error = `Invalid rate limit policy: ${rateLimitOptions.error}`;
      this.heliconeErrors.push(rateLimitOptions.error);
    }
    return rateLimitOptions.data ?? null;
  }
}
