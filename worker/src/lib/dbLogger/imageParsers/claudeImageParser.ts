/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelRequestBodyParser } from "./core/ImageModelRequestBodyParser";

export class ClaudeImageParser extends ImageModelRequestBodyParser {
  constructor(modelName: string) {
    super(modelName);
  }
  processRequestBody(body: any): Record<string, string> {
    const requestAssets: Record<string, string> = {};
    try {
      body?.messages?.forEach((message: any) => {
        message.content.forEach((item: any) => {
          if (item.type === "image") {
            const assetId = this.generateAssetId();
            requestAssets[
              assetId
            ] = `data:${item.source.media_type};${item.source.type},${item.source.data}`;
            item.source.data = `<helicone-asset-id key="${assetId}"/>`;
          }
        });
      });
    } catch (error) {
      console.error(
        `Error processing request body for model: ${this.modelName}, error: ${error}`
      );
    }

    return requestAssets;
  }
}
