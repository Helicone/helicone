import { getTokenCount } from "../../utils/helpers";
import {
  IBodyProcessor,
  ParseOutput,
} from "../shared/bodyProcessors/IBodyProcessor";
import { AnthropicBodyProcessor } from "../shared/bodyProcessors/anthropicBodyProcessor";
import { AnthropicStreamBodyProcessor } from "../shared/bodyProcessors/anthropicStreamBodyProcessor";
import { GenericBodyProcessor } from "../shared/bodyProcessors/genericBodyProcessor";
import { GoogleBodyProcessor } from "../shared/bodyProcessors/googleBodyProcessor";
import { OpenAIStreamProcessor } from "../shared/bodyProcessors/openAIStreamProcessor";
import { PromiseGenericResult, err } from "../shared/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext, Usage } from "./HandlerContext";

export const INTERNAL_ERRORS = {
  Cancelled: -3,
};

// Pulls out usage
// Some modification to body
export class ResponseBodyHandler extends AbstractLogHandler {
  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    console.log(`ResponseBodyHandler: ${context.message.log.request.id}`);
    try {
      const omitResponseLog = context.message.heliconeMeta.omitResponseLog;

      const processedResponseBody = await this.processBody(context);
      if (
        processedResponseBody.error ||
        !processedResponseBody?.data?.processedBody
      ) {
        console.error(
          "Error processing response body",
          processedResponseBody.error
        );

        context.processedLog.response.body = {
          helicone_error: "error parsing response",
          parse_response_error: processedResponseBody.error,
          body: omitResponseLog
            ? {
                model: context.message.log.response.model, // Put response model here, not calculated model
              }
            : processedResponseBody.data?.processedBody ?? undefined,
        };
      } else {
        context.processedLog.response.body = omitResponseLog
          ? {
              model: context.message.log.response.model, // Put response model here, not calculated model
            }
          : processedResponseBody.data.processedBody ?? undefined;
      }

      this.setUsage(processedResponseBody.data?.usage ?? {}, context);

      return await super.handle(context);
    } catch (error: any) {
      return err(
        `Error processing response body: ${error}, Context: ${this.constructor.name}`
      );
    }
  }

  private setUsage(usage: Usage, context: HandlerContext) {
    context.usage.completionTokens = usage.completionTokens;
    context.usage.promptTokens = usage.promptTokens;
    context.usage.totalTokens = usage.totalTokens;
    context.usage.heliconeCalculated = usage.heliconeCalculated;
    context.usage.cost = usage.cost;
  }

  async processBody(
    context: HandlerContext
  ): PromiseGenericResult<ParseOutput> {
    const log = context.message.log;
    const isStream = log.request.isStream;
    const provider = log.request.provider;

    let responseBody = context.rawLog.rawResponseBody;
    try {
      responseBody = this.preprocess(
        isStream,
        log.response.status,
        responseBody
      );
      const parser = this.getBodyProcessor(isStream, provider, responseBody);
      return await parser.parse({
        responseBody: responseBody,
        requestBody: responseBody,
        tokenCounter: async (text: string) =>
          await getTokenCount(text, provider),
        model: log.model,
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
