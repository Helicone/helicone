/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelRequestBodyParser } from "./core/modelRequestBodyParser";
import { ImageModelParsingResponse } from "./core/parsingResponse";
export class GptVisionImageParser extends ImageModelRequestBodyParser {
  constructor(modelName: string, requestId: string) {
    super(modelName, requestId);
  }

  processRequestBody(body: any): ImageModelParsingResponse {
    const requestAssets: Map<string, string> = new Map();
    let requestBody = body;
    try {
      requestBody = JSON.parse(JSON.stringify(body));
      requestBody?.messages?.forEach((message: any) => {
        if (Array.isArray(message.content)) {
          message.content?.forEach((item: any) => {
            const result = this.processContentItem(item);
            if (result && result.assetId) {
              requestAssets.set(result.assetId, result.imageUrl);
            }
          });
        } else if (message.content) {
          const result = this.processContentItem(message.content);
          if (result && result.assetId) {
            requestAssets.set(result.assetId, result.imageUrl);
          }
        }
      });
    } catch (error) {
      console.error(
        `Error processing request body for model: ${this.modelName}, error: ${error}`
      );
    }

    return {
      body: requestBody,
      assets: requestAssets,
    };
  }

  processContentItem(item: any) {
    const assetId = this.generateAssetId(this.requestId, this.assetIndex++);
    if (
      item?.type === "image_url" &&
      item?.image_url &&
      typeof item?.image_url === "object" &&
      "url" in item?.image_url
    ) {
      const oldUrl = item.image_url.url;
      item.image_url.url = `<helicone-asset-id key="${assetId}"/>`;
      return { assetId: assetId, imageUrl: oldUrl };
    } else if (
      item.type === "image_url" &&
      item.image_url &&
      typeof item.image_url === "string"
    ) {
      const oldUrl = item.image_url;
      item.image_url = `<helicone-asset-id key="${assetId}"/>`;
      return { assetId: assetId, imageUrl: oldUrl };
    }
    return null;
  }
}
