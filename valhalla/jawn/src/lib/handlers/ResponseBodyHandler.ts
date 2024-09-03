import { unsupportedImage } from "../../utils/helpers";
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

  return (
    responseBody.includes("<html") ||
    responseBody.includes("<HTML") ||
    responseBody.includes("<!DOCTYPE html>")
  );
}

export class ResponseBodyHandler extends AbstractLogHandler {
  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    try {
      const processedResponseBody = await this.processBody(context);
      context.processedLog.response.model = getModelFromResponse(
        processedResponseBody.data?.processedBody
      );
      context.processedLog.model =
        calculateModel(
          context.processedLog.request.model,
          context.processedLog.response.model,
          context.message.heliconeMeta.modelOverride
        ) ?? undefined;

      const omittedResponseBody = this.handleOmitResponseBody(
        context,
        processedResponseBody,
        context.processedLog.response.model
      );

      const { body: responseBodyFinal, assets: responseBodyAssets } =
        this.processResponseBodyImages(
          context.message.log.response.id,
          omittedResponseBody,
          context.processedLog.model
        );

      console.log("responseBodyFinal", responseBodyFinal);
      if (this.isAssistantResponse(responseBodyFinal)) {
        const existingProperties =
          context.processedLog.request.properties || {};
        const newProperties = this.processAssistantResponseMetadata(
          responseBodyFinal,
          existingProperties
        );
        console.log("newProperties", newProperties);
        context.processedLog.request.properties = {
          ...existingProperties,
          ...newProperties,
        };
      }

      // Set processed response body
      context.processedLog.response.assets = responseBodyAssets;
      context.processedLog.assets = new Map([
        ...(context.processedLog.request.assets ?? []),
        ...(context.processedLog.response.assets ?? []),
      ]);
      context.processedLog.response.body = responseBodyFinal;

      // Set usage
      const usage = processedResponseBody.data?.usage ?? {};
      context.usage.completionTokens = usage.completionTokens;
      context.usage.promptTokens = usage.promptTokens;
      context.usage.totalTokens = usage.totalTokens;
      context.usage.heliconeCalculated = usage.heliconeCalculated;
      context.usage.cost = usage.cost;

      return await super.handle(context);
    } catch (error: any) {
      return err(
        `Error processing response body: ${error}, Context: ${this.constructor.name}`
      );
    }
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

    imageModelParsingResponse.body = unsupportedImage(
      imageModelParsingResponse.body
    );

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

      const parser = this.getBodyProcessor(isStream, provider, responseBody);
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
    return (
      responseBody.hasOwnProperty("assistant_id") ||
      responseBody.data?.[0]?.hasOwnProperty("assistant_id")
    );
  }

  private processAssistantResponseMetadata(
    responseBody: any,
    existingProperties: Record<string, string>
  ): Record<string, string> {
    const processMetadata = (metadata: any) => {
      return Object.entries(metadata || {})
        .filter(([key]) => key.toLowerCase().startsWith("helicone"))
        .reduce((acc, [key, value]) => {
          if (!(key in existingProperties)) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>);
    };

    if (Array.isArray(responseBody.data)) {
      const assistantListItem = responseBody.data.find(
        (x: any) => x.metadata && Object.keys(x.metadata).length > 0
      );
      return assistantListItem
        ? processMetadata(assistantListItem.metadata)
        : {};
    } else if (responseBody.data?.metadata) {
      return processMetadata(responseBody.data.metadata);
    } else if (responseBody.metadata) {
      return processMetadata(responseBody.metadata);
    }

    return {};
  }

  getBodyProcessor(
    isStream: boolean,
    provider: string,
    responseBody: any
  ): IBodyProcessor {
    if (!isStream && provider === "ANTHROPIC" && responseBody) {
      return new AnthropicBodyProcessor();
    } else if (!isStream && provider === "GOOGLE") {
      return new GoogleBodyProcessor();
    } else if (isStream && provider === "ANTHROPIC") {
      return new AnthropicStreamBodyProcessor();
    } else if (isStream && provider === "GOOGLE") {
      return new GoogleStreamBodyProcessor();
    } else if (isStream && provider === "TOGETHER") {
      return new TogetherAIStreamProcessor();
    } else if (isStream) {
      return new OpenAIStreamProcessor();
    } else {
      console.log("Using generic body processor");
      return new GenericBodyProcessor();
    }
  }
}
