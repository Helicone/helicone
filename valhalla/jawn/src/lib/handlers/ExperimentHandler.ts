import { S3Client } from "../shared/db/s3Client";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class ExperimentHandler extends AbstractLogHandler {

  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    try {
      if (!context.orgParams?.id) {
        return err("Organization ID not found in org params");
      }

      

      return await super.handle(context);
    } catch (error) {
      return err(
        `Error handling experiment: ${error}, Context: ${this.constructor.name}`
      );
    }
  }
}
