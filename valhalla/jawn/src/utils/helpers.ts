import crypto from "crypto";
import zlib from "zlib";
import { PromiseGenericResult, err, ok } from "../lib/shared/result";

export function tryParse(text: string, errorMsg?: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    return {
      error: `Error parsing ${errorMsg}, ${e}, ${text}`,
    };
  }
}

export function deepCompare(a: any, b: any): boolean {
  if (a === b) return true;

  if (a && b && typeof a === "object" && typeof b === "object") {
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

export function isValidTimeZoneDifference(timeZoneDifference: number): boolean {
  const minutesInDay = 24 * 60;
  return (
    !isNaN(timeZoneDifference) &&
    timeZoneDifference >= -minutesInDay &&
    timeZoneDifference <= minutesInDay
  );
}
