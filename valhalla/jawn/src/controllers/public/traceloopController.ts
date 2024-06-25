import {
  Controller,
  Request,
  Route,
  Post,
  Tags,
  Security,
  Body,
} from "tsoa";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { OTELTrace, TraceManager } from "../../managers/traceManager";

@Route("v1/trace")
@Tags("Trace")
@Security("api_key")
export class TraceController extends Controller {
  @Post("log")
  public async logTrace(
    @Request() request: JawnAuthenticatedRequest,
    @Body() traceBody: OTELTrace
  ) {
    console.log("Received traces.");
    const traceManager = new TraceManager();
    try {
      await traceManager.consumeTraces(traceBody, request.header("authorization") ?? "", request.authParams);
      this.setStatus(200);
    } catch (error: any) {
      console.error(`Error processing OTEL trace : ${error.message}`);
      this.setStatus(500);
    }
    return;
  }
}
