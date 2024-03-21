import { S3Client as AwsS3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Result } from "../result";

export type RequestResponseBody = {
  request?: any;
  response?: any;
};

export class S3Client {
  private region = "us-west-2";
  awsClient: AwsS3Client;

  constructor(
    accessKey: string = "minioadmin",
    secretKey: string = "minioadmin",
    endpoint: string = "http://localhost:9000",
    private bucketName: string = "request-response-storage"
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
    return this.getSignedUrl(key);
  }

  async getSignedUrl(key: string): Promise<Result<string, string>> {
    this.awsClient;
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.awsClient, command, {
      expiresIn: 3600, // 1 hour
    });

    return { data: signedUrl, error: null };
  }

  getRequestResponseKey = (requestId: string, orgId: string) => {
    return `organizations/${orgId}/requests/${requestId}`;
  };
}
