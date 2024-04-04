import { NextFunction, Request, Response } from "express";
import { RequestWrapper } from "../lib/requestWrapper";
import { supabaseServer } from "../lib/routers/withAuth";
import { Ratelimit } from "@upstash/ratelimit";
import { redisClient } from "../lib/clients/redisClient";
import { postHogClient } from "../lib/clients/postHogClient";

async function checkRateLimit(orgId: string) {
  if (redisClient) {
    const ratelimit = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(200, "60 s"),
    });

    return ratelimit.limit(orgId);
  } else {
    return undefined;
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const request = new RequestWrapper(req);
    const authorization = request.authHeader();
    if (authorization.error) {
      res.status(401).json({
        error: authorization.error,
      });
      return;
    }
    const authParams = await supabaseServer.authenticate(authorization.data!);
    if (authParams.error || !authParams.data?.organizationId) {
      console.error("authParams.error", authParams.error);
      const SUPABASE_CREDS = JSON.parse(process.env.SUPABASE_CREDS ?? "{}");
      const supabaseURL = SUPABASE_CREDS?.url ?? process.env.SUPABASE_URL;
      const pingUrl = `${supabaseURL}`;

      res.status(401).json({
        error: authParams.error,
        trace: "isAuthenticated.error",
        authorizationString: authorization,
        supabaseURL: supabaseURL,
        pingUrl,
      });
      return;
    }

    const rateLimit = await checkRateLimit(authParams.data?.organizationId);
    if (rateLimit && !rateLimit.success) {
      console.log("Rate limit exceeded", authParams.data?.organizationId);
      postHogClient?.capture({
        distinctId: "jawn-server",
        event: "rate-limited",
        properties: {
          orgId: authParams.data?.organizationId,
          wasRateLimited: rateLimit.success,
          url: req.url,
          method: req.method,
          body: req.body,
        },
      });

      res.status(429).json({
        error: "Rate limit exceeded",
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset,
      });
      return;
    }

    (req as any).authParams = authParams.data;
    next();
  } catch (error) {
    res.status(400).send("Invalid token.");
  }
};
