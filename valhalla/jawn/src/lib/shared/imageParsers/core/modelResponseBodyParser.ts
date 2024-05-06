import { ImageModelParsingResponse } from "./parsingResponse";
import crypto from "crypto";

/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class ImageModelResponseBodyParser {
  protected modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }
  abstract processResponseBody(body: any): ImageModelParsingResponse;

  protected generateAssetId(): string {
    return crypto.randomUUID();
  }
}
