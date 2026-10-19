import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../../../lib/clients/redisClient", () => ({ redisClient: null }));
jest.mock("../../../lib/shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));

import { dbExecute } from "../../../lib/shared/db/dbExecute";
import {
  checkOrgRateLimit,
  isPaidEvaluatorTier,
  orgHasPaidEvaluatorTier,
  resetOrgRateLimitMemory,
} from "../orgRateLimit";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;

beforeEach(() => {
  resetOrgRateLimitMemory();
  mockDbExecute.mockReset();
});

describe("tier gate", () => {
  test("free is not a paid evaluator tier", () => {
    expect(isPaidEvaluatorTier("free")).toBe(false);
    expect(isPaidEvaluatorTier(null)).toBe(false);
    expect(isPaidEvaluatorTier("pro-20250202")).toBe(true);
    expect(isPaidEvaluatorTier("enterprise")).toBe(true);
  });

  test("orgHasPaidEvaluatorTier reads the org tier", async () => {
    mockDbExecute.mockResolvedValue({ data: [{ tier: "free" }], error: null });
    expect(await orgHasPaidEvaluatorTier("org-1")).toBe(false);
    mockDbExecute.mockResolvedValue({
      data: [{ tier: "team-20250130" }],
      error: null,
    });
    expect(await orgHasPaidEvaluatorTier("org-1")).toBe(true);
    mockDbExecute.mockResolvedValue({ data: null, error: "db down" });
    expect(await orgHasPaidEvaluatorTier("org-1")).toBe(false);
  });
});

describe("checkOrgRateLimit (memory fallback)", () => {
  test("allows up to the limit then blocks, per org", async () => {
    const params = { bucket: "t", limit: 2, windowSeconds: 60 };
    expect((await checkOrgRateLimit({ ...params, orgId: "a" })).allowed).toBe(true);
    expect((await checkOrgRateLimit({ ...params, orgId: "a" })).allowed).toBe(true);
    expect((await checkOrgRateLimit({ ...params, orgId: "a" })).allowed).toBe(false);
    // other orgs are unaffected
    expect((await checkOrgRateLimit({ ...params, orgId: "b" })).allowed).toBe(true);
  });
});
