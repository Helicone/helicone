/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelResponseBodyParser } from "./core/ImageModelResponseBodyParser";

export class DalleImageParser extends ImageModelResponseBodyParser {
  constructor(modelName: string) {
    super(modelName);
  }

  processResponseBody(body: any): Record<string, string> {
    const requestAssets: Record<string, string> = {};
    try {
      // Assuming 'data' is the key containing the image information in DALL·E's response structure
      body?.data?.forEach((item: any) => {
        if (item.url) {
          const assetId = this.generateAssetId();
          requestAssets[assetId] = item.url;
          // Transform the URL into a placeholder with the asset ID
          item.url = `<helicone-asset-id key="${assetId}"/>`;
        }
      });
    } catch (error) {
      console.error(
        `Error processing response body for model: ${this.modelName}, error: ${error}`
      );
    }

    return requestAssets;
  }
}
