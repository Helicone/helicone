import { PromiseGenericResult, ok } from "../../modules/result";
import { IBodyProcessor, ParseInput } from "./IBodyProcessor";

export class GenericBodyProcessor implements IBodyProcessor {
  public async parse(parseInput: ParseInput): PromiseGenericResult<any> {
    return ok(JSON.parse(parseInput.responseBody));
  }
}
