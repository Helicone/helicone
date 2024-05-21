import retry from "async-retry";
import {
  S3Client as AwsS3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PromiseGenericResult, Result, err, ok } from "../result";
import { compressData } from "../../../utils/helpers";
import Bottleneck from "bottleneck";
import * as Sentry from "@sentry/node";

// Maximum HTTP requests per second: 10,000 requests
// Maximum HTTP requests per minute: 600,000 requests
const limiter = new Bottleneck({
  maxConcurrent: 100,
});

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

  async fetchContent(signedUrl: string): Promise<
    Result<
      {
        request: string;
        response: string;
      },
      {
        notFoundErr?: string;
        error?: string;
      }
    >
  > {
    try {
      const contentResponse = await retry(
        async () => {
          return limiter.schedule(() => fetch(signedUrl));
        },
        {
          retries: 3,
          factor: 2,
          minTimeout: 500,
          maxTimeout: 3000,
        }
      );

      if (!contentResponse.ok) {
        if (contentResponse.status === 404) {
          console.error(
            `Content not found in S3: ${signedUrl}, ${contentResponse.status}, ${contentResponse.statusText}`
          );

          Sentry.captureException(new Error("Raw content not found in S3"), {
            tags: {
              type: "KafkaError",
            },
            extra: {
              signedUrl: signedUrl,
              status: contentResponse.status,
              statusText: contentResponse.statusText,
            },
          });

          return err({
            notFoundErr: "Content not found in S3",
          });
        }

        return err({
          error: `Error fetching content from S3: ${contentResponse.statusText}, ${contentResponse.status}`,
        });
      }

      const text = await contentResponse.text();
      const { request, response } = JSON.parse(text);
      return ok({
        request: request,
        response: response,
      });
    } catch (error: any) {
      return err({
        error: `Error fetching content from S3: ${JSON.stringify(error)}`,
      });
    }
  }

  async getRawRequestResponseBodySignedUrl(
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

  async uploadBase64ToS3(
    buffer: Buffer,
    assetType: string,
    requestId: string,
    orgId: string,
    assetId: string
  ): PromiseGenericResult<string> {
    const key = this.getRequestResponseImageUrl(requestId, orgId, assetId);
    return await this.uploadToS3(key, buffer, assetType);
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

  async uploadToS3(
    key: string,
    body: ArrayBuffer | Buffer,
    contentType: string
  ): Promise<Result<string, string>> {
    return await limiter.schedule(async () => {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: new Uint8Array(body),
        ContentType: contentType,
      });

      try {
        const response = await this.awsClient.send(command);

        if (!response || response.$metadata.httpStatusCode !== 200) {
          return err(
            `Failed to store data: ${response.$metadata.httpStatusCode}`
          );
        }

        return ok(`Success`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return err(`Failed to store image in S3: ${error?.message}`);
      }
    });
  }

  async store(key: string, value: string): Promise<Result<string, string>> {
    return await limiter.schedule(async () => {
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
    });
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

  getRequestResponseImageUrl = (
    requestId: string,
    orgId: string,
    assetId: string
  ) => {
    return `organizations/${orgId}/requests/${requestId}/assets/${assetId}`;
  };
}
