/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImageModelResponseBodyParser } from "./core/modelResponseBodyParser";
import { ImageModelParsingResponse } from "./core/parsingResponse";

export class FluxImageParser extends ImageModelResponseBodyParser {
  constructor(modelName: string, responseId: string) {
    super(modelName, responseId);
  }

  processResponseBody(body: any): ImageModelParsingResponse {
    let responseBody = body;
    try {
      responseBody = JSON.parse(JSON.stringify(body));
    } catch (error) {
      console.error(
        `Error processing response body for model: ${this.modelName}, error: ${error}`
      );
    }

    return {
      body: responseBody,
    };
  }
}
