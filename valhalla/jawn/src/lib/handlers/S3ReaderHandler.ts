import { S3Client } from "../shared/db/s3Client";
import { PromiseGenericResult, err, ok } from "../../packages/common/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";

export class S3ReaderHandler extends AbstractLogHandler {
  private s3Client: S3Client;

  constructor(s3Client: S3Client) {
    super();
    this.s3Client = s3Client;
  }

  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();
    context.timingMetrics.push({
      constructor: this.constructor.name,
      start,
    });
    try {
      if (!context.orgParams?.id) {
        return err("Organization ID not found in org params");
      }

      const requestIdWithData =
        context.message.log.request.cacheReferenceId !== DEFAULT_UUID &&
        context.message.log.request.cacheReferenceId
          ? context.message.log.request.cacheReferenceId
          : context.message.log.request.id;

      const signedUrl = await this.s3Client.getRawRequestResponseBodySignedUrl(
        context.orgParams.id,
        requestIdWithData
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
          // Content not found in S3 - this can happen when:
          // 1. Free tier limit exceeded (bodies not stored)
          // 2. Omit headers set (bodies not stored)
          // Continue processing with empty bodies - metadata will still be logged
          console.log(
            `S3 content not found for request ${context.message.log.request.id}, continuing with empty bodies`
          );
          context.rawLog.rawRequestBody = undefined;
          context.rawLog.rawResponseBody = undefined;
          return await super.handle(context);
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
