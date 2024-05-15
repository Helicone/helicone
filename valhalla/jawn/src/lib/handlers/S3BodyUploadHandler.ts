import { S3Client } from "../shared/db/s3Client";
import { PromiseGenericResult, err } from "../shared/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class S3BodyUploadHandler extends AbstractLogHandler {
  private s3Client: S3Client;

  constructor(s3Client: S3Client) {
    super();
    this.s3Client = s3Client;
  }

  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const requestId = context.message.log.request.id;
    const orgId = context.orgParams?.id;

    try {
      if (!orgId) {
        return err("Org Id not found");
      }

      const key = this.s3Client.getRequestResponseKey(requestId, orgId);
      const request = await this.s3Client.store(
        key,
        context.processedLog.request.body
      );

      if (request.error) {
        return err(`Failed to store request body: ${request.error}`);
      }

      const response = await this.s3Client.store(
        key,
        context.processedLog.response.body
      );

      console.log(
        `Storing raw request, response data to S3: ${JSON.stringify(
          response
        )}. Url: ${key}`
      );

      if (response.error) {
        return err(`Failed to store response body: ${response.error}`);
      }

      return await super.handle(context);
    } catch (error) {
      return err(
        `Error processing S3 body upload: ${error}, Context: ${this.constructor.name}`
      );
    }
  }
}
