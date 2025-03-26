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
import { GoogleBodyProcessor } from "../shared/bodyProcessors/googleBodyProcessor";
import { GoogleStreamBodyProcessor } from "../shared/bodyProcessors/googleStreamBodyProcessor";
import { GroqStreamProcessor } from "../shared/bodyProcessors/groqStreamProcessor";
import { OpenAIStreamProcessor } from "../shared/bodyProcessors/openAIStreamProcessor";
import { TogetherAIStreamProcessor } from "../shared/bodyProcessors/togetherAIStreamProcessor";
import { ImageModelParsingResponse } from "../shared/imageParsers/core/parsingResponse";
import { getResponseImageModelParser } from "../shared/imageParsers/parserMapper";
import { PromiseGenericResult, Result, err, ok } from "../shared/result";
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
    try {
      const processedResponseBody = await this.processBody(context);
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

      // Set usage
      const usage =
        processedResponseBody.data?.usage ??
        processedResponseBody.data?.processedBody?.usage ??
        {};
      context.usage.completionTokens = usage.completionTokens;
      context.usage.promptTokens = usage.promptTokens;
      context.usage.totalTokens = usage.totalTokens;
      context.usage.heliconeCalculated = usage.heliconeCalculated;
      context.usage.cost = usage.cost;
      context.usage.promptCacheWriteTokens = usage.promptCacheWriteTokens;
      context.usage.promptCacheReadTokens = usage.promptCacheReadTokens;

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

    let match = path.match(regex1);

    if (!match) {
      match = path.match(regex2);
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
          : processedResponseBody.data?.processedBody ?? undefined,
      };
    } else {
      return omitResponseLog
        ? {
            model: responseModel, // Put response model here, not calculated model
          }
        : processedResponseBody.data.processedBody ?? undefined;
    }
  }

  async processBody(
    context: HandlerContext
  ): PromiseGenericResult<ParseOutput> {
    const log = context.message.log;
    const isStream =
      log.request.isStream || context.processedLog.request.body?.stream;

    const provider = log.request.provider;

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
    return (
      responseBody.hasOwnProperty("_type") && responseBody._type === "vector_db"
    );
  }

  private isToolResponse(responseBody: any): boolean {
    return (
      responseBody.hasOwnProperty("_type") && responseBody._type === "tool"
    );
  }

  private determineAssistantModel(
    responseBody: any,
    currentModel?: string
  ): { responseModel: string; model: string } {
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
    provider: string,
    responseBody: any,
    model?: string
  ): IBodyProcessor {
    if (!isStream && provider === "ANTHROPIC" && responseBody) {
      return new AnthropicBodyProcessor();
    } else if (!isStream && provider === "GOOGLE") {
      return new GoogleBodyProcessor();
    } else if (
      isStream &&
      (provider === "ANTHROPIC" || model?.includes("claude"))
    ) {
      return new AnthropicStreamBodyProcessor();
    } else if (isStream && provider === "GOOGLE") {
      return new GoogleStreamBodyProcessor();
    } else if (isStream && provider === "TOGETHER") {
      return new TogetherAIStreamProcessor();
    } else if (isStream && provider === "GROQ") {
      return new GroqStreamProcessor();
    } else if (isStream) {
      return new OpenAIStreamProcessor();
    } else {
      return new GenericBodyProcessor();
    }
  }
}
