import { getTokenCount } from "../../utils/helpers";
import { getModelFromResponse } from "../../utils/modelMapper";
import { PromiseGenericResult, err, ok } from "../modules/result";
import {
  IBodyProcessor,
  ParseOutput,
} from "../shared/bodyProcessors/IBodyProcessor";
import { AnthropicBodyProcessor } from "../shared/bodyProcessors/anthropicBodyProcessor";
import { AnthropicStreamBodyProcessor } from "../shared/bodyProcessors/anthropicStreamBodyProcessor";
import { GenericBodyProcessor } from "../shared/bodyProcessors/genericBodyProcessor";
import { GoogleBodyProcessor } from "../shared/bodyProcessors/googleBodyProcessor";
import { OpenAIStreamProcessor } from "../shared/bodyProcessors/openAIStreamProcessor";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { BatchContext } from "./BatchContext";
import { MessageContext } from "./MessageContext";

export const INTERNAL_ERRORS = {
  Cancelled: -3,
};

// Pulls out usage
// Some modification to body
export class ResponseBodyHandler extends AbstractLogHandler {
  public async handle(context: MessageContext): Promise<void> {
    const request = context.message.log.request;
    const response = context.message.log.response;
    const heliconeMeta = context.message.heliconeMeta;
    const isStream = request.isStream;

    const processedResponseBody = await this.processBody(
      isStream,
      request.provider,
      request.model,
      response.body,
      request.body
    );

    const model = getModelFromResponse(processedResponseBody.data);
    if (processedResponseBody.error) {
      console.error(
        "Error processing response body",
        processedResponseBody.error
      );

      context.processedResponseBody = heliconeMeta.omitResponseLog
        ? {
            model: model,
          }
        : processedResponseBody.data;
    } else {
      context.processedResponseBody = processedResponseBody.data;
    }

    return super.handle(context);
  }

  async processBody(
    isStream: boolean,
    provider: string,
    requestModel: string,
    responseBody: string,
    requestBody: string
  ): PromiseGenericResult<ParseOutput> {
    try {
      responseBody = this.preprocess(isStream, 200, responseBody);
      const parser = this.getBodyProcessor(isStream, provider, responseBody);
      return await parser.parse({
        responseBody: responseBody,
        requestBody: requestBody,
        tokenCounter: async (text: string) =>
          await getTokenCount(text, provider),
        model: requestModel,
      });
    } catch (error: any) {
      console.log("Error parsing response", error);
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
    } else if (isStream) {
      return new OpenAIStreamProcessor();
    } else {
      return new GenericBodyProcessor();
    }
  }
}
