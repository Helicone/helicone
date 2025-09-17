import { S3Client } from "../clients/S3Client";
import { Result } from "../util/results";

export class RequestResponseManager {
  constructor(private s3Client: S3Client) {}

  async storeRequestResponseRaw(content: {
    organizationId: string;
    requestId: string;
    requestStream: ReadableStream;
  }): Promise<Result<string, string>> {
    const url = this.s3Client.getRequestResponseRawUrl(
      content.requestId,
      content.organizationId
    );

    const tags: Record<string, string> = {
      name: "raw-request-response-body",
    };

    return await this.s3Client.store(url, content.requestStream, tags);
  }
}
