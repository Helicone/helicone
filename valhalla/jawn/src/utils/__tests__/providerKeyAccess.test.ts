import { describe, expect, it } from "@jest/globals";
import { AuthParams } from "../../packages/common/auth/types";
import { isJwtOrgAdmin, maskProviderSecret } from "../providerKeyAccess";

const base: AuthParams = { organizationId: "org-1", userId: "user-1" };

describe("isJwtOrgAdmin", () => {
  it("allows JWT owners and admins", () => {
    expect(isJwtOrgAdmin({ ...base, authType: "jwt", role: "owner" })).toBe(
      true
    );
    expect(isJwtOrgAdmin({ ...base, authType: "jwt", role: "admin" })).toBe(
      true
    );
  });

  it("rejects JWT members and missing roles", () => {
    expect(isJwtOrgAdmin({ ...base, authType: "jwt", role: "member" })).toBe(
      false
    );
    expect(isJwtOrgAdmin({ ...base, authType: "jwt" })).toBe(false);
  });

  it("rejects Helicone API keys and proxy keys regardless of role", () => {
    expect(
      isJwtOrgAdmin({
        ...base,
        authType: "bearer",
        keyPermissions: "rw",
      })
    ).toBe(false);
    // Even if a role were ever attached to a non-JWT caller, it must not count.
    expect(isJwtOrgAdmin({ ...base, authType: "bearer", role: "owner" })).toBe(
      false
    );
    expect(
      isJwtOrgAdmin({ ...base, authType: "bearerProxy", role: "admin" })
    ).toBe(false);
    expect(isJwtOrgAdmin({ ...base, role: "owner" })).toBe(false);
    expect(isJwtOrgAdmin(undefined)).toBe(false);
  });
});

describe("maskProviderSecret", () => {
  it("returns null for empty values", () => {
    expect(maskProviderSecret(null)).toBeNull();
    expect(maskProviderSecret(undefined)).toBeNull();
    expect(maskProviderSecret("")).toBeNull();
  });

  it("keeps a short prefix and the last 4 chars of long keys", () => {
    const key = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789-WXYZ";
    const masked = maskProviderSecret(key)!;
    expect(masked.startsWith("sk-ant")).toBe(true);
    expect(masked.endsWith("WXYZ")).toBe(true);
    expect(masked).not.toContain("abcdefghij");
    expect(masked.length).toBeLessThan(key.length);
  });

  it("keeps only the last 4 chars of medium keys", () => {
    const masked = maskProviderSecret("abcdefghijklmnop")!;
    expect(masked.endsWith("mnop")).toBe(true);
    expect(masked).not.toContain("abcd");
  });

  it("fully masks short values", () => {
    const masked = maskProviderSecret("short")!;
    expect(masked).not.toContain("short");
    expect(masked).not.toMatch(/[a-z]/);
  });
});
