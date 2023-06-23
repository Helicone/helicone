import { EventEmitter } from "events";
import { Env, Provider } from ".";
import { RequestWrapper } from "./lib/RequestWrapper";

export const once = (emitter: EventEmitter, eventName: string): Promise<string> =>
  new Promise((resolve) => {
    const listener = (value: string) => {
      emitter.removeListener(eventName, listener);
      resolve(value);
    };
    emitter.addListener(eventName, listener);
  });

export function getProvider(requestWrapper: RequestWrapper, env: Env): Env["PROVIDER"] {
  const oai = "OAI";
  const urlString = requestWrapper.url?.href.toUpperCase();
  const provider = env.PROVIDER.toUpperCase();

  if (urlString?.includes(Provider.ANTHROPIC) || provider === Provider.ANTHROPIC) {
    return Provider.ANTHROPIC;
  }

  if (urlString?.includes(oai) || urlString?.includes(Provider.OPENAI) || provider === Provider.OPENAI || provider === oai) {
    return Provider.OPENAI;
  }

  throw new Error("Provider not found");
}