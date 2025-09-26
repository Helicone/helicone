import {
  calculateModel,
  getModelFromResponse,
  isResponseImageModel,
} from "../../utils/modelMapper";
import {
  IBodyProcessor,
  ParseOutput,
} from "../shared/bodyProcessors/IBodyProcessor";
import { AnthropicBodyProcessor } from "../shared/bodyProcessors/anthropicBodyProcessor";
import { AnthropicStreamBodyProcessor } from "../shared/bodyProcessors/anthropicStreamBodyProcessor";
import { GenericBodyProcessor } from "../shared/bodyProcessors/genericBodyProcessor";
import { LlamaBodyProcessor } from "../shared/bodyProcessors/llamaBodyProcessor";
import { LlamaStreamBodyProcessor } from "../shared/bodyProcessors/llamaStreamBodyProcessor";
import { GoogleBodyProcessor } from "../shared/bodyProcessors/googleBodyProcessor";
import { GoogleStreamBodyProcessor } from "../shared/bodyProcessors/googleStreamBodyProcessor";
import { GroqStreamProcessor } from "../shared/bodyProcessors/groqStreamProcessor";
import { BedrockStreamProcessor } from "../shared/bodyProcessors/bedrockStreamProcessor";
import { OpenAIStreamProcessor } from "../shared/bodyProcessors/openAIStreamProcessor";
import { TogetherAIStreamProcessor } from "../shared/bodyProcessors/togetherAIStreamProcessor";
import { VercelBodyProcessor } from "../shared/bodyProcessors/vercelBodyProcessor";
import { VercelStreamProcessor } from "../shared/bodyProcessors/vercelStreamProcessor";
import { ImageModelParsingResponse } from "../shared/imageParsers/core/parsingResponse";
import { getResponseImageModelParser } from "../shared/imageParsers/parserMapper";
import {
  PromiseGenericResult,
  Result,
  err,
  ok,
} from "../../packages/common/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import { getUsageProcessor } from "@helicone-package/cost";
import {
  modelCost,
  modelCostBreakdownFromRegistry,
} from "@helicone-package/cost/costCalc";
import { getProvider, heliconeProviderToModelProviderName } from "@helicone-package/cost/models/provider-helpers";
import { ResponseFormat } from "@helicone-package/cost/models/types";

export const INTERNAL_ERRORS = {
  Cancelled: -3,
};

function isJson(responseBody: string): boolean {
  try {
    JSON.parse(responseBody);
    return true;
  } catch (error) {
    return false;
  }
}

function isHTML(responseBody: string): boolean {
  if (isJson(responseBody)) {
    return false;
  }

  const htmlIndicators = [
    "<html",
    "<HTML",
    "<!DOCTYPE html>",
    "<!DOCTYPE HTML>",
    "<body",
    "<BODY",
    "<head",
    "<HEAD",
    "<?xml",
  ];
  return htmlIndicators.some((indicator) => responseBody.startsWith(indicator));
}

export class ResponseBodyHandler extends AbstractLogHandler {
  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();
    context.timingMetrics.push({
      constructor: this.constructor.name,
      start,
    });

