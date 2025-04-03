import { Controller, Request, Route, Post, Tags, Security, Body } from "tsoa";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { OTELTrace, TraceManager } from "../../managers/traceManager";
import * as protobuf from "protobufjs";
import path from "path";
import { CustomTraceManager } from "../../managers/customTraceManager";

@Route("v1/trace")
@Tags("Trace")
@Security("api_key")
export class TraceController extends Controller {
  @Post("custom/v1/log")
  public async logCustomTraceLegacy(
    @Request() request: JawnAuthenticatedRequest,
    @Body() traceBody: any
  ) {
    await this.processCustomTrace(request, traceBody);
  }

  @Post("custom/log")
  public async logCustomTrace(
    @Request() request: JawnAuthenticatedRequest,
    @Body() traceBody: any
  ) {
    await this.processCustomTrace(request, traceBody);
  }

  private async processCustomTrace(
    request: JawnAuthenticatedRequest,
    traceBody: any
  ) {
    console.log("Received traces.");
    const traceManager = new CustomTraceManager();

    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === "string") {
        headers.set(key, value);
      }
    }
    try {
      await traceManager.consumeLog(
        traceBody,
        headers,
        request.header("authorization") ?? "",
        request.authParams
      );
      this.setStatus(200);
    } catch (error: any) {
      console.error(`Error processing custom trace: ${error.message}`);
      this.setStatus(500);
    }
  }

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
