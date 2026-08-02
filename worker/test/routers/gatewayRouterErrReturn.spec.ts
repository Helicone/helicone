import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

// File audited in https://github.com/Helicone/helicone/issues/5757.
// Every err(...) call inside getProvider must be preceded by `return`,
// otherwise the constructed Result is discarded and the guard does nothing.
const TARGET = "worker/src/routers/gatewayRouter.ts";

describe("gatewayRouter err-return regression (worker)", () => {
  it(`every err(...) call in getProvider (${TARGET}) is preceded by \`return\``, () => {
    const text = readFileSync(
      join(import.meta.dirname, "..", "..", "..", TARGET),
      "utf8"
    );

    // Locate the getProvider function body. `function getProviderFromTargetUrl`
    // is the next top-level declaration after getProvider; using `function ` as
    // the boundary keeps the slice to exactly the function under test.
    const startMatch = text.match(/async function getProvider\(/);
    if (!startMatch || startMatch.index === undefined) {
      throw new Error(`Could not find getProvider in ${TARGET}`);
    }
    const bodyStart = startMatch.index;
    const tail = text.slice(bodyStart);
    const endMatch = tail.match(/\n(?=function |export )/);
    const bodyEnd = endMatch ? bodyStart + endMatch.index : text.length;
    const body = text.slice(bodyStart, bodyEnd);

    // Strip block + line comments so a comment that mentions `err(...)` is not
    // mistaken for a real call site.
    const stripped = body
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

    const offenders: number[] = [];
    stripped.split("\n").forEach((line, i) => {
      if (/\berr\s*\(/.test(line) && !/^\s*return\s+err\s*\(/.test(line)) {
        offenders.push(i + 1);
      }
    });

    if (offenders.length > 0) {
      throw new Error(
        `err(...) calls in getProvider without a leading \`return\` at ` +
          `line(s) ${offenders.join(", ")} relative to the function start. ` +
          `Calling err() without \`return\` discards the Result — see #5757.`
      );
    }
    expect(offenders).toHaveLength(0);
  });
});
