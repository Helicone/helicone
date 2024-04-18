import { getTokenCount } from "../../utils/helpers";
import { PromiseGenericResult, err, ok } from "../modules/result";
import { IBodyProcessor } from "../shared/bodyProcessors/IBodyProcessor";
import { AnthropicBodyProcessor as ClaudeBodyProcessor } from "../shared/bodyProcessors/anthropicBodyProcessor";
import { AnthropicStreamBodyProcessor } from "../shared/bodyProcessors/anthropicStreamBodyProcessor";
import { GenericBodyProcessor } from "../shared/bodyProcessors/genericBodyProcessor";
import { GoogleBodyProcessor } from "../shared/bodyProcessors/googleBodyProcessor";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class ResponseBodyHandler extends AbstractLogHandler {
  public async handle(context: HandlerContext): Promise<void> {
    const processedResponseBody = await this.mapResponseBody(context);

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

  private async mapResponseBody(
    context: HandlerContext
  ): PromiseGenericResult<any> {
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

    // TODO: Potentially return the error as data instead
    if (processedResponseBody.error || !processedResponseBody.data) {
      return err("Error processing response body");
    }

    return ok(processedResponseBody.data);
  }

  async processBody(
    isStream: boolean,
    provider: string,
    requestModel: string,
    responseBody: string,
    requestBody: string
  ): PromiseGenericResult<any> {
    try {
      const parser = this.getBodyProcessor(isStream, provider, responseBody);
      return parser.parse({
        responseBody: responseBody,
        requestBody: requestBody,
        tokenCounter: async (text: string) =>
          await getTokenCount(text, provider),
        model: requestModel,
      });
    } catch (error: any) {
      return err(`Error parsing body: ${error}, ${responseBody}`);
    }
  }

  getBodyProcessor(
    isStream: boolean,
    provider: string,
    body: any
  ): IBodyProcessor {
    if (!isStream && provider === "ANTHROPIC" && body) {
      return new ClaudeBodyProcessor();
    } else if (!isStream && provider === "GOOGLE") {
      return new GoogleBodyProcessor();
    } else if (isStream && provider === "ANTHROPIC") {
      return new AnthropicStreamBodyProcessor();
    } else {
      return new GenericBodyProcessor();
    }
  }
}
