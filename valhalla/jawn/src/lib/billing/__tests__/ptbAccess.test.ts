import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { PTB_BLOCKED_FEATURE } from "../../../../../../packages/common/billing/ptbAccess";

jest.mock("../../shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));

import { dbExecute } from "../../shared/db/dbExecute";
import { isPtbBlocked } from "../ptbAccess";

describe("isPtbBlocked", () => {
  const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns true when the organization has the block flag", async () => {
    mockDbExecute.mockResolvedValueOnce({
      data: [{ id: "flag-1" }],
      error: null,
    });

    const result = await isPtbBlocked("org-1");

    expect(result).toEqual({ data: true, error: null });
    expect(mockDbExecute).toHaveBeenCalledWith(expect.any(String), [
      "org-1",
      PTB_BLOCKED_FEATURE,
    ]);
  });

  test("returns false when the organization is not blocked", async () => {
    mockDbExecute.mockResolvedValueOnce({ data: [], error: null });

    await expect(isPtbBlocked("org-1")).resolves.toEqual({
      data: false,
      error: null,
    });
  });

  test("returns the database error so checkout can fail closed", async () => {
    mockDbExecute.mockResolvedValueOnce({
      data: null,
      error: "database unavailable",
    });

    await expect(isPtbBlocked("org-1")).resolves.toEqual({
      data: null,
      error: "database unavailable",
    });
  });
});
