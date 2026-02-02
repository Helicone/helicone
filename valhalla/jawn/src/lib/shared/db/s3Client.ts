import retry from "async-retry";
import {
  S3Client as AwsS3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  PromiseGenericResult,
  Result,
  err,
  ok,
} from "../../../packages/common/result";
import { compressData } from "../../../utils/helpers";
import Bottleneck from "bottleneck";
import * as Sentry from "@sentry/node";

// Stay within S3 limits

const getLimiter = new Bottleneck({
  maxConcurrent: 5500,
  reservoir: 5500,
  reservoirRefreshAmount: 5500,
  reservoirRefreshInterval: 1000,
  minTime: 0,
});

const putLimiter = new Bottleneck({
  maxConcurrent: 3500,
  reservoir: 3500,
  reservoirRefreshAmount: 3500,
  reservoirRefreshInterval: 1000,
  minTime: 0,
});

export type RequestResponseBody = {
  request?: any;
  response?: any;
};

export class S3Client {
  private awsClient: AwsS3Client;

  constructor(
    accessKey: string | undefined,
    secretKey: string | undefined,
    private endpoint: string,
    private bucketName: string,
    private region: string
  ) {
    const config: any = {
      region: this.region,
      endpoint: endpoint ? endpoint : undefined,
      forcePathStyle: true,
    };

    // Only add credentials if both accessKey and secretKey are provided
    if (accessKey && secretKey) {
      config.credentials = {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      };
    }
    // If credentials are not provided, AWS SDK will use default credential chain
    // (environment variables, IAM roles, etc.)

    this.awsClient = new AwsS3Client(config);
  }

  async copyObject(
    sourceKey: string,
    destinationKey: string
  ): Promise<Result<string, string>> {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucketName,
        Key: destinationKey,
        CopySource: `${this.bucketName}/${sourceKey}`,
      });
      const response = await this.awsClient.send(command);
      if (!response || response.$metadata.httpStatusCode !== 200) {
        return err(
          `Failed to copy object: ${response.$metadata.httpStatusCode}`
        );
      }
      return ok(`Success`);
    } catch (error: any) {
      return err(`Failed to copy object: ${error.message}`);
    }
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
          return getLimiter.schedule(() => fetch(signedUrl));
        },
        {
          retries: 3,
          factor: 2,
          minTimeout: 350,
          maxTimeout: 1050,
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
        expiresIn: 60 * 60 * 24, // 1 day
      });

      return { data: signedUrl, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async putObjectSignedUrlWithExpiration(
    key: string,
    bodySize: number,
    expiresIn: number
  ): Promise<Result<string, string>> {
    try {
      this.awsClient;
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentLength: bodySize,
      });

      const signedUrl = await getSignedUrl(this.awsClient, command, {
        expiresIn,
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
    return await putLimiter.schedule(async () => {
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

  async store(
    key: string,
    value: string,
    tags?: Record<string, string>
  ): Promise<Result<string, string>> {
    return await putLimiter.schedule(async () => {
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
            Metadata: tags,
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

  async remove(key: string): Promise<Result<string, string>> {
    return await putLimiter.schedule(async () => {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.awsClient.send(command);

      if (!response || response.$metadata.httpStatusCode !== 204) {
        return err(
          `Failed to delete data: ${response.$metadata.httpStatusCode}`
        );
      }

      return ok(`Success`);
    });
  }
  getRawRequestResponseKey = (requestId: string, orgId: string) => {
    return `organizations/${orgId}/requests/${requestId}/raw_request_response_body`;
  };

  getRequestResponseKey = (requestId: string, orgId: string) => {
    return `organizations/${orgId}/requests/${requestId}/request_response_body`;
  };

  getDatasetKey = (datasetId: string, requestId: string, orgId: string) => {
    return `organizations/${orgId}/datasets/${datasetId}/requests/${requestId}/request_response_body`;
  };

  getPromptKey = (promptId: string, promptVersionId: string, orgId: string) => {
    return `organizations/${orgId}/prompts/${promptId}/versions/${promptVersionId}/prompt_body`;
  }

  async getPromptBody(
    promptId: string,
    promptVersionId: string,
    orgId: string
  ): Promise<Result<unknown, string>> {
    try {
      const key = this.getPromptKey(promptId, promptVersionId, orgId);
      const signedUrl = await this.getSignedUrl(key);
      if (signedUrl.error || !signedUrl.data) {
        return err(signedUrl.error || "Failed to get signed URL");
      }

      const contentResponse = await retry(
        async () => {
          return getLimiter.schedule(() => fetch(signedUrl.data!));
        },
        {
          retries: 3,
          factor: 2,
          minTimeout: 350,
          maxTimeout: 1050,
        }
      );

      if (!contentResponse.ok) {
        if (contentResponse.status === 404) {
          return err("Prompt body not found in S3");
        }
        return err(`Error fetching prompt body from S3: ${contentResponse.statusText}`);
      }

      const text = await contentResponse.text();
      const promptBody = JSON.parse(text);
      return ok(promptBody);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(`Error fetching prompt body: ${errorMessage}`);
    }
  }

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

  getRequestResponseRawUrl = (requestId: string, orgId: string) => {
    return `organizations/${orgId}/requests/${requestId}/raw_request_response_body`;
  };
}
