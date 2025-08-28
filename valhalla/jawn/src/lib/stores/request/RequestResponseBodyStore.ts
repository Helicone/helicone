import { S3Client } from "../../shared/db/s3Client";
import { Result, err, ok } from "../../../packages/common/result";

export class RequestResponseBodyStore {
  private s3Client: S3Client;
  constructor(private orgId: string) {
    this.s3Client = new S3Client(
      process.env.S3_ACCESS_KEY || undefined,
      process.env.S3_SECRET_KEY || undefined,
      process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? "",
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
    );
  }

  async getRequestResponseBody(requestId: string): Promise<
    Result<
      {
        request: any;
        response: any;
      },
      string
    >
  > {
    const signedUrl = await this.s3Client.getRequestResponseBodySignedUrl(
      this.orgId,
      requestId
    );

    if (signedUrl.error) {
      return err(signedUrl.error);
    }

    return await this.fetchContent(signedUrl.data!);
  }

  private async fetchContent(signedUrl: string): Promise<
    Result<
      {
        request: any;
        response: any;
      },
      string
    >
  > {
    const content = await fetch(signedUrl);

    if (!content.ok) {
      return err(`Error fetching content from S3: ${content.statusText}`);
    }

    const text = await content.text();
    const { request, response } = JSON.parse(text);
    return ok({
      request,
      response,
    });
  }
}
