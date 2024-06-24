import { NextFunction, Request, Response } from "express";
import { RequestWrapper } from "../lib/requestWrapper";
import { supabaseServer } from "../lib/routers/withAuth";
import { authCheckThrow } from "../controllers/private/adminController";
import { postHogClient } from "../lib/clients/postHogClient";

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

    if (authParams.data?.userId && postHogClient) {
      try {
        postHogClient.identify({
          distinctId: authParams.data.userId,
        });
      } catch (error) {
        console.error("Error identifying user in PostHog:", error);
      }
    }

    if (authParams.data?.organizationId && postHogClient) {
      try {
        postHogClient.groupIdentify({
          groupType: "organization",
          groupKey: authParams.data.organizationId,
        });
      } catch (error) {
        console.error("Error identifying organization in PostHog:", error);
      }
    }

    if (req.path.startsWith("/admin")) {
      await authCheckThrow(authParams.data.userId);
    }
    next();
  } catch (error) {
    res.status(400).send("Invalid token.");
  }
};
