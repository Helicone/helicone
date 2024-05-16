import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";
import { Message } from "../../lib/handlers/HandlerContext";
import { LogManager } from "../../managers/LogManager";

@Route("v1/log")
@Tags("Log")
@Security("api_key")
export class LogController extends Controller {
  /**
   * @param logMessage Log message to log
   */
  @Post("/request")
  public async getRequests(
    @Body()
    logMessage: Message,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<void> {
    console.log(
      `Received log message for request: ${logMessage.log.request.id}`
    );
    const logManager = new LogManager();
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
