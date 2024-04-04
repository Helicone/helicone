import { SupabaseClient } from "@supabase/supabase-js";
import { Env } from "../..";
import { S3Client } from "../clients/S3Client";
import { err, Result } from "../util/results";
import { v4 as uuidv4 } from "uuid";
import { Database } from "../../../supabase/database.types";

export type RequestResponseContent = {
  requestId: string;
  organizationId: string;
  requestBody: any;
  responseBody: string;
};

export class RequestResponseManager {
  constructor(
    private s3Client: S3Client,
    private supabase: SupabaseClient<Database>
  ) {}

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
          const assetId = uuidv4();

          const uploadPromise = (async () => {
            try {
              let assetUploadResult: Result<string, string>;
              if (imageUrl.startsWith("data:image/")) {
                const [assetType, base64Data] =
                  this.extractBase64Data(imageUrl);
                const buffer = Buffer.from(base64Data, "base64");
                assetUploadResult = await this.s3Client.uploadBase64ToS3(
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
                assetUploadResult = await this.s3Client.uploadImageToS3(
                  blob,
                  requestId,
                  organizationId,
                  assetId
                );
              }

              if (!assetUploadResult.error) {
                await this.saveRequestResponseAssets(assetId, requestId);
                item.image_url.url = `<helicone-asset-id key="${assetId}"></helicone-asset-id>`;
              }
            } catch (error) {
              return err(JSON.stringify(error));
            }
          })();

          uploadPromises.push(uploadPromise);
        }
      }
    }

    await Promise.allSettled(uploadPromises);
    const url = this.s3Client.getRequestResponseUrl(requestId, organizationId);
    return await this.s3Client.store(
      url,
      JSON.stringify({ request: requestBody, response: responseBody })
    );
  }

  private async saveRequestResponseAssets(assetId: string, requestId: string) {
    const result = await this.supabase
      .from("asset")
      .insert([{ id: assetId, request_id: requestId }])
      .single();

    if (result.error) {
      throw new Error(`Error saving asset: ${result.error.message}`);
    }
  }

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
