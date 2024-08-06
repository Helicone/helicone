import { NextFunction, Request, Response } from "express";
import { RequestWrapper } from "../lib/requestWrapper";
import { supabaseServer } from "../lib/routers/withAuth";
import { authCheckThrow } from "../controllers/private/adminController";
import { newPostHogClient } from "../lib/clients/postHogClient";
import { uuid } from "uuidv4";
import { AuthParams } from "../lib/db/supabase";

export const logInPostHog = (
  req: Request,
  res: Response,
  authParams?: AuthParams
) => {
  const start = Date.now();
  const postHogClient = newPostHogClient();
  postHogClient?.capture({
    distinctId: uuid(),
    event: "jawn_http_request",
  });

  if (authParams?.userId && postHogClient) {
    try {
      postHogClient.identify({
        distinctId: authParams?.userId,
      });
    } catch (error) {
      console.error("Error identifying user in PostHog:", error);
    }
  }

  if (authParams?.organizationId && postHogClient) {
    try {
      postHogClient.groupIdentify({
        groupType: "organization",
        groupKey: authParams.organizationId,
      });
    } catch (error) {
      console.error("Error identifying organization in PostHog:", error);
    }
  }

  const captureRequest = async () => {
    const duration = Date.now() - start;

    try {
      postHogClient?.capture({
        distinctId: uuid(),
        event: "jawn_http_request",
        properties: {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: duration,
          userAgent: req.headers["user-agent"],
        },
      });
    } catch (error) {
      console.error("Failed to capture request in PostHog:", error);
    }
  };

  res.on("finish", captureRequest);
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
    logInPostHog(req, res, authParams.data);

    if (req.path.startsWith("/admin")) {
      await authCheckThrow(authParams.data.userId);
    }
    next();
  } catch (error) {
    res.status(400).send("Invalid token.");
  }
};
