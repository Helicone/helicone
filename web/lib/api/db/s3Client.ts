import { S3Client as AwsS3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Result, ok } from "../../result";

const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY ?? "";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY ?? "";
const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME ?? "";
const S3_ENABLED = (process.env.S3_ENABLED ?? "true") === "true";

// S3 endpoint can be empty string
if (
  S3_ENABLED &&
  (!S3_ACCESS_KEY ||
    !S3_SECRET_KEY ||
    S3_ENDPOINT === null ||
    S3_ENDPOINT === undefined ||
    !S3_BUCKET_NAME)
) {
  throw new Error("S3 env variables not set");
}

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

      return ok(this.obscureSignedUrl(signedUrl));
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  obscureSignedUrl(signedUrl: string) {
    const url = new URL(signedUrl);
    const proxyBaseUrl = new URL(
      process.env.S3_PROXY_URL || "https://proxy.hconeai.com"
    );
    url.hostname = proxyBaseUrl.hostname;
    url.port = proxyBaseUrl.port;
    url.protocol = proxyBaseUrl.protocol;
    url.pathname = url.pathname.replace(/^\/[^\/]+/, "/obscured");

    return url.toString();
  }

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
