import { ClientOptions } from "openai";
import { Response } from "@whatwg-node/fetch";

type OnHeliconeLog = (response: Response) => Promise<void>;
type OnHeliconeFeedback = (result: Response) => Promise<void>;
type OnPromptLog = (response: Response) => Promise<void>;

interface IHeliconeMeta {
  apiKey?: string;
  properties?: { [key: string]: any };
  cache?: boolean;
  retry?: boolean | { [key: string]: any };
  rateLimitPolicy?: string | { [key: string]: any };
  user?: string;
  baseUrl?: string;
  onLog?: OnHeliconeLog;
  onFeedback?: OnHeliconeFeedback;
  onPromptLog?: OnPromptLog;
}

interface IHeliconeProxyClientOptions extends ClientOptions {
  heliconeMeta: Omit<IHeliconeMeta, "onLog">;
}

interface IHeliconeAsyncClientOptions extends ClientOptions {
  heliconeMeta: Omit<IHeliconeMeta, "cache" | "retry" | "rateLimitPolicy">;
}

export {
  IHeliconeMeta,
  IHeliconeProxyClientOptions,
  IHeliconeAsyncClientOptions,
  OnHeliconeLog,
  OnHeliconeFeedback,
  OnPromptLog,
};
