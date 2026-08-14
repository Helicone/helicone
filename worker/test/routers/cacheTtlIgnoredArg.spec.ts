import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

// File audited in https://github.com/Helicone/helicone/issues/5775.
// Both `getFromKVCacheOnly` and `getAndStoreInCache` had a hardcoded
// `expirationTtl: 60` on the get path that silently overrode the
// caller's argument. The fix passes the outer `expirationTtl`
// parameter through to the inner `getFromCache` call.
const TARGET = "worker/src/lib/util/cache/secureCache.ts";

describe("secureCache TTL-argument regression (worker)", () => {
  const src = readFileSync(
    join(import.meta.dirname, "..", "..", "..", TARGET),
    "utf8"
  );

  it("getFromKVCacheOnly no longer hardcodes expirationTtl: 60", () => {
    // Locate the function body. We use a window from the `export
    // async function getFromKVCacheOnly` opener to the next closing
    // brace at the same indent (the function body is small enough that
    // a 400-char window covers it).
    const opener = src.indexOf("export async function getFromKVCacheOnly");
    expect(opener, "getFromKVCacheOnly opener not found").toBeGreaterThanOrEqual(
      0
    );
    const window = src.slice(opener, opener + 500);
    expect(
      window,
      "getFromKVCacheOnly still has hardcoded `expirationTtl: 60`"
    ).not.toMatch(/expirationTtl:\s*60/);
    // The inner getFromCache call must reference the outer parameter.
    // We look for the shorthand `expirationTtl,` (the inner call uses
    // object-property shorthand for `expirationTtl: expirationTtl`).
    // The parameter declaration `expirationTtl?:` has a `?` and `:` so
    // it doesn't match.
    expect(
      window,
      "getFromKVCacheOnly does not pass `expirationTtl` to getFromCache"
    ).toMatch(/expirationTtl,/);
  });

  it("getAndStoreInCache no longer hardcodes expirationTtl: 60 on the get path", () => {
    const opener = src.indexOf("export async function getAndStoreInCache");
    expect(opener, "getAndStoreInCache opener not found").toBeGreaterThanOrEqual(
      0
    );
    // Window covers the get-path block (the getFromCache call is the
    // first ~10 lines of the function). The store path is much later
    // and may legitimately set its own TTL.
    const window = src.slice(opener, opener + 600);
    expect(
      window,
      "getAndStoreInCache get-path still has hardcoded `expirationTtl: 60`"
    ).not.toMatch(/expirationTtl:\s*60/);
    // The inner getFromCache call must reference the outer parameter
    // (just the parameter name, not a hardcoded value).
    expect(
      window,
      "getAndStoreInCache get-path does not pass `expirationTtl` to getFromCache"
    ).toMatch(/expirationTtl,/);
  });

  it("getAndStoreInCache store path still passes expirationTtl (regression guard for the symmetric store path)", () => {
    // The store path was already correct before the fix. We assert
    // that the fix didn't accidentally break the store-side forwarding
    // while patching the get path. The store calls live in the second
    // half of the function (after the `if (cached !== null) { ... }`
    // block), so a 2000-char window covers both store calls.
    const opener = src.indexOf("export async function getAndStoreInCache");
    expect(opener, "getAndStoreInCache opener not found").toBeGreaterThanOrEqual(
      0
    );
    const window = src.slice(opener, opener + 2000);
    // The store path passes `expirationTtl` (without a hardcoded value)
    // as the 4th arg to storeInCache. Look for `storeInCache(\n...key...,
    // ...env,\n      expirationTtl,\n      useMemoryCache` shape or
    // similar — the literal `expirationTtl,` token followed by
    // `useMemoryCache` (the next arg) is the simplest check.
    const storeCalls = window.match(/storeInCache\(/g) || [];
    expect(
      storeCalls.length,
      "expected at least 2 storeInCache calls in getAndStoreInCache"
    ).toBeGreaterThanOrEqual(2);
    // The store-path forwarding is preserved if the function body
    // contains the parameter name `expirationTtl,` followed by
    // `useMemoryCache` (or similar non-hardcoded value).
    expect(
      window,
      "storeInCache call no longer receives the expirationTtl argument"
    ).toMatch(/expirationTtl,\s*\n\s*useMemoryCache/);
  });
});
