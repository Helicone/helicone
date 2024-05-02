import { tryParse, unsupportedImage } from "../../utils/helpers";
import {
  getModelFromRequest,
  isRequestImageModel,
} from "../../utils/modelMapper";
import { ImageModelParsingResponse } from "../shared/imageParsers/core/parsingResponse";
import { getRequestImageModelParser } from "../shared/imageParsers/parserMapper";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class RequestBodyHandler extends AbstractLogHandler {
  async handle(context: HandlerContext): PromiseGenericResult<string> {
    console.log(`RequestBodyHandler: ${context.message.log.request.id}`);
    try {
      const { body: processedBody, model: requestModel } =
        this.processRequestBody(context);

      const { body: requestBodyFinal, assets: requestBodyAssets } =
        this.processRequestBodyImages(processedBody, requestModel);

      context.processedLog.request.assets = requestBodyAssets;
      context.processedLog.request.body = requestBodyFinal;
      context.processedLog.request.model = requestModel;

      return await super.handle(context);
    } catch (error: any) {
      return err(
        `Error processing request body: ${error}, Context: ${this.constructor.name}`
      );
    }
  }

  processRequestBody(context: HandlerContext): {
    body: any;
    model: string | undefined;
  } {
    const log = context.message.log;
    let rawRequestBody = context.rawLog.rawRequestBody;

    if (!rawRequestBody) {
      console.log("No request body found");
      return {
        body: {},
        model: getModelFromRequest("{}", log.request.path),
      };
    }

    const cleanedRequestBody = this.cleanRequestBody(rawRequestBody);
    let parsedRequestBody = tryParse(cleanedRequestBody, "request body");

    const requestModel = getModelFromRequest(
      parsedRequestBody,
      log.request.path
    );

    parsedRequestBody = context.message.heliconeMeta.omitRequestLog
      ? {
          model: requestModel, // Put request model here, not calculated model
        }
      : parsedRequestBody;

    return {
      body: parsedRequestBody,
      model: requestModel,
    };
  }

  private processRequestBodyImages(
    requestBody: any,
    model?: string
  ): ImageModelParsingResponse {
    let imageModelParsingResponse: ImageModelParsingResponse = {
      body: requestBody,
      assets: new Map<string, string>(),
    };
    if (model && isRequestImageModel(model)) {
      const imageModelParser = getRequestImageModelParser(model);
      if (imageModelParser) {
        imageModelParsingResponse =
          imageModelParser.processRequestBody(requestBody);
      }
    }

    imageModelParsingResponse.body = unsupportedImage(
      imageModelParsingResponse.body
    );

    return imageModelParsingResponse;
  }

  cleanRequestBody(requestBodyStr: string): string {
    return requestBodyStr.replace(/\\u0000/g, "");
  }
}
