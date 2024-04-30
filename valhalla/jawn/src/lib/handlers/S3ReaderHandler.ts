import { S3Client } from "../shared/db/s3Client";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class S3ReaderHandler extends AbstractLogHandler {
  private s3Client: S3Client;

  constructor(s3Client: S3Client) {
    super();
    this.s3Client = s3Client;
  }

  public async handle(context: HandlerContext): Promise<void> {
    console.log(`S3ReaderHandler: ${context.message.log.request.id}`);
    try {
      if (!context.authParams?.organizationId) {
        console.error("Organization ID not found in auth params");
        return;
      }

      const signedUrl = await this.s3Client.getRawRequestResponseBody(
        context.authParams?.organizationId,
        context.message.log.request.id
      );

      if (signedUrl.error || !signedUrl.data) {
        // There should always be a signed URL for the request/response even if omitted
        console.error(
          `Error getting signed URL for request/response: ${signedUrl.error}`
        );
        return;
      }

      const content = await this.fetchContent(signedUrl.data);

      if (content.error || !content.data) {
        console.error(`Error fetching content from S3: ${content.error}`);
        return;
      }

      context.processedLog.request.rawBody = content.data.request;
      context.processedLog.response.rawBody = content.data.response;
      super.handle(context);
    } catch (error) {
      console.error(`Error fetching content from S3: ${error}`);
      return;
    }
  }

  private async fetchContent(signedUrl: string): PromiseGenericResult<{
    request: string;
    response: string;
  }> {
    try {
      const contentResponse = await fetch(signedUrl);
      const text = await contentResponse.text();
      const { request, response } = JSON.parse(text);
      return ok({
        request: JSON.stringify(request),
        response: JSON.stringify(response),
      });
    } catch (error: any) {
      console.error(`Error fetching content from S3: ${error}`);
      return err(`Error fetching content from S3: ${error}`);
    }
  }
}
