import { ImageModelParsingResponse } from "./parsingResponse";
import { v5 as uuidv5 } from "uuid";

// Must remain constant
const NAMESPACE_UUID = "b931404b-060f-429f-a7d4-c4aed05bb9e6";

/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class ImageModelResponseBodyParser {
  protected modelName: string;
  protected responseId: string;
  protected assetIndex: number = 0;

  constructor(modelName: string, responseId: string) {
    this.modelName = modelName;
    this.responseId = responseId;
  }
  abstract processResponseBody(body: any): ImageModelParsingResponse;

  protected generateAssetId(uniqueId: string, index: number) {
    const uniqueName = `${uniqueId}-${index}`;
    const assetId = uuidv5(uniqueName, NAMESPACE_UUID);

    return assetId;
  }
}