    try {
      const processedResponseBody = await this.processBody(context);
      if (processedResponseBody.data?.statusOverride) {
        context.message.log.response.status =
          processedResponseBody.data.statusOverride;
      }
      context.processedLog.response.model = getModelFromResponse(
        processedResponseBody.data?.processedBody
      );

      const definedModel =
        calculateModel(
          context.processedLog.request.model,
          context.processedLog.response.model,
          context.message.heliconeMeta.modelOverride,
          this.getModelFromPath(context.message.log.request.path)
        ) ?? undefined;

      if (typeof context.processedLog.response.model !== "string") {
        context.processedLog.response.model = "unknown";
      }
      const omittedResponseBody = this.handleOmitResponseBody(
        context,
        processedResponseBody,
        context.processedLog.response.model
      );

      const { body: responseBodyFinal, assets: responseBodyAssets } =
        this.processResponseBodyImages(
          context.message.log.response.id,
          omittedResponseBody,
          definedModel
        );

      // Set processed response body
      context.processedLog.response.assets = responseBodyAssets;
      context.processedLog.assets = new Map([
        ...(context.processedLog.request.assets ?? []),
        ...(context.processedLog.response.assets ?? []),
      ]);
      context.processedLog.response.body = responseBodyFinal;

      const { responseModel, model } = this.determineAssistantModel(
        responseBodyFinal,
        definedModel
      );

      context.processedLog.response.model = responseModel;
      if (typeof model === "string") {
        context.processedLog.model = model;
      }

      // Set legacy usage values captured from body processors
      const legacyUsage =
        processedResponseBody.data?.usage ??
        processedResponseBody.data?.processedBody?.usage ??
        {};
      context.legacyUsage.completionTokens = legacyUsage.completionTokens;
      context.legacyUsage.promptTokens = legacyUsage.promptTokens;
      context.legacyUsage.totalTokens = legacyUsage.totalTokens;
      context.legacyUsage.heliconeCalculated = legacyUsage.heliconeCalculated;
      context.legacyUsage.promptCacheWriteTokens =
        legacyUsage.promptCacheWriteTokens;
      context.legacyUsage.promptCacheReadTokens =
        legacyUsage.promptCacheReadTokens;
      context.legacyUsage.promptAudioTokens = legacyUsage.promptAudioTokens;
      context.legacyUsage.completionAudioTokens =
        legacyUsage.completionAudioTokens;
      context.legacyUsage.promptCacheWrite5m = legacyUsage.promptCacheWrite5m;
      context.legacyUsage.promptCacheWrite1h = legacyUsage.promptCacheWrite1h;
      if (typeof legacyUsage.cost === "number" && legacyUsage.cost) {
        context.legacyUsage.cost = legacyUsage.cost;
      } else {
        const cost = modelCost({
          model: context.processedLog.model ?? "",
          provider: context.message.log.request.provider ?? "",
          sum_prompt_tokens: legacyUsage.promptTokens ?? 0,
          prompt_cache_write_tokens: legacyUsage.promptCacheWriteTokens ?? 0,
          prompt_cache_read_tokens: legacyUsage.promptCacheReadTokens ?? 0,
          prompt_audio_tokens: legacyUsage.promptAudioTokens ?? 0,
          sum_completion_tokens: legacyUsage.completionTokens ?? 0,
          completion_audio_tokens: legacyUsage.completionAudioTokens ?? 0,
          prompt_cache_write_5m: legacyUsage.promptCacheWrite5m ?? 0,
          prompt_cache_write_1h: legacyUsage.promptCacheWrite1h ?? 0,
        });

        context.legacyUsage.cost = cost;
      }

      // Parse structured usage via the registry-aware processors when available
      const gatewayProvider = context.message.heliconeMeta.gatewayProvider;
      const provider = gatewayProvider ?? heliconeProviderToModelProviderName(context.message.log.request.provider);
      const rawResponse = context.rawLog.rawResponseBody;
      if (provider && rawResponse) {
        const usageProcessor = getUsageProcessor(provider);
        if (usageProcessor) {
          const parsedUsage = await usageProcessor.parse({
            responseBody: rawResponse,
            isStream: context.message.log.request.isStream,
            model: context.processedLog.model ?? "",
          });
          if (parsedUsage.error !== null) {
            console.error(
              `Error parsing structured usage for provider ${provider}: ${parsedUsage.error}`
            );
          } else if (parsedUsage.data) {
            context.usage = parsedUsage.data ?? null;

            const providerModelId =
              context.message.heliconeMeta.providerModelId ?? "";

            const breakdown = modelCostBreakdownFromRegistry({
              modelUsage: parsedUsage.data,
              providerModelId,
              provider,
            });

            if (breakdown) {
              context.costBreakdown = breakdown;
            }
          }
        }
      }

      return await super.handle(context);
    } catch (error: any) {
      return err(
        `Error processing response body: ${error}, Context: ${this.constructor.name}`
      );
    }
  }

  private getModelFromPath(path: string): string {
    const regex1 = /\/engines\/([^/]+)/;
    const regex2 = /models\/([^/:]+)/;
    const regex3 = /\/model\/([^/:]+)/; // Add regex for Bedrock runtime paths

    let match = path.match(regex1);

    if (!match) {
      match = path.match(regex2);
    }

    if (!match) {
      match = path.match(regex3);
    }

    if (match && match[1]) {
      return match[1];
    }

    return "";
  }
  private processResponseBodyImages(
    responseId: string,
    responseBody: any,
    model?: string
  ): ImageModelParsingResponse {
    let imageModelParsingResponse: ImageModelParsingResponse = {
      body: responseBody,
      assets: new Map<string, string>(),
    };

    if (model && isResponseImageModel(model)) {
      const imageModelParser = getResponseImageModelParser(model, responseId);
      if (imageModelParser) {
        imageModelParsingResponse =
          imageModelParser.processResponseBody(responseBody);
      }
    }

    return imageModelParsingResponse;
  }

  private handleOmitResponseBody(
    context: HandlerContext,
    processedResponseBody: Result<ParseOutput, string>,
    responseModel: any
  ) {
    const omitResponseLog = context.message.heliconeMeta.omitResponseLog;

    if (
      processedResponseBody.error ||
      !processedResponseBody?.data?.processedBody
    ) {
      console.error(
        "Error processing response body",
        processedResponseBody.error
      );

      return {
        helicone_error: "error parsing response",
        parse_response_error: processedResponseBody.error,
        body: omitResponseLog
          ? {
              model: responseModel, // Put response model here, not calculated model
            }
          : (processedResponseBody.data?.processedBody ?? undefined),
      };
    } else {
      return omitResponseLog
        ? {
            model: responseModel, // Put response model here, not calculated model
          }
        : (processedResponseBody.data.processedBody ?? undefined);
    }
  }

  async processBody(
    context: HandlerContext
  ): PromiseGenericResult<ParseOutput> {
    const log = context.message.log;
    const isStream =
      log.request.isStream || context.processedLog.request.body?.stream;

    const isAIGateway = log.request.requestReferrer === "ai-gateway";
    // gatewayProvider and gatewayResponseFromat are always set for AI Gateway requests
    // but tie all values to the isAIGateway flag to avoid edge cases
    const provider = isAIGateway 
      ? context.message.heliconeMeta.gatewayProvider ?? log.request.provider 
      : log.request.provider;
    const gatewayResponseFormat = isAIGateway
      ? context.message.heliconeMeta.gatewayResponseFormat
      : undefined;

    let responseBody = context.rawLog.rawResponseBody;
    const requestBody = context.rawLog.rawRequestBody;

    if (!responseBody) {
      console.log("No response body found");
      return ok({
        processedBody: {},
        usage: {},
      });
    }

    try {
      if (isHTML(responseBody)) {
        return ok({
          processedBody: {
            error: `HTML response detected:`,
            html_response: `${responseBody}`,
          },
          usage: {},
        });
      }
      responseBody = this.preprocess(
        isStream,
        log.response.status,
        responseBody
      );
      const model = context.processedLog.model;
      const parser = this.getBodyProcessor(
        isStream,
        provider,
        responseBody,
        isAIGateway,
        gatewayResponseFormat,
        model,
      );
      return await parser.parse({
        responseBody: responseBody,
        requestBody: requestBody ?? "{}",
        requestModel: context.processedLog.request.model,
        modelOverride: context.message.heliconeMeta.modelOverride,
      });
    } catch (error: any) {
      return err(`Error parsing body: ${error}, ${responseBody}`);
    }
  }

  preprocess(
    isStream: boolean,
    responseStatus: number,
    responseBody: string
  ): string {
    if (isStream && responseStatus === INTERNAL_ERRORS["Cancelled"]) {
      // Remove last line of stream from result
      return responseBody.split("\n").slice(0, -1).join("\n");
    }

    return responseBody;
  }

  private isAssistantResponse(responseBody: any): boolean {
    if (typeof responseBody !== "object" || responseBody === null) {
      return false;
    }
    return (
      responseBody.hasOwnProperty("assistant_id") ||
      responseBody.hasOwnProperty("thread_id") ||
      responseBody.data?.[0]?.hasOwnProperty("assistant_id") ||
      responseBody.hasOwnProperty("metadata")
    );
  }

  private isVectorDBResponse(responseBody: any): boolean {
    if (typeof responseBody !== "object" || responseBody === null) {
      return false;
    }
    return (
      responseBody.hasOwnProperty("_type") && responseBody._type === "vector_db"
    );
  }

  private isToolResponse(responseBody: any): boolean {
    if (typeof responseBody !== "object" || responseBody === null) {
      return false;
    }
    return (
      responseBody.hasOwnProperty("_type") && responseBody._type === "tool"
    );
  }

  private determineAssistantModel(
    responseBody: any,
    currentModel?: string
  ): { responseModel: string; model: string } {
    if (typeof responseBody !== "object" || responseBody === null) {
      return { responseModel: "Unknown", model: "unknown" };
    }
    if (
      this.isAssistantResponse(responseBody) &&
      responseBody.hasOwnProperty("status") &&
      ["queued", "in_progress"].includes(responseBody.status)
    ) {
      return { responseModel: "Assistant Polling", model: "assistant-polling" };
    } else if (this.isAssistantResponse(responseBody) && !currentModel) {
      return { responseModel: "Assistant Call", model: "assistant-call" };
    } else if (this.isVectorDBResponse(responseBody)) {
      return { responseModel: "Vector DB", model: "vector_db" };
    } else if (this.isToolResponse(responseBody)) {
      return {
        responseModel: "Tool",
        model: `tool:${responseBody.toolName}`,
      };
    }
    return { responseModel: currentModel || "", model: currentModel || "" };
  }

  getBodyProcessor(
    isStream: boolean,
    providerString: string,
    responseBody: any,
    isAIGateway: boolean,
    gatewayResponseFormat: ResponseFormat | undefined,
    model?: string,
  ): IBodyProcessor {
    if (!isStream) {
      if (isAIGateway && gatewayResponseFormat) {
        switch (gatewayResponseFormat) {
          case "ANTHROPIC":
            return new AnthropicBodyProcessor();
          default:
            return new GenericBodyProcessor();
        }
      }
      if (providerString === "ANTHROPIC" && responseBody) {
        return new AnthropicBodyProcessor();
      }
      if (providerString === "LLAMA") {
        return new LlamaBodyProcessor();
      }
      if (providerString === "GOOGLE") {
        return new GoogleBodyProcessor();
      }
      if (providerString === "VERCEL") {
        // Check if it's actually a stream by content
        if (
          typeof responseBody === "string" &&
          responseBody.includes("data: {") &&
          responseBody.includes('"type":')
        ) {
          return new VercelStreamProcessor();
        }
        return new VercelBodyProcessor();
      }
    }

    if (isStream) {
      if (isAIGateway && gatewayResponseFormat) {
        switch (gatewayResponseFormat) {
          case "ANTHROPIC":
            return new AnthropicStreamBodyProcessor();
          default:
            return new OpenAIStreamProcessor();
        }
      }
      if (providerString === "ANTHROPIC" || model?.includes("claude")) {
        return new AnthropicStreamBodyProcessor();
      }
      if (providerString === "LLAMA") {
        return new LlamaStreamBodyProcessor();
      }
      if (providerString === "GOOGLE") {
        return new GoogleStreamBodyProcessor();
      }
      if (providerString === "TOGETHER") {
        return new TogetherAIStreamProcessor();
      }
      if (providerString === "GROQ") {
        return new GroqStreamProcessor();
      }
      if (providerString === "VERCEL") {
        return new VercelStreamProcessor();
      }
      if (providerString === "AWS" || providerString === "BEDROCK") {
        return new BedrockStreamProcessor();
      }
      return new OpenAIStreamProcessor();
    }

    return new GenericBodyProcessor();
  }
}
