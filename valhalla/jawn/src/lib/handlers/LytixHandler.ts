import * as Sentry from "@sentry/node";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

interface LytixModelIO {
  lytixHost?: string;
  apiKey: string;
  modelName: string;
  modelInput: string;
  modelOutput: string;
  metaData: Record<string, string>;
  session: string;
  sessionPath: string;
  sessionName: string;
  userIdentifier: string;
}

export class LytixHandler extends AbstractLogHandler {
  private lytixModelIO: LytixModelIO[] = [];
  constructor() {
    super();
  }

  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    if (!context.message.heliconeMeta.lytixKey) {
      return await super.handle(context);
    }

    this.lytixModelIO.push({
      lytixHost: context.message.heliconeMeta.lytixHost,
      apiKey: context.message.heliconeMeta.lytixKey,
      modelName: context.processedLog.model ?? "",
      modelInput: JSON.stringify(context.processedLog.request.body) ?? "",
      modelOutput: JSON.stringify(context.processedLog.response.body) ?? "",
      metaData: context.processedLog.request.properties ?? {},
      session:
        context.message.log.request.properties?.["Helicone-Session-ID"] ?? "",
      sessionPath:
        context.message.log.request.properties?.["Helicone-Session-Path"] ?? "",
      sessionName:
        context.message.log.request.properties?.["Helicone-Session-Name"] ?? "",
      userIdentifier: context.message.log.request.userId,
    });

    return await super.handle(context);
  }

  public async handleResults(): PromiseGenericResult<string> {
    for (const lytixModelIO of this.lytixModelIO) {
      try {
        // send lytix logs to lytix
        const lytixHost = lytixModelIO.lytixHost ?? "https://api.lytix.co";
        await fetch(`${lytixHost}/v1/metrics/modelIO`, {
          method: "POST",
          headers: {
            "lx-api-key": `Bearer ${lytixModelIO.apiKey}`,
          },
          body: JSON.stringify({
            modelName: lytixModelIO.modelName,
            modelInput: lytixModelIO.modelInput,
            modelOutput: lytixModelIO.modelOutput,
            metricMetadata: {},
            userIdentifier: lytixModelIO.userIdentifier,
            sessionId: lytixModelIO.session,
            sessionPath: lytixModelIO.sessionPath,
            sessionName: lytixModelIO.sessionName,
          }),
        });
      } catch (error: any) {
        Sentry.captureException(error);
        return err("Failed to handle lytix logs");
      }
    }

    return ok("Successfully handled lytix logs");
  }
}
