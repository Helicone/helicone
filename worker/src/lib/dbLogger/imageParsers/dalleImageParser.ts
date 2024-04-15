/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelResponseBodyParser } from "./core/imageModelResponseBodyParser";
import { ImageModelParsingResponse } from "./core/parsingResponse";

export class DalleImageParser extends ImageModelResponseBodyParser {
  constructor(modelName: string) {
    super(modelName);
  }

  processResponseBody(body: any): ImageModelParsingResponse {
    const requestAssets: Map<string, string> = new Map();
    const requestBody = JSON.parse(JSON.stringify(body));
    try {
      // Assuming 'data' is the key containing the image information in DALL·E's response structure
      requestBody?.data?.forEach((item: any) => {
        if (item.url) {
          const assetId = this.generateAssetId();
          requestAssets.set(assetId, item.url);
          item.url = `<helicone-asset-id key="${assetId}"/>`;
        }
      });
    } catch (error) {
      console.error(
        `Error processing response body for model: ${this.modelName}, error: ${error}`
      );
    }

    return {
      body: requestBody,
      assets: requestAssets,
    };
  }
}
