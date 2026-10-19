import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import { EventEmitter } from "events";

const mockAuthenticate = jest.fn();
const mockAuthCheckThrow = jest.fn();
jest.mock("../../packages/common/auth/server/AuthClientFactory", () => ({
  getHeliconeAuthClient: () => ({ authenticate: mockAuthenticate }),
}));
jest.mock("../../controllers/private/adminController", () => ({
  authCheckThrow: (...args: unknown[]) => mockAuthCheckThrow(...args),
}));
jest.mock("../../lib/db/ClickhouseWrapper", () => ({
  clickhouseDb: { dbInsertClickhouse: jest.fn() },
}));

import {
  authMiddleware,
  buildAuthAuditEntry,
  checkCredentialAccess,
  shouldAuditRequest,
} from "../auth";
import { AuthParams } from "../../packages/common/auth/types";

const ORG = "11111111-1111-1111-1111-111111111111";

describe("checkCredentialAccess", () => {
  test("JWT sessions pass the credential gate", () => {
    expect(
      checkCredentialAccess(
        { organizationId: ORG, authType: "jwt", userId: "u" },
        "POST",
        "/v1/organization/x/add_member"
      ).allowed
    ).toBe(true);
  });

  test("proxy keys are rejected on every Jawn route except the log fallback", () => {
    const proxy: AuthParams = { organizationId: ORG, authType: "bearerProxy" };
    for (const [method, path] of [
      ["GET", "/v1/api-keys"],
      ["POST", "/v1/organization/x/add_member"],
      ["POST", "/v1/request/query"],
      ["GET", "/v1/log/request"],
      ["POST", "/v1/log/requests"],
    ]) {
      const result = checkCredentialAccess(proxy, method, path);
      expect(result.allowed).toBe(false);
    }
    expect(checkCredentialAccess(proxy, "POST", "/v1/log/request").allowed).toBe(
      true
    );
    expect(checkCredentialAccess(proxy, "post", "/V1/LOG/REQUEST/").allowed).toBe(
      true
    );
  });

  test("API keys without permissions are denied, not skipped", () => {
    const result = checkCredentialAccess(
      { organizationId: ORG, authType: "bearer", userId: "u" },
      "GET",
      "/v1/request/query"
    );
    expect(result).toMatchObject({ allowed: false, status: 401 });
  });

  test("API key permissions are enforced by method", () => {
    const writeOnly: AuthParams = {
      organizationId: ORG,
      authType: "bearer",
      keyPermissions: "w",
    };
    expect(checkCredentialAccess(writeOnly, "GET", "/v1/x").allowed).toBe(false);
    expect(checkCredentialAccess(writeOnly, "POST", "/v1/x").allowed).toBe(true);
    const rw: AuthParams = { ...writeOnly, keyPermissions: "rw" };
    expect(checkCredentialAccess(rw, "GET", "/v1/x").allowed).toBe(true);
    expect(checkCredentialAccess(rw, "DELETE", "/v1/x").allowed).toBe(true);
  });

  test("credentials without a verified type are denied", () => {
    expect(
      checkCredentialAccess({ organizationId: ORG, userId: "u" }, "GET", "/v1/x")
        .allowed
    ).toBe(false);
    expect(
      checkCredentialAccess({ organizationId: "", authType: "jwt" }, "GET", "/v1/x")
        .allowed
    ).toBe(false);
  });
});

describe("audit entries", () => {
  test("record identifiers only", () => {
    const entry = buildAuthAuditEntry({
      authParams: {
        organizationId: ORG,
        userId: "user-1",
        heliconeApiKeyId: 42,
        authType: "bearer",
        keyPermissions: "rw",
      },
      method: "POST",
      path: "/v1/organization/x/add_member?token=secret",
      status: 403,
      denyReason: "x",
    });
    expect(entry).toEqual({
      event: "jawn_auth_audit",
      authType: "bearer",
      heliconeApiKeyId: 42,
      userId: "user-1",
      orgId: ORG,
      method: "POST",
      path: "/v1/organization/x/add_member",
      status: 403,
      denyReason: "x",
    });
  });

  test("high-volume ingestion successes are skipped, failures are kept", () => {
    expect(shouldAuditRequest("/v1/log/request", 200)).toBe(false);
    expect(shouldAuditRequest("/v1/trace/log", 200)).toBe(false);
    expect(shouldAuditRequest("/v1/log/request", 401)).toBe(true);
    expect(shouldAuditRequest("/v1/api-keys", 200)).toBe(true);
  });
});

function makeReqRes(params: {
  method: string;
  path: string;
  headers: Record<string, string>;
}) {
  const req: any = {
    method: params.method,
    path: params.path,
    baseUrl: "",
    headers: params.headers,
  };
  const res: any = new EventEmitter();
  res.statusCode = 200;
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn(() => {
    res.emit("finish");
    return res;
  });
  res.send = jest.fn(() => {
    res.emit("finish");
    return res;
  });
  return { req, res };
}

describe("authMiddleware", () => {
  let logSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("uses the verified credential type, not the header-declared one", async () => {
    // Caller claims to be a JWT session, but the authenticator verified an
    // API key.
    mockAuthenticate.mockResolvedValue({
      data: {
        organizationId: ORG,
        userId: "admin-user",
        authType: "bearer",
        keyPermissions: "rw",
      },
      error: null,
    } as never);
    const { req, res } = makeReqRes({
      method: "GET",
      path: "/v1/admin/orgs/query",
      headers: {
        "helicone-authorization": JSON.stringify({
          _type: "jwt",
          token: "not-really-a-jwt",
          orgId: ORG,
        }),
      },
    });
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(mockAuthCheckThrow).not.toHaveBeenCalled();
  });

  test("rejects proxy keys and writes an audit line without secrets", async () => {
    mockAuthenticate.mockResolvedValue({
      data: { organizationId: ORG, authType: "bearerProxy" },
      error: null,
    } as never);
    const token = "Bearer sk-helicone-proxy-abcdef-11111111-1111-1111-1111-111111111111";
    const { req, res } = makeReqRes({
      method: "POST",
      path: "/v1/organization/x/add_member",
      headers: { authorization: token },
    });
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    const lines = logSpy.mock.calls.map((c) => String(c[0]));
    const audit = lines.find((l) => l.includes("jawn_auth_audit"));
    expect(audit).toBeDefined();
    expect(audit).not.toContain("sk-helicone-proxy");
    expect(JSON.parse(audit!)).toMatchObject({
      authType: "bearerProxy",
      orgId: ORG,
      method: "POST",
      path: "/v1/organization/x/add_member",
      status: 403,
    });
  });

  test("passes a permitted API key through with its verified type", async () => {
    mockAuthenticate.mockResolvedValue({
      data: {
        organizationId: ORG,
        userId: "u",
        authType: "bearer",
        keyPermissions: "rw",
        heliconeApiKeyId: 7,
      },
      error: null,
    } as never);
    const { req, res } = makeReqRes({
      method: "GET",
      path: "/v1/request/query",
      headers: { authorization: "Bearer sk-helicone-xyz" },
    });
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.authParams.authType).toBe("bearer");
  });
});
