import crypto from "crypto";

/**
 * Hashes the authentication key using SHA-256 algorithm.
 * @param key - The authentication key to be hashed.
 * @returns A promise that resolves to the hashed key as a string.
 */
export async function hashAuth(key: string): Promise<string> {
  key = `Bearer ${key}`;
  const encoder = new TextEncoder();
  const hashedKey = await crypto.subtle.digest(
    { name: "SHA-256" },
    encoder.encode(key)
  );
  const byteArray = Array.from(new Uint8Array(hashedKey));
  const hexCodes = byteArray.map((value) => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, "0");
    return paddedHexCode;
  });
  return hexCodes.join("");
}
