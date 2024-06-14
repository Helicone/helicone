import { costOfPrompt } from "../../packages/cost";
import {
  HeliconeRequestResponseToPosthog,
  PostHogEvent,
  PosthogUserClient,
} from "../clients/PosthogUserClient";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import crypto from "crypto";
import * as Sentry from "@sentry/node";

interface LytixModelIO {
  apiKey: string;
  modelName: string;
  modelInput: string;
  modelOutput: string;
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
      apiKey: context.message.heliconeMeta.lytixKey,
      modelName: context.processedLog.model ?? "",
      modelInput: JSON.stringify(context.processedLog.request.body) ?? "",
      modelOutput: JSON.stringify(context.processedLog.response.body) ?? "",
    });

    return await super.handle(context);
  }

  public async handleResults(): PromiseGenericResult<string> {
    for (const lytixModelIO of this.lytixModelIO) {
      try {
        // send lytix logs to lytix

        await fetch("https://api.lytix.co/v1/metrics/modelIO/helicone", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lytixModelIO.apiKey}`,
          },
          body: JSON.stringify(lytixModelIO),
        });
      } catch (error: any) {
        Sentry.captureException(error);
        return err("Failed to handle lytix logs");
      }
    }

    return ok("Successfully handled lytix logs");
  }
}
