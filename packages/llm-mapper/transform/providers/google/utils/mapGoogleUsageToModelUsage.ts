import { GoogleUsageMetadata, GoogleTokenDetail } from "../../../types/google";
import { ModelUsage, ModalityUsage } from "@helicone-package/cost/usage/types";

type Modality = GoogleTokenDetail["modality"];

function aggregateByModality(
  details: GoogleTokenDetail[] | undefined
): Map<Modality, number> {
  const map = new Map<Modality, number>();
  for (const detail of details ?? []) {
    const current = map.get(detail.modality) ?? 0;
    map.set(detail.modality, current + (detail.tokenCount ?? 0));
  }
  return map;
}

function getTextTokens(map: Map<Modality, number>): number {
  return (
    (map.get("TEXT") ?? 0) +
    (map.get("MODALITY_UNSPECIFIED") ?? 0)
  );
}

function buildModalityUsage(
  promptByModality: Map<Modality, number>,
  cacheByModality: Map<Modality, number>,
  outputByModality: Map<Modality, number>,
  modality: Modality
): ModalityUsage | undefined {
  const prompt = promptByModality.get(modality) ?? 0;
  const cached = cacheByModality.get(modality) ?? 0;
  const output = outputByModality.get(modality) ?? 0;

  if (prompt === 0 && cached === 0 && output === 0) {
    return undefined;
  }

  return {
    input: Math.max(0, prompt - cached),
    cachedInput: cached,
    output,
  };
}

/**
 * Converts GoogleUsageMetadata to normalized ModelUsage.
 *
 * The calculation is straightforward per modality:
 * - Input = promptTokensDetails[modality] - cacheTokensDetails[modality]
 * - Cached Input = cacheTokensDetails[modality]
 * - Output = candidatesTokensDetails[modality]
 * - Thinking = thoughtsTokenCount
 *
 * Falls back to top-level counts if no modality details are available.
 */
export function mapGoogleUsageToModelUsage(
  usage: GoogleUsageMetadata
): ModelUsage {
  // Collect all token details, handling both singular and plural key variants
  const promptDetails =
    usage.promptTokenDetails ?? usage.promptTokensDetails ?? [];
  const toolUsePromptDetails = usage.toolUsePromptTokensDetails ?? [];
  const cacheDetails = usage.cacheTokenDetails ?? [];
  const outputDetails = usage.candidatesTokensDetails ?? [];

  // Aggregate tokens by modality
  const promptByModality = aggregateByModality([
    ...promptDetails,
    ...toolUsePromptDetails,
  ]);
  const cacheByModality = aggregateByModality(cacheDetails);
  const outputByModality = aggregateByModality(outputDetails);

  // Check if we have modality details or should fall back to top-level counts
  const hasPromptDetails = promptDetails.length > 0 || toolUsePromptDetails.length > 0;
  const hasOutputDetails = outputDetails.length > 0;

  // Text tokens from modality breakdown
  const textPrompt = getTextTokens(promptByModality);
  const textCached = getTextTokens(cacheByModality);
  const textOutput = getTextTokens(outputByModality);

  // Fall back to top-level counts when no modality details exist
  const toolUsePromptTokens = usage.toolUsePromptTokenCount ?? 0;
  const promptTokens = hasPromptDetails
    ? textPrompt
    : (usage.promptTokenCount ?? 0) + toolUsePromptTokens;
  const outputTokens = hasOutputDetails ? textOutput : (usage.candidatesTokenCount ?? 0);
  const cachedTokens = textCached > 0 ? textCached : (usage.cachedContentTokenCount ?? 0);

  // Build ModelUsage with text as base input/output
  const modelUsage: ModelUsage = {
    input: Math.max(0, promptTokens - cachedTokens),
    output: outputTokens,
  };

  // Cache details for text
  if (cachedTokens > 0) {
    modelUsage.cacheDetails = { cachedInput: cachedTokens };
  }

  // Thinking tokens
  if (usage.thoughtsTokenCount && usage.thoughtsTokenCount > 0) {
    modelUsage.thinking = usage.thoughtsTokenCount;
  }

  // Per-modality breakdown
  const audio = buildModalityUsage(
    promptByModality,
    cacheByModality,
    outputByModality,
    "AUDIO"
  );
  const image = buildModalityUsage(
    promptByModality,
    cacheByModality,
    outputByModality,
    "IMAGE"
  );
  const video = buildModalityUsage(
    promptByModality,
    cacheByModality,
    outputByModality,
    "VIDEO"
  );
  // DOCUMENT in Google maps to "file" in our ModelUsage
  const file = buildModalityUsage(
    promptByModality,
    cacheByModality,
    outputByModality,
    "DOCUMENT"
  );

  if (audio) modelUsage.audio = audio;
  if (image) modelUsage.image = image;
  if (video) modelUsage.video = video;
  if (file) modelUsage.file = file;

  return modelUsage;
}
