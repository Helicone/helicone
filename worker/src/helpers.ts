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
