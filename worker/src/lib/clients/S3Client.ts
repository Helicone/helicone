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
    assetId: string
  ) => {
    const key = `organizations/${orgId}/requests/${requestId}/assets/${assetId}`;
    if (this.endpoint) {
      // For MinIO or another S3-compatible service
      return `${this.endpoint}/${this.bucketName}/${key}`;
    } else {
      // For AWS S3
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
  };

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
    buffer: Buffer,
    assetType: string,
    requestId: string,
    orgId: string,
    assetId: string
  ): Promise<Result<string, string>> {
    const uploadUrl = this.getRequestResponseImageUrl(
      requestId,
      orgId,
      assetId
    );

    return this.uploadToS3(uploadUrl, buffer, assetType);
  }

  async uploadImageToS3(
    image: Blob,
    requestId: string,
    orgId: string,
    assetId: string
  ): Promise<Result<string, string>> {
    const uploadUrl = this.getRequestResponseImageUrl(
      requestId,
      orgId,
      assetId
    );

    return this.uploadToS3(uploadUrl, await image.arrayBuffer(), image.type);
  }

  private async uploadToS3(
    url: string,
    body: ArrayBuffer | Buffer,
    contentType: string
  ): Promise<Result<string, string>> {
    try {
      const signedRequest = await this.awsClient.sign(url, {
        method: "PUT",
        body: body,
        headers: {
          "Content-Type": contentType,
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
}
