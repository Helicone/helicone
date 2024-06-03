import { ParseInput, ParseOutput } from "./IBodyProcessor";

export function isParseInputJson(parseInput: ParseInput): boolean {
  const { responseBody } = parseInput;
  try {
    JSON.parse(responseBody);
    return true;
  } catch (e) {
    return false;
  }
}
