import { err } from "../result";
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

export function mapLines(lines: string[], provider: string): any[] {
  return lines.map((line, i) => {
    try {
      const chunk = line.replace("data:", "");
      if (chunk === "[DONE]") {
        return {
          helicone_translated_for_logging_only: "[DONE]",
        };
      }
      return JSON.parse(chunk);
    } catch (e) {
      console.log(
        `Helicone had an error parsing this line: ${line} for provider ${provider}`
      );
      return err({ msg: `Helicone had an error parsing this line: `, line });
    }
  });
}
