import { AwsClient } from "aws4fetch";
import { Result } from "../util/results";
import { compress } from "../util/helpers";

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

  getRequestResponseRawUrl = (requestId: string, orgId: string) => {
    return this.getBaseUrl(
      `organizations/${orgId}/requests/${requestId}/raw_request_response_body`
    );
  };

  getRequestResponseUrl = (requestId: string, orgId: string) => {
    return this.getBaseUrl(
      `organizations/${orgId}/requests/${requestId}/request_response_body`
    );
  };

  getRequestResponseImageUrl = (
    requestId: string,
    orgId: string,
    assetId: string
  ) => {
    return this.getBaseUrl(
      `organizations/${orgId}/requests/${requestId}/assets/${assetId}`
    );
  };

  getBaseUrl = (key: string) => {
    return this.endpoint
      ? `${this.endpoint}/${this.bucketName}/${key}`
      : `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  };

  async store(
    url: string,
    value: string,
    tags?: Record<string, string>
  ): Promise<Result<string, string>> {
    try {
      const compressedValue = await compress(value);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Content-Encoding": "gzip",
      };
      if (tags && Object.keys(tags).length > 0) {
        const tagsString = Object.entries(tags)
          .map(
            ([key, val]) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
          )
          .join("&");
        headers["x-amz-tagging"] = tagsString;
      }

      const signedRequest = await this.awsClient.sign(url, {
        method: "PUT",
        body: compressedValue,
        headers,
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

    return await this.uploadToS3(uploadUrl, buffer, assetType);
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

    return await this.uploadToS3(
      uploadUrl,
      await image.arrayBuffer(),
      image.type
    );
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
