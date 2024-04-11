import { ClaudeImageParser } from "./claudeImageParser";
import { GptVisionImageParser } from "./gptVisionImageParser";
import { ImageModelRequestBodyParser } from "./core/ImageModelRequestBodyParser";
import { DalleImageParser } from "./dalleImageParser";
import { ImageModelResponseBodyParser } from "./core/ImageModelResponseBodyParser";

export function getRequestImageModelParser(
  modelName: string
): ImageModelRequestBodyParser | null {
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

export function getResponseImageModelParser(
  modelName: string
): ImageModelResponseBodyParser | null {
  switch (modelName) {
    case "dall-e-3":
    case "dall-e-2":
      return new DalleImageParser(modelName);
    default:
      return null;
  }
}
