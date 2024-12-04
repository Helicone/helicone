import { Controller, Request, Route, Post, Tags, Security, Body } from "tsoa";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { OTELTrace, TraceManager } from "../../managers/traceManager";
import * as protobuf from "protobufjs";
import path from "path";

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
      await traceManager.consumeTraces(
        traceBody,
        request.header("authorization") ?? "",
        request.authParams
      );
      this.setStatus(200);
    } catch (error: any) {
      console.error(`Error processing OTEL trace : ${error.message}`);
      this.setStatus(500);
    }
    return;
  }

  @Post("log-python")
  public async logPythonTrace(
    @Request() request: JawnAuthenticatedRequest,
    @Body() traceBody: any
  ) {
    try {
      const protoFile = path.join(
        __dirname,
        "..",
        "..",
        "utils",
        "trace.proto"
      );
      const root = await protobuf.load(protoFile);
      const TracesData = root.lookupType(
        "opentelemetry.proto.trace.v1.TracesData"
      );
      const tracesData = TracesData.decode(traceBody);
      const jsonSpan = tracesData.toJSON();

      const traceManager = new TraceManager();
      await traceManager.consumeTraces(
        jsonSpan as any,
        request.header("authorization") ?? "",
        request.authParams
      );

      this.setStatus(200);
    } catch (error: any) {
      console.error(`Error processing Python OTEL trace: ${error.message}`);
      this.setStatus(500);
    }
    return;
  }
}
