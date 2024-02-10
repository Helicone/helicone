import { IHeliconeMeta } from "./HeliconeClientOptions";
import { fetch, Response } from "@whatwg-node/fetch";

export class HeliconePrompt {
  static async logPrompt(
    heliconeMeta: IHeliconeMeta,
    heliconeId: string,
    promptId: string,
    inputTemplate: any,
    inputs: Record<string, any>
  ): Promise<void> {
    const options = {
      method: "POST",
      headers: {
        "Helicone-Auth": `Bearer ${heliconeMeta.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs,
        inputTemplate,
      }),
    };

    let response: Response;
    let url: URL;
    try {
      url = new URL(heliconeMeta.baseUrl);
      url.pathname = `/v1/request/${heliconeId}/prompt/${promptId}/inputs`;
      response = await fetch(url, options);
    } catch (error: any) {
      console.error("Error making request to Helicone prompt endpoint:", error);
      return;
    }

    if (!response.ok) {
      console.error("Error logging prompt: ", response.statusText);
    }

    const responseBody = await response.text();
    const consumerResponse = new Response(responseBody, response);
    if (heliconeMeta.onPromptLog) {
      await heliconeMeta.onPromptLog(consumerResponse);
    }
  }
}

export function hpmt(
  strings: TemplateStringsArray,
  ...values: any[]
): {
  heliconeTemplate: string;
  inputs: Record<string, any>;
  builtString: string;
} {
  const heliconeTemplate = strings.reduce((acc, string, i) => {
    const val = values[i];
    if (val != null) {
      const key = Object.keys(val)[0];
      return acc + string + `<helicone-prompt-input key="${key}" />`;
    } else {
      return acc + string;
    }
  }, "");

  const inputs = strings.reduce((acc, string, i) => {
    const val = values[i];
    if (val != null) {
      const value = Object.values(val)[0];
      return { ...acc, [Object.keys(val)[0]]: value };
    } else {
      return acc;
    }
  }, {});

  const builtString = strings.reduce((acc, string, i) => {
    const val = values[i];
    if (val != null) {
      const value = Object.values(val)[0];
      return acc + string + value;
    } else {
      return acc + string;
    }
  }, "");
  return { heliconeTemplate, inputs, builtString };
}
