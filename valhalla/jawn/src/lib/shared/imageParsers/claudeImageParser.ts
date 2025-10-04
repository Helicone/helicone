/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelRequestBodyParser } from "./core/modelRequestBodyParser";
import { ImageModelParsingResponse } from "./core/parsingResponse";

export class ClaudeImageParser extends ImageModelRequestBodyParser {
  constructor(modelName: string, requestId: string) {
    super(modelName, requestId);
  }
  processRequestBody(body: any): ImageModelParsingResponse {
    const requestAssets: Map<string, string> = new Map();
    let requestBody = body;
    try {
      requestBody = JSON.parse(JSON.stringify(body));
      if (Array.isArray(requestBody.messages)) {
        requestBody?.messages?.forEach((message: any) => {
          if (Array.isArray(message.content)) {
            message.content.forEach((item: any) => {
              if (item.type === "image") {
                const assetId = this.generateAssetId(
                  this.requestId,
                  this.assetIndex++,
                );
                const base64Image = `data:${item.source.media_type};${item.source.type},${item.source.data}`;
                requestAssets.set(assetId, base64Image);
                item.source.data = `<helicone-asset-id key="${assetId}"/>`;
              }
            });
          }
        });
      }
    } catch (error) {
      console.error(
        `Error processing request body for model: ${this.modelName}, error: ${error}`,
      );
    }

    return {
      body: requestBody,
      assets: requestAssets,
    };
  }
}
