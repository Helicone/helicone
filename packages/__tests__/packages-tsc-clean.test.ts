import { describe, it, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";

const HELICONE_TEST_PATH = resolve(
  __dirname,
  "cost/providers/helicone.test.ts"
);

const GET_MAPPER_TYPE_TEST_PATH = resolve(
  __dirname,
  "llm-mapper/getMapperType.test.ts"
);

const REGISTRY_SNAPSHOTS_TEST_PATH = resolve(
  __dirname,
  "cost/registrySnapshots.test.ts"
);

const ROOT_PACKAGE_JSON_PATH = resolve(__dirname, "../../package.json");

describe("packages/__tests__/ pre-existing TypeScript errors are fixed", () => {
  it("helicone.test.ts toAnthropic callback declares modelId as optional", () => {
    const source = readFileSync(HELICONE_TEST_PATH, "utf-8");
    expect(source).toMatch(
      /toAnthropic\s*:\s*\(\s*body\s*:\s*any\s*,\s*modelId\s*\??\s*:\s*string/
    );
  });

  it("helicone.test.ts toAnthropic callback no longer has `modelId: string` (required)", () => {
    const source = readFileSync(HELICONE_TEST_PATH, "utf-8");
    expect(source).not.toMatch(
      /toAnthropic\s*:\s*\(\s*body\s*:\s*any\s*,\s*modelId\s*:\s*string\s*\)/
    );
  });

  it("getMapperType.test.ts HeliconeRequest literal includes reasoning_tokens", () => {
    const source = readFileSync(GET_MAPPER_TYPE_TEST_PATH, "utf-8");
    expect(source).toMatch(/reasoning_tokens\s*:/);
  });

  it("getMapperType.test.ts HeliconeRequest literal includes ai_gateway_body_mapping", () => {
    const source = readFileSync(GET_MAPPER_TYPE_TEST_PATH, "utf-8");
    expect(source).toMatch(/ai_gateway_body_mapping\s*:/);
  });

  it("root package.json includes @types/glob in devDependencies", () => {
    const source = readFileSync(ROOT_PACKAGE_JSON_PATH, "utf-8");
    const devDeps = JSON.parse(source).devDependencies ?? {};
    expect(devDeps).toHaveProperty("@types/glob");
  });

  it("registrySnapshots.test.ts still imports glob from the standard package", () => {
    const source = readFileSync(REGISTRY_SNAPSHOTS_TEST_PATH, "utf-8");
    expect(source).toMatch(
      /import\s*\{[^}]*sync\s+as\s+globSync[^}]*\}\s*from\s*["']glob["']/
    );
  });
});
