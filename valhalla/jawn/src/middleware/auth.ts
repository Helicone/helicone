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
  authParams?: AuthParams
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
  req: Request
): Promise<Result<AuthParams, string>> => {
  const request = new RequestWrapper(req);
  const authorization = request.authHeader();

  if (authorization.error) {
    return err(authorization.error);
  }

  return await getHeliconeAuthClient().authenticate(
    authorization.data!,
    req.headers
  );
};

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Public routes — explicitly whitelisted to prevent accidental exposure
  const PUBLIC_ROUTE_PREFIXES = [
    "/v1/public/model-registry",
    "/v1/public/stats",
    "/v1/public/security",
    "/v1/public/alert-banner",
    "/v1/public/status/provider",
    "/v1/public/pi",
    "/v1/public/compare",
    "/v1/public/waitlist",
  ];
  if (PUBLIC_ROUTE_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
    next();
    return;
  }
  if (req.path === "/v1/models" && req.method === "GET") {
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

    const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(
      req.method
    );
    const requiredPermission = isWriteMethod ? "w" : "r";
    // The /v1/log/request endpoint uses write permission "w" for logging
    const isLogEndpoint = req.path === "/v1/log/request";

    if (
      authParams.error ||
      !authParams.data?.organizationId ||
      (authParams.data.keyPermissions &&
        !authParams.data?.keyPermissions?.includes(requiredPermission) &&
        !(isLogEndpoint && authParams.data?.keyPermissions?.includes("w")))
    ) {
      res.status(401).json({
        error: authParams.error,
        trace: "isAuthenticated.error",
      });
      return;
    }

    // Record how the caller authenticated so downstream authorization checks
    // (e.g. platform-admin routes) can require a real user session rather than
    // an API key. API keys carry a stored user_id, but that does not prove the
    // caller is that user.
    authParams.data.authType = authorization.data?._type;
    (req as any).authParams = authParams.data;

    // const onFinish = logHttpRequestInClickhouse(
    //   {
    //     method: `${req.method}`,
    //     url: `${req.originalUrl}`,
    //     userAgent: `${req.headers["user-agent"] ?? ""}`,
    //   },
    //   {
    //     status: res.statusCode,
    //   },
    //   authParams.data
    // );

    // res.on("finish", onFinish);

    // Express routing is case-insensitive by default, so "/V1/ADMIN/..." reaches
    // the same controllers as "/v1/admin/...". Normalize before comparing so the
    // admin gate cannot be skipped by changing the path casing.
    const normalizedPath = req.path.toLowerCase();
    if (
      normalizedPath.startsWith("/v1/admin") &&
      normalizedPath !== "/v1/admin/has-feature-flag"
    ) {
      if (authorization.data?._type !== "jwt") {
        res.status(401).json({
          error: "Unauthorized",
        });
        return;
      }
      await authCheckThrow(authParams.data);
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
