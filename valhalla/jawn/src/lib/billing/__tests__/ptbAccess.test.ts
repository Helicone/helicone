import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { PTB_ENABLED_FEATURE } from "../../../../../../packages/common/billing/ptbAccess";

jest.mock("../../shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));

import { dbExecute } from "../../shared/db/dbExecute";
import { hasPtbAccess } from "../ptbAccess";

describe("hasPtbAccess", () => {
  const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns true when the organization has the allow flag", async () => {
    mockDbExecute.mockResolvedValueOnce({
      data: [{ id: "flag-1" }],
      error: null,
    });

    await expect(hasPtbAccess("org-1")).resolves.toEqual({
      data: true,
      error: null,
    });
    expect(mockDbExecute).toHaveBeenCalledWith(expect.any(String), [
      "org-1",
      PTB_ENABLED_FEATURE,
    ]);
  });

  test("returns false when the organization has no PTB access flag", async () => {
    mockDbExecute.mockResolvedValueOnce({ data: [], error: null });

    await expect(hasPtbAccess("org-1")).resolves.toEqual({
      data: false,
      error: null,
    });
  });

  test("returns the database error so checkout can fail closed", async () => {
    mockDbExecute.mockResolvedValueOnce({
      data: null,
      error: "database unavailable",
    });

    await expect(hasPtbAccess("org-1")).resolves.toEqual({
      data: null,
      error: "database unavailable",
    });
  });
});
