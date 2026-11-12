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

/**
 * Routes a Helicone proxy key (sk-/pk-helicone-proxy-...) may call. Proxy keys
 * exist to let a client call an LLM provider through the Helicone proxy; they
 * are not Helicone API credentials. The only Jawn route they may reach is the
 * worker's HTTP log fallback, which additionally requires the server-held
 * manual access key (see LogController).
 */
export const PROXY_KEY_ALLOWED_ROUTES: ReadonlyArray<{
  method: string;
  path: string;
}> = [{ method: "POST", path: "/v1/log/request" }];

function normalizePath(path: string): string {
  // Express routing is case-insensitive and tolerates a trailing slash, so
  // compare the same way it routes.
  const lower = path.toLowerCase();
  return lower.length > 1 && lower.endsWith("/") ? lower.slice(0, -1) : lower;
}

export type CredentialCheck =
  | { allowed: true }
  | { allowed: false; status: 401 | 403; error: string };

/**
 * Decides whether a verified credential may call `method path` at all.
 * Route-specific authorization (roles, org binding) happens in controllers.
 */
export function checkCredentialAccess(
  auth: AuthParams,
  method: string,
  path: string
): CredentialCheck {
  if (!auth.organizationId) {
    return { allowed: false, status: 401, error: "No organization" };
  }

  switch (auth.authType) {
    case "jwt":
      return { allowed: true };

    case "bearerProxy": {
      const normalized = normalizePath(path);
      const allowed = PROXY_KEY_ALLOWED_ROUTES.some(
        (route) =>
          route.method === method.toUpperCase() &&
          normalizePath(route.path) === normalized
      );
      if (!allowed) {
        return {
          allowed: false,
          status: 403,
          error: "Proxy keys cannot be used to call the Helicone API",
        };
      }
      return { allowed: true };
    }

    case "bearer": {
      // A Helicone API key must carry explicit permissions. Missing
      // permissions are denied, never treated as "no restriction".
      if (!auth.keyPermissions) {
        return {
          allowed: false,
          status: 401,
          error: "API key has no permissions",
        };
      }
      const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(
        method.toUpperCase()
      );
      const requiredPermission = isWriteMethod ? "w" : "r";
      if (!auth.keyPermissions.includes(requiredPermission)) {
        return {
          allowed: false,
          status: 401,
          error: `API key lacks "${requiredPermission}" permission`,
        };
      }
      return { allowed: true };
    }

    default:
      return { allowed: false, status: 401, error: "Unverified credential" };
  }
}

export type AuthAuditEntry = {
  event: "jawn_auth_audit";
  authType: string | null;
  heliconeApiKeyId: number | null;
  userId: string | null;
  orgId: string | null;
  method: string;
  path: string;
  status: number;
  denyReason?: string;
};

/**
 * Builds the per-request audit line. Only identifiers are recorded: never
 * tokens, headers, query strings or bodies.
 */
export function buildAuthAuditEntry(params: {
  authParams?: AuthParams;
  method: string;
  path: string;
  status: number;
  denyReason?: string;
}): AuthAuditEntry {
  const entry: AuthAuditEntry = {
    event: "jawn_auth_audit",
    authType: params.authParams?.authType ?? null,
    heliconeApiKeyId: params.authParams?.heliconeApiKeyId ?? null,
    userId: params.authParams?.userId || null,
    orgId: params.authParams?.organizationId || null,
    method: params.method,
    // Path only: query strings can carry user data.
    path: params.path.split("?")[0],
    status: params.status,
  };
  if (params.denyReason) {
    entry.denyReason = params.denyReason;
  }
  return entry;
}

// High-volume ingestion routes authenticated by API key. Successful calls are
// not audited (they would dominate log volume); denials still are.
const AUDIT_SKIP_SUCCESS_PREFIXES = ["/v1/log/", "/v1/trace/"];

export function shouldAuditRequest(path: string, status: number): boolean {
  if (status >= 400) {
    return true;
  }
  const lowerPath = path.toLowerCase();
  return !AUDIT_SKIP_SUCCESS_PREFIXES.some((p) => lowerPath.startsWith(p));
}

type AuditState = { authParams?: AuthParams; denyReason?: string };

function attachAuthAudit(req: Request, res: Response, state: AuditState) {
  const path = `${req.baseUrl ?? ""}${req.path}`;
  res.on("finish", () => {
    try {
      const status = res.statusCode;
      if (!shouldAuditRequest(path, status)) {
        return;
      }
      // One JSON line per request on stdout, for whatever log pipeline collects it.
      console.log(
        JSON.stringify(
          buildAuthAuditEntry({
            authParams: state.authParams,
            method: req.method,
            path,
            status,
            denyReason: state.denyReason,
          })
        )
      );
    } catch {
      // Auditing must never break a request.
    }
  });
}

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

  const auditState: AuditState = {};
  attachAuthAudit(req, res, auditState);

  try {
    const authParams = await authFromRequest(req);

    if (authParams.error || !authParams.data) {
      auditState.denyReason = "authentication_failed";
      res.status(401).json({
        error: authParams.error,
        trace: "isAuthenticated.error",
      });
      return;
    }

    // authType is set by the authenticator from the credential it verified.
    // The header-declared `_type` is never used for authorization.
    auditState.authParams = authParams.data;
    const access = checkCredentialAccess(
      authParams.data,
      req.method,
      req.path
    );
    if (!access.allowed) {
      auditState.denyReason = access.error;
      res.status(access.status).json({
        error: access.error,
        trace: "isAuthenticated.error",
      });
      return;
    }

    (req as any).authParams = authParams.data;

    // Express routing is case-insensitive by default, so "/V1/ADMIN/..." reaches
    // the same controllers as "/v1/admin/...". Normalize before comparing so the
    // admin gate cannot be skipped by changing the path casing.
    const normalizedPath = normalizePath(req.path);
    if (
      normalizedPath.startsWith("/v1/admin") &&
      normalizedPath !== "/v1/admin/has-feature-flag"
    ) {
      if (authParams.data.authType !== "jwt") {
        auditState.denyReason = "admin_requires_jwt";
        res.status(401).json({
          error: "Unauthorized",
        });
        return;
      }
      await authCheckThrow(authParams.data);
    }
    next();
  } catch (error) {
    auditState.denyReason = auditState.denyReason ?? "auth_exception";
    res.status(400).send("Invalid token.");
  }
};
export interface HeliconeUser {
  email: string;
  id: string;
}
