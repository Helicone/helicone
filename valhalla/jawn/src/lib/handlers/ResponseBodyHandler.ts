import { getTokenCount } from "../../utils/helpers";
import { PromiseGenericResult, err, ok } from "../modules/result";
import { IBodyProcessor } from "../shared/bodyProcessors/IBodyProcessor";
import { AnthropicBodyProcessor } from "../shared/bodyProcessors/anthropicBodyProcessor";
import { AnthropicStreamBodyProcessor } from "../shared/bodyProcessors/anthropicStreamBodyProcessor";
import { GenericBodyProcessor } from "../shared/bodyProcessors/genericBodyProcessor";
import { GoogleBodyProcessor } from "../shared/bodyProcessors/googleBodyProcessor";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export const INTERNAL_ERRORS = {
  Cancelled: -3,
};

// Pulls out usage
// Some modification to body
export class ResponseBodyHandler extends AbstractLogHandler {
  public async handle(context: HandlerContext): Promise<void> {
    const request = context.message.log.request;
    const response = context.message.log.response;
    const isStream = request.isStream;

    const processedResponseBody = await this.processBody(
      isStream,
      request.provider,
      request.model,
      response.body,
      request.body
    );

    if (processedResponseBody.error) {
      console.error(
        "Error processing response body",
        processedResponseBody.error
      );
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
  ): PromiseGenericResult<any> {
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
    } else {
      return new GenericBodyProcessor();
    }
  }
}
