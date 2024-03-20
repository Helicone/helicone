import { S3Client as AwsS3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Result } from "../../result";

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
    private bucketName: string = "request_response_storage"
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

  getRequestResponseKey = (requestId: string, orgId: string) => {
    return `organizations/${orgId}/requests/${requestId}`;
  };

  async getRequestResponseBody(
    orgId: string,
    requestId: string
  ): Promise<Result<RequestResponseBody, string>> {
    const key = this.getRequestResponseKey(requestId, orgId);

    return this.retrieve(key);
  }

  async retrieve<T>(key: string): Promise<Result<T, string>> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const data = await this.awsClient.send(command);
      const bodyContents = await this.streamToString(data.Body);
      const parsedBody = JSON.parse(bodyContents) as T;

      return { data: parsedBody, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  async streamToString(stream: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on("data", (chunk: any) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
  }
}
