import {
  S3Client as AwsS3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Result, err, ok } from "../result";
import { compressData } from "../../../utils/helpers";

export type RequestResponseBody = {
  request?: any;
  response?: any;
};

export class S3Client {
  private region = "us-west-2";
  private awsClient: AwsS3Client;

  constructor(
    accessKey: string,
    secretKey: string,
    endpoint: string,
    private bucketName: string
  ) {
    this.awsClient = new AwsS3Client({
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      region: this.region,
      endpoint: endpoint ? endpoint : undefined,
      forcePathStyle: true,
    });
  }

  async getRawRequestResponseBody(
    orgId: string,
    requestId: string
  ): Promise<Result<string, string>> {
    const key = this.getRawRequestResponseKey(requestId, orgId);
    return await this.getSignedUrl(key);
  }

  async getRequestResponseBodySignedUrl(
    orgId: string,
    requestId: string
  ): Promise<Result<string, string>> {
    const key = this.getRequestResponseKey(requestId, orgId);
    return await this.getSignedUrl(key);
  }

  async getRequestResponseImageSignedUrl(
    orgId: string,
    requestId: string,
    assetId: string
  ): Promise<Result<string, string>> {
    const key = this.getRequestResponseImageKey(requestId, orgId, assetId);
    return await this.getSignedUrl(key);
  }

  async getSignedUrl(key: string): Promise<Result<string, string>> {
    try {
      this.awsClient;
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.awsClient, command, {
        expiresIn: 1800, // 30 minutes
      });

      return { data: signedUrl, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async store(key: string, value: string): Promise<Result<string, string>> {
    try {
      const compressedValue = await compressData(value);

      let command: PutObjectCommand;
      if (!compressedValue.data || compressedValue.error) {
        // If compression fails, use the original value
        command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: value,
          ContentType: "application/json",
        });
      } else {
        command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: compressedValue.data,
          ContentEncoding: "gzip",
          ContentType: "application/json",
        });
      }

      const response = await this.awsClient.send(command);

      if (!response || response.$metadata.httpStatusCode !== 200) {
        return err(
          `Failed to store data: ${response.$metadata.httpStatusCode}`
        );
      }

      return ok(`Success`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return { data: null, error: error?.message };
    }
  }

  getRawRequestResponseKey = (requestId: string, orgId: string) => {
    return `organizations/${orgId}/requests/${requestId}/raw_request_response_body`;
  };

  getRequestResponseKey = (requestId: string, orgId: string) => {
    return `organizations/${orgId}/requests/${requestId}/request_response_body`;
  };

  getRequestResponseImageKey = (
    requestId: string,
    orgId: string,
    assetId: string
  ) => {
    return `organizations/${orgId}/requests/${requestId}/assets/${assetId}`;
  };
}
