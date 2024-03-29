import { AwsClient } from "aws4fetch";
import { Result } from "../results";
import { gzip } from "node-gzip";

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

  getRequestResponseUrl = (requestId: string, orgId: string) => {
    const key = `organizations/${orgId}/requests/${requestId}/request_response_body`;
    if (this.endpoint) {
      // For MinIO or another S3-compatible service
      return `${this.endpoint}/${this.bucketName}/${key}`;
    } else {
      // For AWS S3
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
  };

  async storeRequestResponseImage(
    orgId: string,
    requestId: string,
    request: string,
    response: string
  ) {
    const requestJson = JSON.stringify(request);
    const parsedRequest = JSON.parse(requestJson);

    // Create a deep copy of the parsedRequest to avoid modifying the original object
    const modifiedRequest = JSON.parse(JSON.stringify(parsedRequest));

    const imageRequest = modifiedRequest.messages[0]?.content.find(
      (content: any) => content.type === "image_url"
    );

    const imageUrl = imageRequest?.image_url?.url || "";

    if (imageUrl) {
      // If imageUrl exists, replace the image URL with its base64 representation
      const base64Image = await this.downloadImageAndEncodeToBase64(imageUrl);
      if (imageRequest && imageRequest.image_url) {
        imageRequest.image_url.url = base64Image;
      }
    }

    // Use modifiedRequest if imageUrl exists, otherwise use parsedRequest
    const finalRequest = imageUrl ? modifiedRequest : parsedRequest;

    const url = this.getRequestResponseUrl(requestId, orgId);

    // Store the final request and response
    return await this.store(
      url,
      JSON.stringify({ request: finalRequest, response })
    );
  }

  async storeRequestResponse(
    orgId: string,
    requestId: string,
    request: string,
    response: string
  ): Promise<Result<string, string>> {
    const url = this.getRequestResponseUrl(requestId, orgId);

    console.log(request);

    return await this.store(url, JSON.stringify({ request, response }));
  }

  async store(url: string, value: string): Promise<Result<string, string>> {
    try {
      const compressedValue = await gzip(value);

      const signedRequest = await this.awsClient.sign(url, {
        method: "PUT",
        body: compressedValue,
        headers: {
          "Content-Type": "application/json",
          "Content-Encoding": "gzip",
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

  async downloadImageAndEncodeToBase64(
    imageUrl: string
  ): Promise<string | null> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.log(
          `Failed to download image: ${response.statusText}, image: ${imageUrl}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      return base64;
    } catch (error) {
      console.error("Error downloading or encoding image:", error);
    }
    return null;
  }
}
