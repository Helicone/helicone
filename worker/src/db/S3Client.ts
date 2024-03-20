import { AwsClient } from "aws4fetch";
import { Result } from "../results";

export class S3Client {
  private region = "us-west-2";
  private bucketName = "request-response-storage";
  awsClient: AwsClient;

  constructor(accessKey: string, secretKey: string, bucketName: string) {
    this.awsClient = new AwsClient({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      service: "s3",
      region: this.region,
    });

    if (bucketName) {
      this.bucketName = bucketName;
    }
  }

  getRequestResponseUrl = (requestId: string, orgId: string) => {
    const key = `organizations/${orgId}/requests/${requestId}`;
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  };

  async storeRequestResponse(
    orgId: string,
    requestId: string,
    request: string,
    response: string
  ): Promise<Result<string, string>> {
    const url = this.getRequestResponseUrl(requestId, orgId);

    return this.store(url, JSON.stringify({ request, response }));
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
