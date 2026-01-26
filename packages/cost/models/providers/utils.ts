/**
 * Check if a provider/model combination natively supports the Responses API format.
 * Models that natively support Responses API should NOT have their request/response
 * converted to/from Chat Completions format.
 *
 * Currently supported:
 * - OpenAI provider (all models)
 * - Helicone provider with GPT models (providerModelId contains "gpt" or "/gt")
 *   Note: Helicone uses obfuscated model IDs like "pa/gt-4.1-m" for GPT 4.1 models
 *
 * @param provider - The provider name
 * @param providerModelId - The provider-specific model ID
 * @returns true if the model natively supports Responses API format
 */
export function nativelySupportsResponsesAPI(
  provider: string,
  providerModelId: string
): boolean {
  return (
    provider === "openai" ||
    (provider === "helicone" &&
      (providerModelId.includes("gpt") || providerModelId.includes("/gt")))
  );
}
