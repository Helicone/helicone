import { tryParse } from "../../utils/helpers";
import { GenericResult, ok } from "../shared/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class RequestBodyHandler extends AbstractLogHandler {
  async handle(context: HandlerContext): Promise<void> {
    console.log(`RequestBodyHandler: ${context.message.log.request.id}`);
    const processedBody = this.processRequestBody(context);

    if (processedBody.error || !processedBody.data) {
      console.error(`Error processing request body: ${processedBody.error}`);
      return;
    }

    context.processedLog.request.body = processedBody.data;

    return await super.handle(context);
  }

  processRequestBody(context: HandlerContext): GenericResult<any> {
    const log = context.message.log;
    let requestBody = context.processedLog.request.rawBody;

    requestBody = this.cleanRequestBody(requestBody);
    requestBody = tryParse(requestBody, "request body");
    requestBody = context.message.heliconeMeta.omitRequestLog
      ? {
          model: log.request.model, // Put request model here, not calculated model
        }
      : requestBody;

    // Ensure no image is stored as bytes
    requestBody = this.unsupportedImage(requestBody);

    return ok(requestBody);
  }

  cleanRequestBody(requestBody: any): string {
    const requestBodyString = JSON.stringify(requestBody);
    return requestBodyString.replace(/\\u0000/g, "");
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
