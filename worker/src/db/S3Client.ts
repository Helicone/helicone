import { AwsClient } from "aws4fetch";
import { Result } from "../results";

export class S3Client {
  private region = "us-west-2";
  private awsClient: AwsClient;

  constructor(
    accessKey = "minioadmin",
    secretKey = "minioadmin",
    private endpoint: string = "http://localhost:9000",
    private bucketName: string = "request-response-storage"
  ) {
    this.awsClient = new AwsClient({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      service: "s3",
      region: this.region,
    });
  }

  getRequestResponseUrl = (requestId: string, orgId: string) => {
    const key = `organizations/${orgId}/requests/${requestId}`;
    if (this.endpoint) {
      // For MinIO or another S3-compatible service
      return `${this.endpoint}/${this.bucketName}/${key}`;
    } else {
      // For AWS S3
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
  };

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
    const signedRequest = await this.awsClient.sign(url, {
      method: "PUT",
      body: value,
      headers: {
        "Content-Type": "application/json",
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
  }
}
