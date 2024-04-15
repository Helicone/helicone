/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelRequestBodyParser } from "./core/imageModelRequestBodyParser";
import { ImageModelParsingResponse } from "./core/parsingResponse";
export class GptVisionImageParser extends ImageModelRequestBodyParser {
  constructor(modelName: string) {
    super(modelName);
  }

  processRequestBody(body: any): ImageModelParsingResponse {
    const requestAssets: Map<string, string> = new Map();
    try {
      body?.messages?.forEach((message: any) => {
        message.content.forEach((item: any) => {
          if (item.type === "image_url") {
            const assetId = this.generateAssetId();
            const imageUrl = `<helicone-asset-id key="${assetId}"/>`;
            requestAssets.set(assetId, imageUrl);
            item.image_url.url = imageUrl;
          }
        });
      });
    } catch (error) {
      console.error(
        `Error processing request body for model: ${this.modelName}, error: ${error}`
      );
    }

    return {
      body: body,
      assets: requestAssets,
    };
  }
}
