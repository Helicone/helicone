import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROUTER_FACTORY_PATH = resolve(
  __dirname,
  "../../src/routers/routerFactory.ts"
);

function readRouterFactorySource(): string {
  return readFileSync(ROUTER_FACTORY_PATH, "utf-8");
}

describe("routerFactory VAPI_PROXY wiring", () => {
  it("imports getVapiProxyRouter from ./vapiProxyRouter", () => {
    const source = readRouterFactorySource();
    expect(source).toMatch(
      /import\s*\{\s*getVapiProxyRouter\s*\}\s*from\s*["']\.\/vapiProxyRouter["']/
    );
  });

  it("wires VAPI_PROXY to getVapiProxyRouter in WORKER_MAP", () => {
    const source = readRouterFactorySource();
    expect(source).toMatch(/VAPI_PROXY:\s*getVapiProxyRouter\s*,/);
  });

  it("does not leave the throwing placeholder in WORKER_MAP", () => {
    const source = readRouterFactorySource();
    expect(source).not.toMatch(
      /VAPI_PROXY:\s*\(\s*\)\s*=>\s*\{\s*throw\s+new\s+Error\(["']VAPI_PROXY not implemented["']\)/
    );
  });
});
