type UsageDetails = {
  cached_tokens?: number;
  audio_tokens?: number;
  cache_write_tokens?: number;
  cache_write_details?: {
    write_5m_tokens?: number;
    write_1h_tokens?: number;
  };
};

type CacheTokenUsage = {
  promptTokens: number;
  cachedTokens: number;
  promptAudioTokens: number;
  cacheWrite5mTokens: number;
  cacheWrite1hTokens: number;
};

function toFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function firstFiniteNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const numberValue = toFiniteNumber(value);
    if (numberValue !== undefined) {
      return numberValue;
    }
  }
  return undefined;
}

export function getCacheTokenUsage(usage: any): CacheTokenUsage {
  const promptDetails: UsageDetails =
    usage?.prompt_tokens_details || usage?.input_tokens_details || {};

  const cacheHitTokens =
    firstFiniteNumber(
      promptDetails.cached_tokens,
      usage?.cache_read_input_tokens,
      usage?.prompt_cache_hit_tokens,
    ) ?? 0;

  const cacheMissTokens = toFiniteNumber(usage?.prompt_cache_miss_tokens);
  const promptTokens =
    firstFiniteNumber(
      usage?.prompt_tokens,
      usage?.input_tokens,
      cacheMissTokens !== undefined
        ? cacheHitTokens + cacheMissTokens
        : undefined,
    ) ?? 0;

  const cacheWriteTokensTotal =
    firstFiniteNumber(
      promptDetails.cache_write_tokens,
      usage?.cache_creation_input_tokens,
    ) ?? 0;
  const cacheWriteDetails = promptDetails.cache_write_details;

  return {
    promptTokens,
    cachedTokens: cacheHitTokens,
    promptAudioTokens: firstFiniteNumber(promptDetails.audio_tokens) ?? 0,
    cacheWrite5mTokens:
      firstFiniteNumber(cacheWriteDetails?.write_5m_tokens) ??
      cacheWriteTokensTotal,
    cacheWrite1hTokens:
      firstFiniteNumber(cacheWriteDetails?.write_1h_tokens) ?? 0,
  };
}

export function getEffectivePromptTokens({
  promptTokens,
  cachedTokens,
  promptAudioTokens,
}: Pick<
  CacheTokenUsage,
  "promptTokens" | "cachedTokens" | "promptAudioTokens"
>): number {
  return cachedTokens > promptTokens
    ? Math.max(0, promptTokens - promptAudioTokens)
    : Math.max(0, promptTokens - cachedTokens - promptAudioTokens);
}
