/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelRequestBodyParser } from "./core/imageModelRequestBodyParser";
import { ImageModelParsingResponse } from "./core/parsingResponse";

export class ClaudeImageParser extends ImageModelRequestBodyParser {
  constructor(modelName: string) {
    super(modelName);
  }
  processRequestBody(body: any): ImageModelParsingResponse {
    const requestAssets: Map<string, string> = new Map();
    const requestBody = JSON.parse(JSON.stringify(body));
    try {
      requestBody?.messages?.forEach((message: any) => {
        message.content.forEach((item: any) => {
          if (item.type === "image") {
            const assetId = this.generateAssetId();
            const base64Image = `data:${item.source.media_type};${item.source.type},${item.source.data}`;
            requestAssets.set(assetId, base64Image);
            item.source.data = `<helicone-asset-id key="${assetId}"/>`;
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
