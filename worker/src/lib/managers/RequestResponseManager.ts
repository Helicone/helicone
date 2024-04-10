import { SupabaseClient } from "@supabase/supabase-js";
import { S3Client } from "../clients/S3Client";
import { Result } from "../util/results";
import { Database } from "../../../supabase/database.types";

export type RequestResponseContent = {
  requestId: string;
  organizationId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestBody: any;
  responseBody: string;
  requestAssets: Record<string, string>;
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
      JSON.stringify({ request: requestBody, response: responseBody })
    );
  }
  async storeRequestResponseImage({
    organizationId,
    requestId,
    requestBody,
    responseBody,
    requestAssets,
  }: RequestResponseContent): Promise<Result<string, string>> {
    const uploadPromises: Promise<void>[] = Object.entries(requestAssets).map(
      ([key, value]) =>
        this.handleImageUpload(value, key, requestId, organizationId)
    );

    await Promise.allSettled(uploadPromises);
    const url = this.s3Client.getRequestResponseUrl(requestId, organizationId);
    return await this.s3Client.store(
      url,
      JSON.stringify({ request: requestBody, response: responseBody })
    );
  }

  private async handleImageUpload(
    imageUrl: string,
    assetId: string,
    requestId: string,
    organizationId: string
  ): Promise<void> {
    try {
      let assetUploadResult: Result<string, string>;
      if (imageUrl.startsWith("data:image/")) {
        const [assetType, base64Data] = this.extractBase64Data(imageUrl);
        const buffer = Buffer.from(base64Data, "base64");
        assetUploadResult = await this.s3Client.uploadBase64ToS3(
          buffer,
          assetType,
          requestId,
          organizationId,
          assetId
        );
      } else {
        const response = await fetch(imageUrl, {
          headers: {
            "User-Agent": "Helicone-Worker (https://helicone.com)",
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
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
        await this.saveRequestResponseAssets(
          assetId,
          requestId,
          organizationId
        );
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      // If we fail to upload an image, we don't want to fail logging the request
    }
  }

  private async saveRequestResponseAssets(
    assetId: string,
    requestId: string,
    organizationId: string
  ) {
    const result = await this.supabase
      .from("asset")
      .insert([
        { id: assetId, request_id: requestId, organization_id: organizationId },
      ]);

    if (result.error) {
      throw new Error(`Error saving asset: ${result.error.message}`);
    }
  }

  private extractBase64Data(dataUri: string): [string, string] {
    const matches = dataUri.match(
      /^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,(.*)$/
    );
    if (!matches || matches.length !== 3) {
      console.error("Invalid base64 image data");
      return ["", ""];
    }
    return [matches[1], matches[2]];
  }
}
