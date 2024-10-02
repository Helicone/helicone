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

export const MAX_ASSETS = 100;

function truncMap(
  map: Map<string, string>,
  maxSize: number
): Map<string, string> {
  return new Map(Array.from(map.entries()).slice(0, maxSize));
}

export class RequestBodyHandler extends AbstractLogHandler {
  async handle(context: HandlerContext): PromiseGenericResult<string> {
    try {
      const { body: processedBody, model: requestModel } =
        this.processRequestBody(context);

      const { body: requestBodyFinal, assets: requestBodyAssets } =
        this.processRequestBodyImages(
          context.message.log.request.id,
          processedBody,
          requestModel
        );

      context.processedLog.request.assets = requestBodyAssets;
      context.processedLog.request.body = requestBodyFinal;
      context.processedLog.request.model = requestModel;

      if (
        this.isAssistantRequest(requestBodyFinal) &&
        !context.processedLog.request.model
      ) {
        context.processedLog.request.model = "assistant-call";
      }

      if (this.isVectorDBRequest(requestBodyFinal)) {
        context.processedLog.request.model = "vector_db";
      } else if (this.isToolRequest(requestBodyFinal)) {
        context.processedLog.request.model = `tool:${requestBodyFinal.toolName}`;
      }

      try {
        context.processedLog.request.properties = Object.entries(
          context.message.log.request.properties
        ).reduce((acc, [key, value]) => {
          acc[key] = this.cleanRequestBody(value);
          return acc;
        }, {} as Record<string, string>);
      } catch (error: any) {
        context.processedLog.request.properties =
          context.message.log.request.properties;
      }

      return await super.handle(context);
    } catch (error: any) {
      return err(
        `Error processing request body: ${error}, Context: ${this.constructor.name}`
      );
    }
  }

  private isAssistantRequest(requestBody: any): boolean {
    if (typeof requestBody !== "object" || requestBody === null) {
      return false;
    }
    return (
      (!requestBody.hasOwnProperty("messages") &&
        requestBody.hasOwnProperty("instructions") &&
        requestBody.hasOwnProperty("name")) ||
      requestBody.hasOwnProperty("assistant_id") ||
      requestBody.hasOwnProperty("metadata")
    );
  }

  private isVectorDBRequest(requestBody: any): boolean {
    return (
      requestBody.hasOwnProperty("_type") && requestBody._type === "vector_db"
    );
  }

  private isToolRequest(requestBody: any): boolean {
    return requestBody.hasOwnProperty("_type") && requestBody._type === "tool";
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
        model: getModelFromRequest(
          "{}",
          log.request.path,
          log.request.targetUrl
        ),
      };
    }

    let parsedRequestBody = tryParse(rawRequestBody, "request body");

    const requestModel = getModelFromRequest(
      parsedRequestBody,
      log.request.path,
      log.request.targetUrl
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
    requestId: string,
    requestBody: any,
    model?: string
  ): ImageModelParsingResponse {
    let imageModelParsingResponse: ImageModelParsingResponse = {
      body: requestBody,
      assets: new Map<string, string>(),
    };
    if (model && isRequestImageModel(model)) {
      const imageModelParser = getRequestImageModelParser(model, requestId);
      if (imageModelParser) {
        imageModelParsingResponse =
          imageModelParser.processRequestBody(requestBody);
      }
    }

    imageModelParsingResponse.body = unsupportedImage(
      imageModelParsingResponse.body
    );

    if (imageModelParsingResponse.assets.size > MAX_ASSETS) {
      imageModelParsingResponse.assets = truncMap(
        imageModelParsingResponse.assets,
        MAX_ASSETS
      );
    }

    return imageModelParsingResponse;
  }

  cleanRequestBody(requestBodyStr: string): string {
    return requestBodyStr.replace(/\\u0000/g, "");
  }
}
