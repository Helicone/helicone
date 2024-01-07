import * as crypto from "crypto";
const encoder = new TextEncoder();

export async function hashAuth(key: string): Promise<string> {
  key = `Bearer ${key}`;
  const hashedKey = await crypto.subtle.digest(
    { name: "SHA-256" },
    encoder.encode(key)
  );
  const uintArray = new Uint8Array(hashedKey);
  const byteArray = Array.from(uintArray);
  const hexCodes = byteArray.map((value) => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, "0");
    return paddedHexCode;
  });
  const res = hexCodes.join("");

  // drop unintArray and byteArray from memory
  uintArray.fill(0);
  byteArray.fill(0);

  return res;
}
