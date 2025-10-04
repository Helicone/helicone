import { NextFunction, Request, Response } from "express";
import { authCheckThrow } from "../controllers/private/adminController";
import { RequestWrapper } from "../lib/requestWrapper";
import { AuthParams } from "../packages/common/auth/types";
import { getHeliconeAuthClient } from "../packages/common/auth/server/AuthClientFactory";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { err, Result } from "../packages/common/result";

// Replace PostHog with ClickHouse logging
export const logHttpRequestInClickhouse = (
  reqParams: {
    method: string;
    url: string;
    userAgent: string;
  },
  resParams: {
    status: number;
  },
  authParams?: AuthParams,
): (() => void) => {
  const start = Date.now();

  const onFinish = () => {
    try {
      const duration = Date.now() - start;
      const organizationId =
        authParams?.organizationId ?? "00000000-0000-0000-0000-000000000000";

      clickhouseDb.dbInsertClickhouse("jawn_http_logs", [
        {
          organization_id: organizationId,
          method: reqParams.method,
          url: reqParams.url,
          status: resParams.status,
          duration: duration,
          user_agent: reqParams.userAgent,
          timestamp: new Date().toISOString(),

          properties: {},
        },
      ]);
    } catch (error) {
      console.error("Failed to log request in ClickHouse:", error);
    }
  };

  return onFinish;
};

export const authFromRequest = async (
  req: Request,
): Promise<Result<AuthParams, string>> => {
  const request = new RequestWrapper(req);
  const authorization = request.authHeader();

  if (authorization.error) {
    return err(authorization.error);
  }

  return await getHeliconeAuthClient().authenticate(
    authorization.data!,
    req.headers,
  );
};

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.path.startsWith("/v1/public")) {
    next();
    return;
  }
  if (req.path === "/v1/organization" && req.method === "GET") {
    next();
    return;
  }

  try {
    const request = new RequestWrapper(req);
    const authorization = request.authHeader();

    const authParams = await authFromRequest(req);

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

    const onFinish = logHttpRequestInClickhouse(
      {
        method: `${req.method}`,
        url: `${req.originalUrl}`,
        userAgent: `${req.headers["user-agent"] ?? ""}`,
      },
      {
        status: res.statusCode,
      },
      authParams.data,
    );

    res.on("finish", onFinish);

    if (
      req.path.startsWith("/v1/admin") &&
      req.path !== "/v1/admin/has-feature-flag"
    ) {
      if (authorization.data?._type !== "jwt") {
        res.status(401).json({
          error: "Unauthorized",
        });
        return;
      }
      await authCheckThrow(authParams.data.userId);
    }
    next();
  } catch (error) {
    res.status(400).send("Invalid token.");
  }
};
export interface HeliconeUser {
  email: string;
  id: string;
}
