/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelRequestBodyParser } from "./core/modelRequestBodyParser";
import { ImageModelParsingResponse } from "./core/parsingResponse";
export class GptVisionImageParser extends ImageModelRequestBodyParser {
  constructor(modelName: string) {
    super(modelName);
  }

  processRequestBody(body: any): ImageModelParsingResponse {
    const requestAssets: Map<string, string> = new Map();
    const requestBody = JSON.parse(JSON.stringify(body));
    try {
      requestBody?.messages?.forEach((message: any) => {
        message.content.forEach((item: any) => {
          if (item.type === "image_url") {
            const assetId = this.generateAssetId();
            requestAssets.set(assetId, item.image_url.url);
            item.image_url.url = `<helicone-asset-id key="${assetId}"/>`;
          }
        });
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
}
