import { AwsClient } from "aws4fetch";
import { Result } from "../util/results";
import { gzip } from "node-gzip";

export class S3Client {
  private region = "us-west-2";
  private awsClient: AwsClient;

  constructor(
    accessKey: string,
    secretKey: string,
    private endpoint: string,
    private bucketName: string
  ) {
    this.awsClient = new AwsClient({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      service: "s3",
      region: this.region,
    });
  }

  getRequestResponseUrl = (requestId: string, orgId: string) => {
    const key = `organizations/${orgId}/requests/${requestId}/request_response_body`;
    if (this.endpoint) {
      // For MinIO or another S3-compatible service
      return `${this.endpoint}/${this.bucketName}/${key}`;
    } else {
      // For AWS S3
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
  };

  getRequestResponseImageUrl = (
    requestId: string,
    orgId: string,
    fileExtension: string
  ) => {
    const key = `organizations/${orgId}/requests/${requestId}/assets/${requestId}-${fileExtension}-${Date.now()}`;
    if (this.endpoint) {
      // For MinIO or another S3-compatible service
      return `${this.endpoint}/${this.bucketName}/${key}`;
    } else {
      // For AWS S3
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
  };

  async storeRequestResponseImage(
    orgId: string,
    requestId: string,
    requestString: any,
    response: string
  ): Promise<Result<string, string>> {
    console.log("image model");
    console.log(requestString);
    const parsedRequest = requestString;
    const uploadPromises = [];

    for (const message of parsedRequest.messages) {
      for (const item of message.content) {
        if (item.type === "image_url") {
          console.log(`item: ${JSON.stringify(item)}`);
          console.log(`image url: ${item.image_url.url}`);
          const imageUrl = item.image_url.url;

          const uploadPromise = (async () => {
            try {
              let assetUrl = "";
              if (imageUrl.startsWith("data:image/")) {
                const [mimeType, base64Data] = this.extractBase64Data(imageUrl);
                assetUrl = await this.uploadBase64ToS3(
                  base64Data,
                  mimeType,
                  requestId,
                  orgId
                );
              } else {
                assetUrl = await this.uploadImageToS3(
                  imageUrl,
                  requestId,
                  orgId
                );
              }

              if (assetUrl) {
                item.image_url.url = assetUrl;
              }
            } catch (error) {
              console.error("Error processing image:", error);
              return null;
            }
          })();

          uploadPromises.push(uploadPromise);
        }
      }
    }

    await Promise.all(uploadPromises);
    const url = this.getRequestResponseUrl(requestId, orgId);
    return await this.store(
      url,
      JSON.stringify({ request: parsedRequest, response })
    );
  }

  async storeRequestResponse(
    orgId: string,
    requestId: string,
    request: string,
    response: string
  ): Promise<Result<string, string>> {
    const url = this.getRequestResponseUrl(requestId, orgId);

    return await this.store(url, JSON.stringify({ request, response }));
  }

  async store(url: string, value: string): Promise<Result<string, string>> {
    try {
      const compressedValue = await gzip(value);

      const signedRequest = await this.awsClient.sign(url, {
        method: "PUT",
        body: compressedValue,
        headers: {
          "Content-Type": "application/json",
          "Content-Encoding": "gzip",
        },
      });

      const response = await fetch(signedRequest.url, signedRequest);

      if (!response.ok) {
        return {
          data: null,
          error: `Failed to store data: ${response.statusText}`,
        };
      }

      return { data: url, error: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return { data: null, error: error?.message };
    }
  }

  async uploadBase64ToS3(
    base64Data: string,
    mimeType: string,
    requestId: string,
    orgId: string
  ): Promise<string> {
    const buffer = Buffer.from(base64Data, "base64");
    const fileExtension = this.getFileExtension(mimeType);
    const uploadUrl = this.getRequestResponseImageUrl(
      requestId,
      orgId,
      fileExtension
    );

    await this.uploadToS3(uploadUrl, buffer, mimeType);
    return uploadUrl;
  }

  async uploadImageToS3(
    imageUrl: string,
    requestId: string,
    orgId: string
  ): Promise<string> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to download image: ${response.statusText}`);
      return "";
    }
    const blob = await response.blob();
    const fileExtension =
      this.getFileExtensionFromBlob(blob) ||
      this.getFileExtensionFromUrl(imageUrl);
    const uploadUrl = this.getRequestResponseImageUrl(
      requestId,
      orgId,
      fileExtension ?? "jpg"
    );

    await this.uploadToS3(uploadUrl, await blob.arrayBuffer(), blob.type);
    return uploadUrl;
  }

  private getFileExtensionFromBlob(blob: Blob) {
    const mimeType = blob.type;
    return mimeType.split("/").pop();
  }

  private getFileExtensionFromUrl(url: string) {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").pop();
    return lastSegment?.split(".").pop();
  }

  private getFileExtension(mimeType: string): string {
    const mimeExtensionMap = new Map<string, string>([
      ["image/jpeg", "jpg"],
      ["image/png", "png"],
      ["image/gif", "gif"],
      ["image/webp", "webp"],
    ]);

    return mimeExtensionMap.get(mimeType) || "jpg";
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

  private async uploadToS3(
    url: string,
    body: ArrayBuffer | Buffer,
    contentType: string
  ): Promise<void> {
    const signedRequest = await this.awsClient.sign(url, {
      method: "PUT",
      body: body,
      headers: {
        "Content-Type": contentType,
      },
    });

    const response = await fetch(signedRequest.url, signedRequest);
    if (!response.ok)
      throw new Error(`Failed to upload to S3: ${response.statusText}`);
  }
}
