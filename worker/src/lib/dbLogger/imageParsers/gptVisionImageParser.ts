/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelRequestBodyParser } from "./core/ImageModelRequestBodyParser";
export class GptVisionImageParser extends ImageModelRequestBodyParser {
  constructor(modelName: string) {
    super(modelName);
  }

  processRequestBody(body: any): Record<string, string> {
    const requestAssets: Record<string, string> = {};
    try {
      body?.messages?.forEach((message: any) => {
        message.content.forEach((item: any) => {
          if (item.type === "image_url") {
            const assetId = this.generateAssetId();
            requestAssets[assetId] = item.image_url.url;
            item.image_url.url = `<helicone-asset-id key="${assetId}"/>`;
          }
        });
      });
    } catch (error) {
      console.error(
        `Error processing messages for model: ${this.modelName}, error: ${error}`
      );
    }

    return requestAssets;
  }
}
