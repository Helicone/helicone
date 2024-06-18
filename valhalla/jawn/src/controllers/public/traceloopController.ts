import {
  Controller,
  Request,
  Route,
  Post,
  Get,
  Tags,
  Security,
} from "tsoa";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { OTELTrace, TraceManager } from "../../managers/traceManager";

@Route("v1/trace")
@Tags("Trace")
@Security("api_key")
export class TraceController extends Controller {

  @Get("/")
  public async healthcheck() {
    this.setStatus(200);
    return { status: "ok" };
  }

  @Post("log")
  public async logTrace(@Request() request: JawnAuthenticatedRequest) {
    console.log("----------------RECEIVED----------------");

    const traceManager = new TraceManager();
    const trace = request.body as OTELTrace;
    try {
      await traceManager.consumeTraces(trace, request.header("authorization") ?? "", request.authParams);
      this.setStatus(200);
    } catch (error: any) {
      console.error(`Error processing OTEL trace : ${error.message}`);
      this.setStatus(500);
    }
    return;
  }
}
