import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const MAPPINGS_PATH = resolve(
  __dirname,
  "../../../packages/cost/providers/mappings.ts"
);

const VAPI_ROUTER_PATH = resolve(
  __dirname,
  "../../src/routers/vapiProxyRouter.ts"
);

function readMappingsSource(): string {
  return readFileSync(MAPPINGS_PATH, "utf-8");
}

function readVapiRouterSource(): string {
  return readFileSync(VAPI_ROUTER_PATH, "utf-8");
}

describe("VAPI ProviderName union coverage", () => {
  it("adds 'VAPI' to the providersNames array", () => {
    const source = readMappingsSource();
    expect(source).toMatch(/["']VAPI["']/);
  });

  it("keeps the providersNames array shaped as a const tuple", () => {
    const source = readMappingsSource();
    expect(source).toMatch(
      /export\s+const\s+providersNames\s*=\s*\[[\s\S]*\]\s+as\s+const/
    );
  });
});

describe("vapiProxyRouter no longer uses `as any` on the provider", () => {
  it("calls proxyForwarder with 'VAPI' directly (no `as any` cast)", () => {
    const source = readVapiRouterSource();
    expect(source).not.toMatch(
      /proxyForwarder\([^)]*["']VAPI["']\s+as\s+any/
    );
  });

  it("still passes 'VAPI' to proxyForwarder", () => {
    const source = readVapiRouterSource();
    expect(source).toMatch(
      /proxyForwarder\([^)]*["']VAPI["']\s*\)/
    );
  });

  it("still exports getVapiProxyRouter (positive control)", () => {
    const source = readVapiRouterSource();
    expect(source).toMatch(/export\s+const\s+getVapiProxyRouter\s*=/);
  });

  it("still registers the /helicone/test route (positive control)", () => {
    const source = readVapiRouterSource();
    expect(source).toMatch(/router\.get\(\s*["']\/helicone\/test["']/);
  });
});
