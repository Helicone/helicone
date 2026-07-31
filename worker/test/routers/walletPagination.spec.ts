import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const WALLET_ROUTER_PATH = resolve(
  __dirname,
  "../../src/routers/api/walletRouter.ts"
);

function readWalletRouterSource(): string {
  return readFileSync(WALLET_ROUTER_PATH, "utf-8");
}

describe("walletRouter pagination parseInt uses radix and NaN-safe default", () => {
  it("page parameter is parsed with a radix of 10", () => {
    const source = readWalletRouterSource();
    // The fix is the line: `page ? parseInt(page as string, 10) || 0 : 0`
    expect(source).toMatch(
      /page\s*\?\s*parseInt\(\s*page\s+as\s+string\s*,\s*10\s*\)\s*\|\|\s*0/
    );
  });

  it("pageSize parameter is parsed with a radix of 10", () => {
    const source = readWalletRouterSource();
    expect(source).toMatch(
      /pageSize\s*\?\s*parseInt\(\s*pageSize\s+as\s+string\s*,\s*10\s*\)\s*\|\|\s*50/
    );
  });

  it("does not use parseInt without a radix anywhere in walletRouter.ts", () => {
    const source = readWalletRouterSource();
    // Look for `parseInt(` followed by a string and `)` without a radix
    // in the pagination context. The new code uses `, 10)`, so a `parseInt(...)`
    // call without a radix would be `parseInt(<string>)` with no second arg.
    const matches = source.match(/parseInt\([^)]*\)/g) ?? [];
    const noRadix = matches.filter(
      (m) => !m.includes(", 10") && !m.includes(",10")
    );
    expect(noRadix).toEqual([]);
  });
});
