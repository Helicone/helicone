/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelParser } from "./imageModelParser";
export class GptVisionImageParser extends ImageModelParser {
  constructor(modelName: string) {
    super(modelName);
  }

  processMessages(body: any): Record<string, string> {
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
