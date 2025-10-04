import { S3Client } from "../clients/S3Client";
import { Result } from "../util/results";
import { IRequestBodyBuffer } from "../../RequestBodyBuffer/IRequestBodyBuffer";

export type RequestResponseContent = {
  requestId: string;
  organizationId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestBody: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseBody: any;
  model: string;
  assets: Map<string, string>;
};

export class RequestResponseManager {
  constructor(private s3Client: S3Client) {}

  async storeRequestResponseRaw(content: {
    organizationId: string;
    requestId: string;
    requestBodyBuffer: IRequestBodyBuffer;
    providerResponse: string;
    openAIResponse?: string;
  }): Promise<Result<string, string>> {
    const url = this.s3Client.getRequestResponseRawUrl(
      content.requestId,
      content.organizationId
    );

    const result = await content.requestBodyBuffer.uploadS3Body(
      content.providerResponse,
      content.openAIResponse,
      url
    );

    // THIS SHOULD BE THE LAST THING WE DO WITH THE BODY....
    await content.requestBodyBuffer.delete();

    return result;
  }
}
