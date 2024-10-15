import { S3Client } from "../shared/db/s3Client";
import { Result } from "../shared/result";

export class S3Manager {
  constructor(private s3Client: S3Client) {}

  async storeRequestResponseRaw(content: {
    organizationId: string;
    requestId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requestBody: any;
    responseBody: string;
  }): Promise<Result<string, string>> {
    const url = this.s3Client.getRequestResponseRawUrl(
      content.requestId,
      content.organizationId
    );

    const tags: Record<string, string> = {
      name: "raw-request-response-body",
    };

    return await this.s3Client.store(
      url,
      JSON.stringify({
        request: content.requestBody,
        response: content.responseBody,
      }),
      tags
    );
  }
}
