import { RouterType, Route } from "itty-router";
import { Env } from "..";
import { RequestWrapper } from "../lib/RequestWrapper";

enum Provider {
  ANTHROPIC = "ANTHROPIC",
  OPENAI = "OPENAI",
}

export async function getRouter(
  requestWrapper: RequestWrapper,
  env: Env
): Promise<RouterType<Route, [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]>> {
  const urlString = requestWrapper.url?.href;

  // Check if URL contains the provider domain
  if (urlString?.includes("anthropic.hconeai.com")) {
    return (await import("./anthropicRouter")).default;
  } else if (urlString?.includes("oai.hconeai.com")) {
    return (await import("./oaiRouter")).default;
  }

  // Check the PROVIDER environment variable if URL does not contain the provider domain
  if (env.PROVIDER === Provider.ANTHROPIC) {
    return (await import("./anthropicRouter")).default;
  }

  // Default to OpenAI if no provider or url specifies
  return (await import("./oaiRouter")).default;
}
