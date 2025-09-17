/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { EventEmitter } from "events";
import { Database } from "../../../supabase/database.types";

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

async function concatUint8Arrays(
  uint8arrays: Uint8Array[]
): Promise<Uint8Array> {
  const blob = new Blob(uint8arrays);
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

export function getModelFromRequest(requestBody: string, path: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (requestBody && (requestBody as any).model) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (requestBody as any).model;
  }

  const modelFromPath = getModelFromPath(path);
  if (modelFromPath) {
    return modelFromPath;
  }

  return null;
}

export function getModelFromPath(path: string) {
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

export function getModelFromResponse(responseBody: any) {
  try {
    if (typeof responseBody !== "object" || !responseBody) {
      return "unknown";
    }
    if (Array.isArray(responseBody)) {
      return "unknown";
    }

    return (
      responseBody["model"] || (responseBody.body as any)["model"] || "unknown"
    );
  } catch (e) {
    return "unknown";
  }
}
