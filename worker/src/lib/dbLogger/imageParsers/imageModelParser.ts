import { ClaudeImageParser } from "./claudeImageParser";
import { GptVisionImageParser } from "./gptVisionImageParser";

/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class ImageModelParser {
  protected modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }
  abstract processMessages(messages: any[]): Record<string, string>;

  protected generateAssetId(): string {
    return crypto.randomUUID();
  }
}

export function getImageModelParser(
  modelName: string
): ImageModelParser | null {
  switch (modelName) {
    case "gpt-4-vision-preview":
    case "gpt-4-1106-vision-preview":
      return new GptVisionImageParser(modelName);
    case "claude-3-opus-20240229":
    case "claude-3-sonnet-20240229":
    case "claude-3-haiku-20240307":
      return new ClaudeImageParser(modelName);
    default:
      return null;
  }
}
