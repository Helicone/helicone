/**
 * Regression tests for https://github.com/helicone/helicone/issues/5757.
 *
 * `getProvider` in worker/src/routers/gatewayRouter.ts builds its error
 * Results via `err(...)`, which is a pure constructor. Every `err(...)` call
 * in the function body must be returned: a bare `err(...)` statement discards
 * the Result and the guard silently falls through to the happy path. That is
 * how the invalid-target-url 400s became 500s (via a `new URL()` throw), the
 * path-mismatch 400 was skipped, and the unapproved-domain 429 rate limit
 * was bypassed entirely.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ROUTER_PATH = new URL(
  "../../src/routers/gatewayRouter.ts",
  import.meta.url
).pathname;

function getProviderBody(source: string): string {
  const start = source.indexOf("getProvider(");
  const end = source.indexOf("export const gatewayForwarder");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("could not locate getProvider body in gatewayRouter.ts");
  }
  return source.slice(start, end);
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("getProvider error guards return their Results", () => {
  it("every err(...) call in getProvider is returned", () => {
    const source = readFileSync(ROUTER_PATH, "utf8");
    const body = stripComments(getProviderBody(source));

    const matches = [...body.matchAll(/(^|[^\w$])err\s*\(/g)];
    expect(matches.length).toBeGreaterThan(0);

    const bare = matches.filter((m) => {
      const before = body.slice(0, m.index).trimEnd();
      return !/return\s*$/.test(before);
    });
    expect(
      bare.map((m) =>
        body.slice(Math.max(0, (m.index ?? 0) - 60), (m.index ?? 0) + 10)
      ),
      "bare err(...) statements without return"
    ).toEqual([]);
  });
});
