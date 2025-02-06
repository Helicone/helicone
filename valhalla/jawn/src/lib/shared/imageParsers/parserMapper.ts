import { ClaudeImageParser } from "./claudeImageParser";
import { GptVisionImageParser } from "./gptVisionImageParser";
import { ImageModelRequestBodyParser } from "./core/modelRequestBodyParser";
import { DalleImageParser } from "./dalleImageParser";
import { ImageModelResponseBodyParser } from "./core/modelResponseBodyParser";
import { FluxImageParser } from "./fluxImageParser";

export function getRequestImageModelParser(
  modelName: string,
  requestId: string
): ImageModelRequestBodyParser | null {
  if (modelName.includes("gpt")) {
    return new GptVisionImageParser(modelName, requestId);
  }
  if (modelName.includes("claude")) {
    return new ClaudeImageParser(modelName, requestId);
  }
  return null;
}

export function getResponseImageModelParser(
  modelName: string,
  responseId: string
): ImageModelResponseBodyParser | null {
  switch (modelName) {
    case "dall-e-3":
    case "dall-e-2":
      return new DalleImageParser(modelName, responseId);
    case "black-forest-labs/FLUX.1-schnell":
      return new FluxImageParser(modelName, responseId);
    default:
      return null;
  }
}
