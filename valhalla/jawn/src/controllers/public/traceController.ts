import { Controller, Request, Route, Post, Tags, Security, Body } from "tsoa";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { type OTELTrace, TraceManager } from "../../managers/traceManager";
import * as protobuf from "protobufjs";
import path from "path";
import { CustomTraceManager } from "../../managers/customTraceManager";
import {
  type TypedAsyncLogModel,
  validateTypedAsyncLogModel,
  type ValidationResult,
} from "../../types/customTrace";

@Route("v1/trace")
@Tags("Trace")
@Security("api_key")
export class TraceController extends Controller {
  @Post("custom/v1/log")
  public async logCustomTraceLegacy(
    @Request() request: JawnAuthenticatedRequest,
    @Body() traceBody: any,
  ) {
    await this.processCustomTrace(request, traceBody);
  }

  @Post("custom/log")
  public async logCustomTrace(
    @Request() request: JawnAuthenticatedRequest,
    @Body() traceBody: any,
  ) {
    await this.processCustomTrace(request, traceBody);
  }

  @Post("custom/log/typed")
  public async logCustomTraceTyped(
    @Request() request: JawnAuthenticatedRequest,
    @Body() traceBody: TypedAsyncLogModel,
  ): Promise<ValidationResult | void> {
    const validation = validateTypedAsyncLogModel(traceBody);

    if (!validation.isValid) {
      this.setStatus(400);
      return validation;
    }

    try {
      const legacyTraceBody = {
        providerRequest: {
          url: traceBody.providerRequest.url,
          json: traceBody.providerRequest.json,
          meta: traceBody.providerRequest.meta,
        },
        providerResponse: {
          json: traceBody.providerResponse.json,
          textBody: traceBody.providerResponse.textBody,
          status: traceBody.providerResponse.status,
          headers: traceBody.providerResponse.headers,
        },
        timing: traceBody.timing
          ? {
              timeToFirstToken: traceBody.timing.timeToFirstToken,
              startTime: traceBody.timing.startTime,
              endTime: traceBody.timing.endTime,
            }
          : undefined,
        provider: traceBody.provider,
      };

      await this.processCustomTrace(request, legacyTraceBody);
      this.setStatus(200);
    } catch (error: any) {
      console.error(`Error processing typed custom trace: ${error.message}`);
      this.setStatus(500);
      return {
        isValid: false,
        errors: [{ field: "processing", message: error.message }],
      };
    }
  }

  private async processCustomTrace(
    request: JawnAuthenticatedRequest,
    traceBody: any,
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
        request.authParams,
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
    @Body() traceBody: OTELTrace,
  ) {
    console.log("Received traces.");
    const traceManager = new TraceManager();
    try {
      await traceManager.consumeTraces(
        traceBody,
        request.header("authorization") ?? "",
        request.authParams,
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
    @Body() traceBody: any,
  ) {
    try {
      const protoFile = path.join(
        __dirname,
        "..",
        "..",
        "utils",
        "trace.proto",
      );
      const root = await protobuf.load(protoFile);
      const TracesData = root.lookupType(
        "opentelemetry.proto.trace.v1.TracesData",
      );
      const tracesData = TracesData.decode(traceBody);
      const jsonSpan = tracesData.toJSON();

      const traceManager = new TraceManager();
      await traceManager.consumeTraces(
        jsonSpan as any,
        request.header("authorization") ?? "",
        request.authParams,
      );

      this.setStatus(200);
    } catch (error: any) {
      console.error(`Error processing Python OTEL trace: ${error.message}`);
      this.setStatus(500);
    }
    return;
  }
}
