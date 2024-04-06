/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from "events";

export const once = (
  emitter: EventEmitter,
  eventName: string
): Promise<string> =>
  new Promise((resolve) => {
    const listener = (value: string) => {
      emitter.removeListener(eventName, listener);
      resolve(value);
    };
    emitter.addListener(eventName, listener);
  });

export async function withTimeout<T>(
  promise: Promise<T>,
  timeout: number
): Promise<T> {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), timeout)
  );
  return (await Promise.race([promise, timeoutPromise])) as T;
}

export function enumerate<T>(arr: T[]): [number, T][] {
  return arr.map((item, index) => [index, item]);
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

export async function compress(str: string) {
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

async function concatUint8Arrays(
  uint8arrays: Uint8Array[]
): Promise<Uint8Array> {
  const blob = new Blob(uint8arrays);
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}
