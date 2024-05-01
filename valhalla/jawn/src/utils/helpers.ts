import { PromiseGenericResult, ok, err } from "../lib/shared/result";
import {
  getTokenCountAnthropic,
  getTokenCountGPT3,
} from "../lib/tokens/tokenCounter";
import { Provider } from "../models/models";
import crypto from "crypto";
import zlib from "zlib";

export function tryParse(text: string, errorMsg?: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    return {
      error: `Error parsing ${errorMsg}, ${e}, ${text}`,
    };
  }
}

export async function getTokenCount(
  inputText: string,
  provider: Provider
): Promise<number> {
  if (!inputText) return 0;

  if (provider === "OPENAI") {
    return await getTokenCountGPT3(inputText);
  } else if (provider === "ANTHROPIC") {
    return await getTokenCountAnthropic(inputText);
  } else {
    return 0;
  }
}

export function deepCompare(a: any, b: any): boolean {
  if (a === b) return true;

  if (typeof a === "object" && typeof b === "object") {
    if (Object.keys(a).length !== Object.keys(b).length) return false;

    for (const key in a) {
      if (!deepCompare(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
}

export function stringToNumberHash(str: string): number {
  const hash = crypto.createHash("sha256");
  hash.update(str);

  const hexHash = hash.digest("hex");

  const integer = parseInt(hexHash.substring(0, 16), 16);

  return integer;
}

export async function compressData(
  value: string
): PromiseGenericResult<Buffer> {
  const buffer = Buffer.from(value, "utf-8");
  return new Promise((resolve, reject) => {
    zlib.gzip(buffer, (error, result) => {
      if (error) {
        console.error(`Failed to compress value: ${error}`);
        resolve(err("Failed to compress value"));
      }
      resolve(ok(result));
    });
  });
}
