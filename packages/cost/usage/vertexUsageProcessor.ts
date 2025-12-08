import { IUsageProcessor, ParseInput } from "./IUsageProcessor";
import { ModelUsage } from "./types";
import { Result } from "../../common/result";
import { BedrockUsageProcessor } from "./bedrockUsageProcessor";
import { OpenAIUsageProcessor } from "./openAIUsageProcessor";
import {
  GoogleResponseBody,
  GoogleTokenDetail,
  GoogleUsageMetadata,
} from "@helicone-package/llm-mapper/transform/types/google";

type ModalityTotals = Partial<Record<GoogleTokenDetail["modality"], number>>;

function aggregateModalityTokens(
  ...detailLists: Array<GoogleTokenDetail[] | undefined>
): ModalityTotals {
  const totals: ModalityTotals = {};

  for (const list of detailLists) {
    for (const detail of list ?? []) {
      if (!detail) continue;
      const modality = detail.modality;
      const tokenCount = detail.tokenCount ?? 0;
      totals[modality] = (totals[modality] ?? 0) + tokenCount;
    }
  }

  return totals;
}

function sumTokens(details?: GoogleTokenDetail[]): number {
  return (
    details?.reduce((total, detail) => total + (detail?.tokenCount ?? 0), 0) ??
    0
  );
}

function sumTextTokens(totals: ModalityTotals, fallbackTotal: number): number {
  const textLike =
    (totals.TEXT ?? 0) +
    (totals.DOCUMENT ?? 0) +
    (totals.MODALITY_UNSPECIFIED ?? 0);

  if (textLike > 0) {
    return textLike;
  }

  const nonText =
    (totals.AUDIO ?? 0) + (totals.IMAGE ?? 0) + (totals.VIDEO ?? 0);
  return Math.max(fallbackTotal - nonText, 0);
}

export class VertexOpenAIUsageProcessor extends OpenAIUsageProcessor {
  protected extractUsageFromResponse(response: GoogleResponseBody): ModelUsage {
    const usage: GoogleUsageMetadata | undefined = response.usageMetadata;
    if (!usage) {
      return {
        input: 0,
        output: 0,
      };
    }

    const promptDetails =
      usage.promptTokenDetails ?? usage.promptTokensDetails ?? [];
    const toolUsePromptDetails = usage.toolUsePromptTokensDetails ?? [];
    const completionDetails = usage.candidatesTokensDetails ?? [];
    const cacheDetails = usage.cacheTokenDetails ?? [];

    const promptModalityTotals = aggregateModalityTokens(
      promptDetails,
      toolUsePromptDetails
    );
    const completionModalityTotals = aggregateModalityTokens(completionDetails);
    const cacheModalityTotals = aggregateModalityTokens(cacheDetails);

    const promptAudioTokens = promptModalityTotals.AUDIO ?? 0;
    const promptImageTokens = promptModalityTotals.IMAGE ?? 0;
    const promptVideoTokens = promptModalityTotals.VIDEO ?? 0;

    const completionAudioTokens = completionModalityTotals.AUDIO ?? 0;
    const completionImageTokens = completionModalityTotals.IMAGE ?? 0;
    const completionVideoTokens = completionModalityTotals.VIDEO ?? 0;

    const cacheTextTokens =
      (cacheModalityTotals.TEXT ?? 0) +
      (cacheModalityTotals.DOCUMENT ?? 0) +
      (cacheModalityTotals.MODALITY_UNSPECIFIED ?? 0);

    const toolUsePromptTokens = usage.toolUsePromptTokenCount ?? 0;
    let promptTokenCount =
      (usage.promptTokenCount ?? 0) + toolUsePromptTokens;

    let completionTokenCount =
      usage.candidatesTokenCount ??
      Math.max((usage.totalTokenCount ?? 0) - promptTokenCount, 0);

    // Reconcile token counts when they don't match the total
    // This ensures accurate cost attribution between prompt and completion
    const totalTokenCount = usage.totalTokenCount ?? promptTokenCount + completionTokenCount;
    const accountedTokens = promptTokenCount + completionTokenCount;
    if (totalTokenCount > 0 && accountedTokens !== totalTokenCount) {
      if (accountedTokens < totalTokenCount) {
        // We have unaccounted tokens - add them to completion if candidatesTokenCount was missing
        if (usage.candidatesTokenCount === undefined) {
          completionTokenCount += totalTokenCount - accountedTokens;
        } else {
          promptTokenCount += totalTokenCount - accountedTokens;
        }
      } else {
        // We have more accounted tokens than total - reduce accordingly
        const overflow = accountedTokens - totalTokenCount;
        const promptReduction = Math.min(
          overflow,
          toolUsePromptTokens > 0 ? toolUsePromptTokens : promptTokenCount
        );
        promptTokenCount -= promptReduction;
        const remainingOverflow = overflow - promptReduction;
        if (remainingOverflow > 0) {
          completionTokenCount = Math.max(0, completionTokenCount - remainingOverflow);
        }
      }
    }

    const promptTextTokens = sumTextTokens(
      promptModalityTotals,
      promptTokenCount
    );
    const completionTextTokens = sumTextTokens(
      completionModalityTotals,
      completionTokenCount
    );

    const cachedTokens =
      usage.cachedContentTokenCount ?? sumTokens(cacheDetails);

    const effectivePromptTextTokens = Math.max(
      0,
      promptTextTokens - cacheTextTokens
    );
    const effectiveCompletionTextTokens = Math.max(0, completionTextTokens);

    const modelUsage: ModelUsage = {
      input: effectivePromptTextTokens,
      output: effectiveCompletionTextTokens,
    };

    if (cachedTokens > 0) {
      modelUsage.cacheDetails = {
        cachedInput: cachedTokens,
      };
    }

    const reasoningTokens = usage.thoughtsTokenCount ?? 0;
    if (reasoningTokens > 0) {
      modelUsage.thinking = reasoningTokens;
    }

    if (promptAudioTokens > 0 || completionAudioTokens > 0) {
      modelUsage.audio = promptAudioTokens + completionAudioTokens;
    }

    if (promptImageTokens > 0 || completionImageTokens > 0) {
      modelUsage.image = promptImageTokens + completionImageTokens;
    }

    if (promptVideoTokens > 0 || completionVideoTokens > 0) {
      modelUsage.video = promptVideoTokens + completionVideoTokens;
    }

    return modelUsage;
  }

  protected consolidateStreamData(streamData: any[]): any {
    // Handle native Google/Vertex stream format (usageMetadata on chunks)
    const googleUsageChunk = [...streamData]
      .reverse()
      .find((chunk) => chunk?.usageMetadata);
    if (googleUsageChunk) {
      return googleUsageChunk;
    }

    return super.consolidateStreamData(streamData);
  }
}

export class VertexUsageProcessor implements IUsageProcessor {
  public async parse(
    parseInput: ParseInput
  ): Promise<Result<ModelUsage, string>> {
    if (parseInput.model.includes("claude")) {
      // Both bedrock and vertex don't support 1h buckets like Anthropic does.
      // bedrock and vertex use the same usage format for claude models.
      return new BedrockUsageProcessor().parse(parseInput);
    } else {
      return new VertexOpenAIUsageProcessor().parse(parseInput);
    }
  }
}

