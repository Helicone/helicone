/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelParser } from "./imageModelParser";

export class ClaudeImageParser extends ImageModelParser {
  constructor(modelName: string) {
    super(modelName);
  }
  processMessages(body: any): Record<string, string> {
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
        `Error processing messages for model: ${this.modelName}, error: ${error}`
      );
    }

    return requestAssets;
  }
}
