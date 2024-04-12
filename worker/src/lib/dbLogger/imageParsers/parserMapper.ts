import { ClaudeImageParser } from "./claudeImageParser";
import { GptVisionImageParser } from "./gptVisionImageParser";
import { ImageModelParser } from "./imageModelParser";

export function getImageModelParser(
  modelName: string
): ImageModelParser | null {
  switch (modelName) {
    case "gpt-4-turbo":
    case "gpt-4-turbo-2024-04-09":
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
