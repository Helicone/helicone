/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelResponseBodyParser } from "./core/modelResponseBodyParser";
import { ImageModelParsingResponse } from "./core/parsingResponse";

export class DalleImageParser extends ImageModelResponseBodyParser {
  constructor(modelName: string, responseId: string) {
    super(modelName, responseId);
  }

  processResponseBody(body: any): ImageModelParsingResponse {
    const requestAssets: Map<string, string> = new Map();
    let responseBody = body;
    try {
      responseBody = JSON.parse(JSON.stringify(body));
      if (Array.isArray(responseBody?.data)) {
        responseBody?.data?.forEach((item: any) => {
          if (item?.url) {
            const assetId = this.generateAssetId(
              this.responseId,
              this.assetIndex++
            );
            requestAssets.set(assetId, item.url);
            item.url = `<helicone-asset-id key="${assetId}"/>`;
          }
        });
      }
    } catch (error) {
      console.error(
        `Error processing response body for model: ${this.modelName}, error: ${error}`
      );
    }

    return {
      body: responseBody,
      assets: requestAssets,
    };
  }
}
