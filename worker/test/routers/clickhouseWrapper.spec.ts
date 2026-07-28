import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const CLICKHOUSE_WRAPPER_PATH = resolve(
  __dirname,
  "../../src/lib/db/ClickhouseWrapper.ts"
);

function readClickhouseWrapperSource(): string {
  return readFileSync(CLICKHOUSE_WRAPPER_PATH, "utf-8");
}

describe("ClickhouseClientWrapper dead CRUD methods removed", () => {
  it("no longer defines dbInsertClickhouse", () => {
    const source = readClickhouseWrapperSource();
    expect(source).not.toMatch(/async\s+dbInsertClickhouse\s*[<(]/);
  });

  it("no longer defines dbUpdateClickhouse", () => {
    const source = readClickhouseWrapperSource();
    expect(source).not.toMatch(/async\s+dbUpdateClickhouse\s*\(/);
  });

  it("no longer contains the `// TODO dead code` comments", () => {
    const source = readClickhouseWrapperSource();
    expect(source).not.toMatch(/\/\/\s*TODO\s+dead\s+code/);
  });

  it("still defines dbQuery (the only used method)", () => {
    const source = readClickhouseWrapperSource();
    expect(source).toMatch(/async\s+dbQuery\s*</);
  });

  it("still exports the ClickhouseClientWrapper class", () => {
    const source = readClickhouseWrapperSource();
    expect(source).toMatch(
      /export\s+class\s+ClickhouseClientWrapper\s*\{/
    );
  });

  it("still exports the ClickhouseDB type used by dbQuery callers", () => {
    const source = readClickhouseWrapperSource();
    expect(source).toMatch(
      /export\s+interface\s+ClickhouseDB\s*\{/
    );
  });
});
