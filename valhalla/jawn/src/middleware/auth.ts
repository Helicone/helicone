import { NextFunction, Request, Response } from "express";
import { authCheckThrow } from "../controllers/private/adminController";
import { newPostHogClient } from "../lib/clients/postHogClient";
import { AuthParams } from "../lib/db/supabase";
import { RequestWrapper } from "../lib/requestWrapper";
import { supabaseServer } from "../lib/routers/withAuth";
import { uuid } from "uuidv4";

export const logInPostHog = (
  reqParams: {
    method: string;
    url: string;
    userAgent: string;
  },
  resParams: {
    status: number;
  },
  authParams?: AuthParams
) => {
  const start = Date.now();
  const postHogClient = newPostHogClient();
  postHogClient?.capture({
    distinctId: authParams?.organizationId ?? "unknown",
    event: "jawn_http_request",
  });

  const onFinish = async () => {
    const duration = Date.now() - start;

    try {
      postHogClient?.capture({
        distinctId: authParams?.organizationId ?? "unknown",
        event: "jawn_http_request",
        properties: {
          method: reqParams.method,
          url: reqParams.url,
          status: resParams.status,
          duration: duration,
          userAgent: reqParams.userAgent,
        },
      });
    } catch (error) {
      console.error("Failed to capture request in PostHog:", error);
    }
  };

  return onFinish;
};

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.path.startsWith("/v1/public")) {
    next();
    return;
  }

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

    if (
      authParams.error ||
      !authParams.data?.organizationId ||
      (authParams.data.keyPermissions &&
        !authParams.data?.keyPermissions?.includes("r") &&
        req.path !== "/v1/log/request") // For local testing
    ) {
      res.status(401).json({
        error: authParams.error,
        trace: "isAuthenticated.error",
      });
      return;
    }

    (req as any).authParams = authParams.data;

    const onFinish = logInPostHog(
      {
        method: `${req.method}`,
        url: `${req.originalUrl}`,
        userAgent: `${req.headers["user-agent"] ?? ""}`,
      },
      {
        status: res.statusCode,
      },
      authParams.data
    );

    res.on("finish", onFinish);

    if (req.path.startsWith("/admin")) {
      await authCheckThrow(authParams.data.userId);
    }
    next();
  } catch (error) {
    res.status(400).send("Invalid token.");
  }
};
