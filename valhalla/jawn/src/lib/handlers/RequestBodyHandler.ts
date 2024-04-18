import { tryParse } from "../../utils/helpers";
import { getModelFromRequest } from "../../utils/modelMapper";
import { Database } from "../db/database.types";
import { GenericResult, ok } from "../modules/result";
import {
  getImageModelParser,
  isImageModel,
} from "../shared/imageParsers/parserMapper";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class RequestBodyHandler extends AbstractLogHandler {
  async handle(context: HandlerContext): Promise<void> {
    const processedBody = this.processRequestBody(context);

    if (processedBody.error || !processedBody.data) {
      console.error(`Error processing request body: ${processedBody.error}`);
      return;
    }

    context.processedRequestBody = processedBody.data;
    await super.handle(context);
  }

  processRequestBody(context: HandlerContext): GenericResult<string> {
    const request = context.message.log.request;
    let requestBody = request.body;
    requestBody = requestBody.replace(/\\u0000/g, ""); // Remove unsupported null character in JSONB
    requestBody = tryParse(requestBody, "request body");
    requestBody = this.handleOmitLog(
      requestBody,
      context.message.heliconeMeta.omitRequestLog
    );

    // RIP out assets
    // eslint-disable-next-line prefer-const
    let requestAssets: Record<string, string> = {};
    const model = getModelFromRequest(requestBody, request.path);

    if (model && isImageModel(model)) {
      const imageModelParser = getImageModelParser(model);
      if (imageModelParser) {
        requestAssets = imageModelParser.processMessages(requestBody);
      }
    }

    requestBody = this.unsupportedImage(requestBody);

    return ok(requestBody);
  }

  handleOmitLog(body: any, omitLog: boolean): any {
    if (omitLog) {
      return { model: body.model || null };
    }

    return body;
  }

  // Replaces all the image_url that is not a url or not { url: url }  with
  // { unsupported_image: true }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unsupportedImage(body: any): any {
    if (typeof body !== "object" || body === null) {
      return body;
    }
    if (Array.isArray(body)) {
      return body.map((item) => this.unsupportedImage(item));
    }
    const notSupportMessage = {
      helicone_message:
        "Storing images as bytes is currently not supported within Helicone.",
    };
    if (body["image_url"] !== undefined) {
      const imageUrl = body["image_url"];
      if (
        typeof imageUrl === "string" &&
        !imageUrl.startsWith("http") &&
        !imageUrl.startsWith("<helicone-asset-id")
      ) {
        body.image_url = notSupportMessage;
      }
      if (
        typeof imageUrl === "object" &&
        imageUrl.url !== undefined &&
        typeof imageUrl.url === "string" &&
        !imageUrl.url.startsWith("http") &&
        !imageUrl.url.startsWith("<helicone-asset-id")
      ) {
        body.image_url = notSupportMessage;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
    for (const key in body) {
      result[key] = this.unsupportedImage(body[key]);
    }
    return result;
  }
}
