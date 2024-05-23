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

  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    try {
      if (!context.orgParams?.id) {
        return err("Organization ID not found in org params");
      }

      const signedUrl = await this.s3Client.getRawRequestResponseBodySignedUrl(
        context.orgParams.id,
        context.message.log.request.id
      );

      if (signedUrl.error || !signedUrl.data) {
        // There should always be a signed URL for the request/response even if omitted
        return err(
          `Error getting signed URL for request/response: ${signedUrl.error}`
        );
      }

      const content = await this.s3Client.fetchContent(signedUrl.data);

      if (content.error || !content.data) {
        if (content.error?.notFoundErr) {
          // Not found is unrecoverable, we will have no request/response to log
          // Do not process further, do not send to DLQ
          return ok(`Content not found in S3: ${signedUrl.data}`);
        }
        return err(
          `Error fetching content from S3: ${JSON.stringify(content.error)}`
        );
      }

      context.rawLog.rawRequestBody = content.data.request;
      context.rawLog.rawResponseBody = content.data.response;

      return await super.handle(context);
    } catch (error) {
      return err(
        `Error fetching content from S3: ${error}, Context: ${this.constructor.name}`
      );
    }
  }
}
