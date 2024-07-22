import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { PromiseGenericResult } from "../shared/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class PromptHandler extends AbstractLogHandler {
  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    // Process Helicone Template
    if (
      context.message.log.request.promptId &&
      context.message.log.request.heliconeTemplate
    ) {
      const assets = context.processedLog.assets;
      let heliconeTemplate: TemplateWithInputs;
      try {
        heliconeTemplate = this.sanitizeTemplateWithInputs(
          context.message.log.request.heliconeTemplate
        );
      } catch {
        console.error(`Error sanitizing helicone template`);
        heliconeTemplate = context.message.log.request.heliconeTemplate;
      }

      // If assets are present, replace the inputs with the asset ids
      if (assets) {
        const inverseAssets: Map<string, string> = new Map();
        for (const [key, value] of Object.entries(assets)) {
          inverseAssets.set(value, key);
        }

        const inputs = Object.entries(heliconeTemplate.inputs).reduce<{
          [key: string]: string;
        }>((acc, [key, value]) => {
          const assetId = inverseAssets.get(value);
          acc[key] = assetId ? `<helicone-asset-id key="${assetId}"/>` : value;
          return acc;
        }, {});

        const processedTemplate: TemplateWithInputs = {
          template: heliconeTemplate.template,
          inputs: inputs,
          autoInputs: heliconeTemplate.autoInputs,
        };

        context.processedLog.request.heliconeTemplate = processedTemplate;
      } else {
        // If no assets, just pass the template as is
        context.processedLog.request.heliconeTemplate = heliconeTemplate;
      }
    }

    return await super.handle(context);
  }

  private escapeUnicode(str: string): string {
    return str.replace(/\u0000/g, "");
  }

  private sanitizeTemplate(template: any): any {
    if (typeof template === "string") {
      return this.escapeUnicode(template);
    }
    if (Array.isArray(template)) {
      return template.map((item) => this.sanitizeTemplate(item));
    }
    if (typeof template === "object" && template !== null) {
      const sanitizedTemplate: { [key: string]: any } = {};
      for (const key in template) {
        if (template.hasOwnProperty(key)) {
          sanitizedTemplate[key] = this.sanitizeTemplate(template[key]);
        }
      }
      return sanitizedTemplate;
    }
    return template;
  }

  private sanitizeTemplateWithInputs(
    templateWithInputs: TemplateWithInputs
  ): TemplateWithInputs {
    return {
      template: this.sanitizeTemplate(templateWithInputs.template),
      inputs: this.sanitizeInputs(templateWithInputs.inputs),
      autoInputs: templateWithInputs.autoInputs.map((autoInput) =>
        this.sanitizeInputs(autoInput)
      ),
    };
  }

  private sanitizeInputs(inputs: { [key: string]: string }): {
    [key: string]: string;
  } {
    const sanitizedInputs: { [key: string]: string } = {};
    for (const key in inputs) {
      if (inputs.hasOwnProperty(key)) {
        sanitizedInputs[key] = this.escapeUnicode(inputs[key]);
      }
    }
    return sanitizedInputs;
  }
}
