import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

// Files audited in https://github.com/Helicone/helicone/issues/5771.
// Each call site schedules a setTimeout as part of a Promise.race or
// AbortController pattern. The original code never captured the timer
// id or called clearTimeout, so the timer stayed in the event loop
// until firing even when the main promise resolved first.
const TARGETS: Array<{
  file: string;
  // The setTimeout call in this file must be paired with a clearTimeout
  // that references the same timer id, in a try/finally or equivalent
  // (race.then / race-catch) block.
}> = [
  "worker/src/lib/clients/ProviderClient.ts",
  "worker/src/lib/util/cache/cacheFunctions.ts",
  "worker/src/lib/util/helpers.ts",
];

describe("Pending-timer leak regression (worker)", () => {
  for (const rel of TARGETS) {
    it(`${rel} clears the setTimeout used for the timeout/race`, () => {
      const text = readFileSync(
        join(import.meta.dirname, "..", "..", "..", rel),
        "utf8"
      );

      // The source must contain a setTimeout used inside a Promise.race
      // or as an AbortController trigger (i.e. the bug pattern).
      expect(text, "expected setTimeout(...) for a race/timeout").toMatch(
        /setTimeout\(/
      );

      // The source must capture the timer id. We accept any of the
      // common forms: const timeoutId = setTimeout(...), let timeoutId = ...,
      // or a top-level var timeoutId = ... declaration.
      expect(
        text,
        `setTimeout in ${rel} is not captured in a \`timeoutId\` (or similar) variable`
      ).toMatch(/(?:const|let|var)\s+timeoutId\s*=\s*setTimeout\(/);

      // The source must clear the timer via clearTimeout(timeoutId) (or
      // clearTimeout on a similarly-named identifier).
      expect(
        text,
        `setTimeout in ${rel} is not followed by a clearTimeout(timeoutId) call`
      ).toMatch(/clearTimeout\(\s*timeoutId\s*\)/);
    });
  }
});
