import { ImageModelParsingResponse } from "./parsingResponse";
import crypto from "crypto";

/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class ImageModelRequestBodyParser {
  protected modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }
  abstract processRequestBody(body: any): ImageModelParsingResponse;

  protected generateAssetId(): string {
    return crypto.randomUUID();
  }
}
