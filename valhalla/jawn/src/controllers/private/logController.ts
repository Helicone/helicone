import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { type KafkaMessageContents } from "../../lib/handlers/HandlerContext";
import { LogManager } from "../../managers/LogManager";

@Route("v1/log")
@Tags("Log")
@Security("api_key")
export class LogController extends Controller {
  /**
   * @param logMessage Log message to log
   */
  @Post("/request")
  public async logRequests(
    @Body()
    logMessage: KafkaMessageContents,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<void> {
    const logManager = new LogManager();
    if (
      logMessage.heliconeMeta.heliconeManualAccessKey &&
      logMessage.heliconeMeta.heliconeManualAccessKey !==
        process.env.HELICONE_MANUAL_ACCESS_KEY
    ) {
      this.setStatus(401);
      return;
    }
    try {
      await logManager.processLogEntry(logMessage);
      this.setStatus(200);
    } catch (error: any) {
      console.error(`Error processing log entry: ${error.message}`);
      this.setStatus(500);
    }
    return;
  }
}
