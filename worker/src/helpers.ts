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
