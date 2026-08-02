import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

// Files audited in https://github.com/Helicone/helicone/issues/5759.
// The fix converts `AttemptBuilder.buildAttempts` from
//   Promise<Attempt[]>
// to
//   Promise<Result<Attempt[], string>>
// and propagates the error to the caller in SimpleAIGateway so a typo
// in a model string produces a 400 with the parser's message instead
// of being silently dropped from the fallback list.
const ATTEMPT_BUILDER = "worker/src/lib/ai-gateway/AttemptBuilder.ts";
const SIMPLE_GATEWAY = "worker/src/lib/ai-gateway/SimpleAIGateway.ts";

describe("AttemptBuilder error propagation regression (worker)", () => {
  const builderSrc = readFileSync(
    join(import.meta.dirname, "..", "..", "..", ATTEMPT_BUILDER),
    "utf8"
  );
  const gatewaySrc = readFileSync(
    join(import.meta.dirname, "..", "..", "..", SIMPLE_GATEWAY),
    "utf8"
  );

  it("buildAttempts return type is Result<Attempt[], string> (not bare Attempt[])", () => {
    // The public buildAttempts signature must declare
    //   ): Promise<Result<Attempt[], string>> {
    // Use a literal substring check (avoiding regex on nested generics).
    // The string "Promise<Result<Attempt[], string>>" must appear
    // between the `async buildAttempts(` opener and the first closing `}`.
    const opener = builderSrc.indexOf("async buildAttempts(");
    expect(opener, "buildAttempts opener not found").toBeGreaterThanOrEqual(0);
    // Search from the opener; the signature should be near the start.
    const tail = builderSrc.slice(opener);
    expect(
      tail,
      "buildAttempts does not return Result<Attempt[], string>"
    ).toContain("Promise<Result<Attempt[], string>>");
    // Negative control: the public buildAttempts must NOT have the old return
    // type. The private buildAttemptsForAllProviders (which returns Attempt[])
    // exists later in the file; ensure the public one is not the match by
    // checking the substring "Promise<Attempt[]>" does not appear within
    // ~600 chars of the public opener (i.e. inside the public signature).
    const publicTail = tail.slice(0, 600);
    expect(
      publicTail,
      "public buildAttempts still returns bare Attempt[]"
    ).not.toContain("Promise<Attempt[]>");
  });

  it("the maintainer TODO and silent-skip log are removed from the error branch", () => {
    // The old code had:
    //   // TODO: Return error
    //   if (isErr(modelSpec)) {
    //     console.error(`Skipping invalid model: ${modelSpec.error}`);
    //     continue;
    //   }
    expect(builderSrc, "maintainer TODO still in source").not.toMatch(
      /\/\/\s*TODO:\s*Return\s+error/i
    );
    expect(
      builderSrc,
      "old silent-skip log still in source"
    ).not.toMatch(/Skipping\s+invalid\s+model/);
  });

  it("the isErr(modelSpec) branch returns err(...) instead of continuing", () => {
    // The old code had:
    //   if (isErr(modelSpec)) {
    //     console.error(`Skipping invalid model: ${modelSpec.error}`);
    //     continue;
    //   }
    // The new code must call `return err(modelSpec.error)` (literal
    // substring) and must not use `continue` inside the block.
    // We use a substring check rather than a block-boundary regex because
    // the block body contains a template literal whose `${...}` braces
    // confuse non-greedy `[\s\S]*?\}` matching.
    const isErrIdx = builderSrc.indexOf("if (isErr(modelSpec))");
    expect(isErrIdx, "isErr(modelSpec) guard not found").toBeGreaterThanOrEqual(0);
    // Window the next 400 chars after the guard opener; the block body
    // fits comfortably in this window.
    const window = builderSrc.slice(isErrIdx, isErrIdx + 400);
    expect(window, "isErr branch does not return err(modelSpec.error)").toContain(
      "return err(modelSpec.error)"
    );
    // The old silent-skip pattern: `continue;` as a bare statement at the
    // start of a line inside the block. We assert it is gone in the same
    // window.
    expect(
      window,
      "isErr branch still uses bare `continue;` to skip the bad model"
    ).not.toMatch(/^\s*continue\s*;?\s*$/m);
  });

  it("SimpleAIGateway checks isErr(attemptsResult) before using attempts", () => {
    // After the buildAttempts call there must be a `isErr(attemptsResult)`
    // check that pushes a 400 error and returns. We assert the source and
    // statusCode are set so the user-facing 400 message names the bad model.
    const openerIdx = gatewaySrc.indexOf("isErr(attemptsResult)");
    expect(openerIdx, "isErr(attemptsResult) guard not found").toBeGreaterThanOrEqual(
      0
    );
    // Window the next 400 chars; the handler body fits in this range.
    const window = gatewaySrc.slice(openerIdx, openerIdx + 400);
    expect(window, "handler missing `source: \"Invalid model\"`").toContain(
      'source: "Invalid model"'
    );
    expect(window, "handler missing statusCode: 400").toContain("statusCode: 400");
  });
});
