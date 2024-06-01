import { ParseInput, ParseOutput } from "./IBodyProcessor";

export function isJson(parseInput: ParseInput): boolean {
  const { responseBody } = parseInput;
  try {
    JSON.parse(responseBody);
    return true;
  } catch (e) {
    return false;
  }
}
