import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

// The four files audited in https://github.com/Helicone/helicone/issues/5755.
// Every parseInt(...) call in these files must pass 10 as the second argument.
// Sibling files (e.g. walletRouter.ts:178,180) have separate fixes and are
// intentionally not asserted here.
const TARGETS = [
  "worker/src/lib/util/cache/cacheFunctions.ts",
  "worker/src/lib/util/cache/cacheSettings.ts",
  "worker/src/lib/models/HeliconeHeaders.ts",
  "worker/src/routers/gatewayRouter.ts",
];

// Walk the file looking for `parseInt(` calls. For each one, count parens
// to find the matching close paren (handles multi-line calls and nested
// expressions like `headers.get(...)`). If the matched argument list does
// not contain any top-level comma, no radix was passed.
function findRadixlessParseIntCalls(
  text: string
): Array<{ start: number; end: number; inner: string }> {
  const out: Array<{ start: number; end: number; inner: string }> = [];
  const re = /parseInt\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const callStart = m.index + "parseInt(".length;
    let depth = 1;
    let i = callStart;
    while (i < text.length && depth > 0) {
      const ch = text[i];
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      i++;
    }
    if (depth !== 0) continue; // unmatched parseInt( — leave to tsc
    const callEnd = i - 1; // position of matching ')'
    const inner = text.slice(callStart, callEnd);
    if (!inner.includes(",")) {
      out.push({ start: m.index, end: i, inner: inner.trim() });
    }
  }
  return out;
}

describe("parseInt radix regression (worker)", () => {
  for (const rel of TARGETS) {
    it(`${rel} has no parseInt calls without a radix argument`, () => {
      const abs = join(import.meta.dirname, "..", "..", "..", rel);
      const text = readFileSync(abs, "utf8");
      const offenders = findRadixlessParseIntCalls(text);
      if (offenders.length > 0) {
        const snippets = offenders.map((o) => `parseInt(${o.inner})`).join(", ");
        throw new Error(
          `parseInt(...) calls without a radix argument in ${rel}: ` +
            `${snippets}. Every parseInt in the worker must pass 10 ` +
            `as the second argument (see issue #5755).`
        );
      }
      expect(offenders).toHaveLength(0);
    });
  }
});
