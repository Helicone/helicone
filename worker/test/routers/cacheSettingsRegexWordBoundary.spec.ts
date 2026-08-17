import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

// File audited in https://github.com/Helicone/helicone/issues/5780.
// The regex patterns for s-maxage and max-age in buildCacheControl had
// no word boundary, so vendor extensions like `x-s-maxage=3600` were
// matched as `s-maxage=3600`. The fix adds a non-capturing separator
// group `(?:^|[\s,;])` before the directive name.
const TARGET = "worker/src/lib/util/cache/cacheSettings.ts";

describe("cacheSettings regex word-boundary regression (worker)", () => {
  const src = readFileSync(
    join(import.meta.dirname, "..", "..", "..", TARGET),
    "utf8"
  );

  it("s-maxage regex has a separator/anchor before the directive name", () => {
    // The unanchored form `/s-maxage=(\d+)/` matches anywhere in the
    // input (including in `x-s-maxage=3600`). The anchored form is
    // `/(?:^|[\s,;])s-maxage=(\d+)/` — the substring
    // "(?:^|[\\s,;])s-maxage=" must appear in the source.
    expect(
      src,
      "s-maxage regex has no separator/anchor — `x-s-maxage` would be misidentified as `s-maxage`"
    ).toContain("(?:^|[\\s,;])s-maxage=");
  });

  it("max-age regex has a separator/anchor before the directive name", () => {
    expect(
      src,
      "max-age regex has no separator/anchor — `x-max-age` would be misidentified as `max-age`"
    ).toContain("(?:^|[\\s,;])max-age=");
  });

  it("the `(\\d+)` capture group is preserved (not preceded by a separator capture)", () => {
    // The fix uses a non-capturing group `(?:^|[\\s,;])` for the
    // separator, so the capture group is still `(\\d+)` — the seconds
    // value. We assert the literal substring `=(\\d+)` appears in both
    // regexes (i.e. the capture group is directly after the `=`).
    expect(
      src,
      "s-maxage capture group is missing or not capturing digits"
    ).toContain("s-maxage=(\\d+)");
    expect(
      src,
      "max-age capture group is missing or not capturing digits"
    ).toContain("max-age=(\\d+)");
  });

  it("the old unanchored `/s-maxage=(\\d+)/` and `/max-age=(\\d+)/` patterns are gone", () => {
    // The full literal regex literals: `/s-maxage=(\d+)/` and
    // `/max-age=(\d+)/`. After the fix, both are inside
    // `/(?:^|[\s,;]).../`, so these exact substrings should NOT
    // appear in the source.
    expect(
      src,
      "old unanchored `/s-maxage=(\\d+)/` pattern still in source"
    ).not.toContain("/s-maxage=(\\d+)/");
    expect(
      src,
      "old unanchored `/max-age=(\\d+)/` pattern still in source"
    ).not.toContain("/max-age=(\\d+)/");
  });
});
