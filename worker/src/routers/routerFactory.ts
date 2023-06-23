import { RouterType, Route } from "itty-router";
import { Env, Provider } from "..";
import { RequestWrapper } from "../lib/RequestWrapper";

export async function getRouter(
  provider: Env["PROVIDER"]
): Promise<RouterType<Route, [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]>> {
  if (provider === Provider.ANTHROPIC) {
    return (await import("./anthropicRouter")).default;
  }

  if (provider === Provider.OPENAI) {
    return (await import("./oaiRouter")).default;
  }

  throw new Error("Provider not found");
}
