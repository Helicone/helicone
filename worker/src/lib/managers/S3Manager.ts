import { Env } from "../..";
import { S3Client } from "../clients/S3Client";
import { err, Result } from "../util/results";
import { uuid } from "uuidv4";

export type RequestResponseContent = {
  requestId: string;
  organizationId: string;
  requestBody: any;
  responseBody: string;
};

export class S3Manager {
  constructor(private s3Client: S3Client) {}

  async storeRequestResponseData({
    organizationId,
    requestId,
    requestBody,
    responseBody,
  }: RequestResponseContent): Promise<Result<string, string>> {
    const url = this.s3Client.getRequestResponseUrl(requestId, organizationId);

    return await this.s3Client.store(
      url,
      JSON.stringify({ requestBody, responseBody })
    );
  }
  async storeRequestResponseImage({
    organizationId,
    requestId,
    requestBody,
    responseBody,
  }: RequestResponseContent): Promise<Result<string, string>> {
    const uploadPromises = [];

    for (const message of requestBody.messages) {
      for (const item of message.content) {
        if (item.type === "image_url") {
          const imageUrl = item.image_url.url;
          const assetId = uuid();

          const uploadPromise = (async () => {
            try {
              let assetUrl = "";
              if (imageUrl.startsWith("data:image/")) {
                const [assetType, base64Data] =
                  this.extractBase64Data(imageUrl);
                const buffer = Buffer.from(base64Data, "base64");
                assetUrl = await this.s3Client.uploadBase64ToS3(
                  buffer,
                  assetType,
                  requestId,
                  organizationId,
                  assetId
                );
              } else {
                const response = await fetch(imageUrl);
                if (!response.ok) {
                  return err(
                    `Failed to download image: ${response.statusText}`
                  );
                }
                const blob = await response.blob();
                assetUrl = await this.s3Client.uploadImageToS3(
                  blob,
                  requestId,
                  organizationId,
                  assetId
                );
              }

              if (assetUrl) {
                item.image_url.url = `{helicone-asset-id: ${assetId}}`;
              }
            } catch (error) {
              return err(JSON.stringify(error));
            }
          })();

          uploadPromises.push(uploadPromise);
        }
      }
    }

    await Promise.all(uploadPromises);
    const url = this.s3Client.getRequestResponseUrl(requestId, organizationId);
    return await this.s3Client.store(
      url,
      JSON.stringify({ request: requestBody, response: responseBody })
    );
  }

  private async saveRequestResponseAssets(env: Env) {}

  private extractBase64Data(dataUri: string): [string, string] {
    const matches = dataUri.match(
      /^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,(.*)$/
    );
    if (!matches || matches.length !== 3) {
      console.log("Invalid base64 image data");
      return ["", ""];
    }
    return [matches[1], matches[2]];
  }
}
