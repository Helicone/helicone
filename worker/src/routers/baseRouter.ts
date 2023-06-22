import { Env } from "..";
import { handleFeedbackEndpoint } from "../feedback";
import { RequestWrapper } from "../lib/RequestWrapper";
import { handleLoggingEndpoint } from "../properties";
import { Router, IRequest } from "itty-router";
import { getRouter } from "./routerFactory";

const baseRouter = Router<IRequest, [requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext]>();

baseRouter.post("/v1/log", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
  return await handleLoggingEndpoint(requestWrapper, env);
});

baseRouter.post("/v1/feedback", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
  return await handleFeedbackEndpoint(requestWrapper, env);
});

baseRouter.all("*", async (_, requestWrapper: RequestWrapper, env: Env, ctx: ExecutionContext) => {
  getRouter(requestWrapper, env).then((router) => {
    router.handle;
  });
});

export default baseRouter;
