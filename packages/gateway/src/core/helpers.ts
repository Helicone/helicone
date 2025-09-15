/**
 * Core utility functions for the gateway package
 * These are pure functions with no external dependencies
 */

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeout Timeout in milliseconds
 * @returns The result of the promise or throws a timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeout: number
): Promise<T> {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), timeout)
  );
  return (await Promise.race([promise, timeoutPromise])) as T;
}

/**
 * Enumerates an array with indices
 * @param arr Array to enumerate
 * @returns Array of [index, item] tuples
 */
export function enumerate<T>(arr: T[]): [number, T][] {
  return arr.map((item, index) => [index, item]);
}

/**
 * Deep comparison of two objects
 * @param a First object
 * @param b Second object
 * @returns True if objects are deeply equal
 */
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

/**
 * Compress a string using gzip
 * @param str String to compress
 * @returns Compressed Uint8Array
 */
export async function compress(str: string): Promise<Uint8Array> {
  // Convert the string to a byte stream.
  const stream = new Blob([str]).stream();

  // Create a compressed stream.
  const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));

  // Read all the bytes from this stream.
  const chunks = [];
  for await (const chunk of compressedStream) {
    chunks.push(chunk);
  }
  return await concatUint8Arrays(chunks);
}

/**
 * Concatenate multiple Uint8Arrays
 * @param uint8arrays Arrays to concatenate
 * @returns Single concatenated Uint8Array
 */
async function concatUint8Arrays(
  uint8arrays: Uint8Array[]
): Promise<Uint8Array> {
  const blob = new Blob(uint8arrays);
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Extract model from request body or path
 * @param requestBody Request body (as string or object)
 * @param path Request path
 * @returns Model name or null
 */
export function getModelFromRequest(requestBody: any, path: string): string | null {
  if (requestBody && requestBody.model) {
    return requestBody.model;
  }

  const modelFromPath = getModelFromPath(path);
  if (modelFromPath) {
    return modelFromPath;
  }

  return null;
}

/**
 * Extract model from URL path
 * @param path URL path
 * @returns Model name or undefined
 */
export function getModelFromPath(path: string): string | undefined {
  const regex1 = /\/engines\/([^/]+)/;
  const regex2 = /models\/([^/:]+)/;

  let match = path.match(regex1);

  if (!match) {
    match = path.match(regex2);
  }

  if (match && match[1]) {
    return match[1];
  } else {
    return undefined;
  }
}

/**
 * Extract model from response body
 * @param responseBody Response body object
 * @returns Model name or "unknown"
 */
export function getModelFromResponse(responseBody: any): string {
  try {
    if (typeof responseBody !== "object" || !responseBody) {
      return "unknown";
    }
    if (Array.isArray(responseBody)) {
      return "unknown";
    }

    return (
      responseBody["model"] || 
      (responseBody.body as any)?.["model"] || 
      "unknown"
    );
  } catch (e) {
    return "unknown";
  }
}