import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

// File audited in https://github.com/Helicone/helicone/issues/5768.
// The Helicone-Cache-Ignore-Keys header is documented as a comma-separated
// list of JSON keys. The original code wrapped the value in `[...]` and
// called JSON.parse, producing a single-element array whose value contained
// a comma — so the consumer's `delete json[key]` loop did nothing. The fix
// replaces the wrap-and-parse with split-by-comma + trim + filter-empty.
const TARGET = "worker/src/lib/models/HeliconeHeaders.ts";

describe("Helicone-Cache-Ignore-Keys parsing regression (worker)", () => {
  const src = readFileSync(
    join(import.meta.dirname, "..", "..", "..", TARGET),
    "utf8"
  );

  it("does not wrap the header value in `[...]` and call JSON.parse", () => {
    // The old shape was:
    //   cacheIgnoreKeys: this.headers.get("Helicone-Cache-Ignore-Keys")
    //     ? JSON.parse(`[${this.headers.get("Helicone-Cache-Ignore-Keys") ?? ""}]`)
    //     : null,
    // We assert the wrap-and-parse pattern is gone.
    expect(
      src,
      "old wrap-and-parse pattern still in source — see #5768"
    ).not.toMatch(/JSON\.parse\(\s*`\s*\[\$\{/);
    // Also assert the literal wrapping template `[${...}]` is gone.
    expect(
      src,
      "literal `[${...}]` template still in cacheIgnoreKeys expression"
    ).not.toMatch(/\[\$\{this\.headers\.get\("Helicone-Cache-Ignore-Keys"\)/);
  });

  it("splits the header value on commas", () => {
    // The new shape must call .split(",") on the raw value, within a
    // reasonable window of the header reference. We use a substring
    // window (rather than a strict regex) because the source has an IIFE
    // between the header read and the .split() call, and the regex
    // would have to span parentheses that belong to that IIFE.
    const headerIdx = src.indexOf('"Helicone-Cache-Ignore-Keys"');
    expect(headerIdx, "header reference not found").toBeGreaterThanOrEqual(0);
    const window = src.slice(headerIdx, headerIdx + 400);
    expect(
      window,
      "Helicone-Cache-Ignore-Keys is not split on commas"
    ).toContain('.split(",")');
  });

  it("trims whitespace and drops empty entries", () => {
    // After .split(",") the chain should .map(trim) and .filter(non-empty).
    // We accept the chain order (split → map → filter) and look for the
    // literal calls.
    expect(src, ".trim() not called on split entries").toMatch(/\.trim\(\)/);
    expect(src, "empty-entry filter not applied").toMatch(/\.filter\(/);
  });
});
