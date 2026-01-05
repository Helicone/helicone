import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { PromiseGenericResult } from "../../packages/common/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import { sanitizeObject } from "../../utils/sanitize";

export class PromptHandler extends AbstractLogHandler {
  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();
    context.timingMetrics.push({
      constructor: this.constructor.name,
      start,
    });

    // Process Helicone Template
    if (
      context.message.log.request.promptId &&
      context.message.log.request.heliconeTemplate
    ) {
      let heliconeTemplate: TemplateWithInputs;
      try {
        heliconeTemplate = sanitizeObject(
          context.message.log.request.heliconeTemplate
        );
      } catch {
        console.error(`Error sanitizing helicone template`);
        heliconeTemplate = context.message.log.request.heliconeTemplate;
      }

      context.processedLog.request.heliconeTemplate = heliconeTemplate;
    }

    return await super.handle(context);
  }
}
