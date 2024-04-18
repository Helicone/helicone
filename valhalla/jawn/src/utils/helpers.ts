import { PromiseGenericResult, err, ok } from "../lib/modules/result";
import {
  getTokenCountAnthropic,
  getTokenCountGPT3,
} from "../lib/tokens/tokenCounter";
import { Provider } from "../models/models";

export function tryParse(text: string, errorMsg?: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    return {
      error: `Error parsing ${errorMsg}, ${e}, ${text}`,
    };
  }
}

export async function getTokenCount(
  inputText: string,
  provider: Provider
): Promise<number> {
  if (!inputText) return 0;

  if (provider === "OPENAI") {
    return await getTokenCountGPT3(inputText);
  } else if (provider === "ANTHROPIC") {
    return await getTokenCountAnthropic(inputText);
  } else {
    return 0;
  }
}
