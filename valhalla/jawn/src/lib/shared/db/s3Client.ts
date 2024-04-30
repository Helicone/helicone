import { S3Client as AwsS3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Result, ok } from "../result";

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

      //https://s3.us-west-2.amazonaws.com/BUCKETNAME/organizations/dad350b5-4afe-4fd5-b910-ba74c0ad2f0f/requests/99a4a600-f003-4fc4-ad36-d85cd0ea4e85/request_response_body?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4LT7EZHCIBRZI3TY%2F20240430%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20240430T204833Z&X-Amz-Expires=1800&X-Amz-Signature=c8d852208b8230fad27605299db3b33dba7ced7ab33c34d98295fbfed3e18773&X-Amz-SignedHeaders=host
      // Obscure signedUrl. Need to remove the base url and replace with https://proxy.hconeai.com and remove the bucket name. Keep everything else

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
