import { getUsageProcessor } from "@helicone-package/cost";
import {
  modelCost,
  modelCostBreakdownFromRegistry,
} from "@helicone-package/cost/costCalc";
import { heliconeProviderToModelProviderName } from "@helicone-package/cost/models/provider-helpers";
import { IUsageProcessor } from "@helicone-package/cost/usage/IUsageProcessor";
import { OpenAIUsageProcessor } from "@helicone-package/cost/usage/openAIUsageProcessor";
import {
  PromiseGenericResult,
  Result,
  err,
  ok,
} from "../../packages/common/result";
import { calculateModel, getModelFromResponse } from "../../utils/modelMapper";
import {
  IBodyProcessor,
  ParseOutput,
} from "../shared/bodyProcessors/IBodyProcessor";
import { AnthropicBodyProcessor } from "../shared/bodyProcessors/anthropicBodyProcessor";
import { AnthropicStreamBodyProcessor } from "../shared/bodyProcessors/anthropicStreamBodyProcessor";
import { BedrockStreamProcessor } from "../shared/bodyProcessors/bedrockStreamProcessor";
import { GenericBodyProcessor } from "../shared/bodyProcessors/genericBodyProcessor";
import { GoogleBodyProcessor } from "../shared/bodyProcessors/googleBodyProcessor";
import { GoogleStreamBodyProcessor } from "../shared/bodyProcessors/googleStreamBodyProcessor";
import { GroqStreamProcessor } from "../shared/bodyProcessors/groqStreamProcessor";
import { LlamaBodyProcessor } from "../shared/bodyProcessors/llamaBodyProcessor";
import { LlamaStreamBodyProcessor } from "../shared/bodyProcessors/llamaStreamBodyProcessor";
import { OpenAIStreamProcessor } from "../shared/bodyProcessors/openAIStreamProcessor";
import { TogetherAIStreamProcessor } from "../shared/bodyProcessors/togetherAIStreamProcessor";
import { VercelBodyProcessor } from "../shared/bodyProcessors/vercelBodyProcessor";
import { VercelStreamProcessor } from "../shared/bodyProcessors/vercelStreamProcessor";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

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
      // Get model from response body, or fall back to Worker-provided model when body isn't stored
      context.processedLog.response.model =
        getModelFromResponse(processedResponseBody.data?.processedBody) ||
        context.message.log.response.model;

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
      const responseBodyFinal = this.handleOmitResponseBody(
        context,
        processedResponseBody,
        context.processedLog.response.model
      );

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
      // Fall back to Worker-provided tokens when body isn't stored (free tier limit exceeded)
      const legacyUsage =
        processedResponseBody.data?.usage ??
        processedResponseBody.data?.processedBody?.usage ??
        {};
      context.legacyUsage.completionTokens =
        legacyUsage.completionTokens ??
        context.message.log.response.completionTokens;
      context.legacyUsage.promptTokens =
        legacyUsage.promptTokens ?? context.message.log.response.promptTokens;
      context.legacyUsage.totalTokens =
        legacyUsage.totalTokens ??
        ((context.legacyUsage.promptTokens ?? 0) +
          (context.legacyUsage.completionTokens ?? 0) ||
          undefined);
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
        // Use context.legacyUsage which has Worker-provided tokens as fallback
        const cost = modelCost({
          model: context.processedLog.model ?? "",
          provider: context.message.log.request.provider ?? "",
          sum_prompt_tokens: context.legacyUsage.promptTokens ?? 0,
          prompt_cache_write_tokens: context.legacyUsage.promptCacheWriteTokens ?? 0,
          prompt_cache_read_tokens: context.legacyUsage.promptCacheReadTokens ?? 0,
          prompt_audio_tokens: context.legacyUsage.promptAudioTokens ?? 0,
          sum_completion_tokens: context.legacyUsage.completionTokens ?? 0,
          completion_audio_tokens: context.legacyUsage.completionAudioTokens ?? 0,
          prompt_cache_write_5m: context.legacyUsage.promptCacheWrite5m ?? 0,
          prompt_cache_write_1h: context.legacyUsage.promptCacheWrite1h ?? 0,
        });

        context.legacyUsage.cost = cost;
      }

      // Parse structured usage via the registry-aware processors when available
      const gatewayProvider = context.message.heliconeMeta.gatewayProvider;
      const provider =
        gatewayProvider ??
        heliconeProviderToModelProviderName(
          context.message.log.request.provider
        );
      const rawResponse = context.rawLog.rawResponseBody;
      const isAIGateway =
        context.message.log.request.requestReferrer === "ai-gateway";

      if (provider && rawResponse) {
        let usageProcessor: IUsageProcessor | null;
        if (isAIGateway) {
          // AI Gateway always uses OpenAI processor
          usageProcessor = new OpenAIUsageProcessor();
        } else {
          usageProcessor = getUsageProcessor(provider);
        }

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
              context.message.heliconeMeta.providerModelId ??
              (!isAIGateway ? context.processedLog.model : "") ??
              "";

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
        log.request.provider,
        responseBody,
        isAIGateway,
        model
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

  private isDataResponse(responseBody: any): boolean {
    if (typeof responseBody !== "object" || responseBody === null) {
      return false;
    }
    return (
      responseBody.hasOwnProperty("_type") && responseBody._type === "data"
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
    } else if (this.isDataResponse(responseBody)) {
      return {
        responseModel: "Data",
        model: `data:${responseBody.name}`,
      };
    }
    return { responseModel: currentModel || "", model: currentModel || "" };
  }

  getBodyProcessor(
    isStream: boolean,
    provider: string,
    responseBody: any,
    isAIGateway: boolean,
    model?: string
  ): IBodyProcessor {
    if (!isStream) {
      if (isAIGateway) {
        return new GenericBodyProcessor();
      }
      if (provider === "ANTHROPIC" && responseBody) {
        return new AnthropicBodyProcessor();
      }
      if (provider === "LLAMA") {
        return new LlamaBodyProcessor();
      }
      if (provider === "GOOGLE") {
        return new GoogleBodyProcessor();
      }
      if (provider === "VERCEL") {
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
      if (isAIGateway) {
        return new OpenAIStreamProcessor();
      }
      if (provider === "ANTHROPIC" || model?.includes("claude")) {
        return new AnthropicStreamBodyProcessor();
      }
      if (provider === "LLAMA") {
        return new LlamaStreamBodyProcessor();
      }
      if (provider === "GOOGLE") {
        return new GoogleStreamBodyProcessor();
      }
      if (provider === "TOGETHER") {
        return new TogetherAIStreamProcessor();
      }
      if (provider === "GROQ") {
        return new GroqStreamProcessor();
      }
      if (provider === "VERCEL") {
        return new VercelStreamProcessor();
      }
      if (provider === "AWS" || provider === "BEDROCK") {
        return new BedrockStreamProcessor();
      }
      return new OpenAIStreamProcessor();
    }

    return new GenericBodyProcessor();
  }
}
