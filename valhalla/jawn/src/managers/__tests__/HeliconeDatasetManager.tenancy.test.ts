import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../../lib/shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
  dbQueryClickhouse: jest.fn(),
}));

import { dbExecute } from "../../lib/shared/db/dbExecute";
import { HeliconeDatasetManager } from "../dataset/HeliconeDatasetManager";
import { clampInputsLimit, MAX_INPUTS_LIMIT } from "../inputs/InputsManager";

const ORG = "11111111-1111-1111-1111-111111111111";
const FOREIGN_DATASET = "dddddddd-0000-0000-0000-000000000002";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;
const norm = (sql: string) => sql.replace(/\s+/g, " ").trim();

beforeEach(() => {
  mockDbExecute.mockReset();
});

describe("HeliconeDatasetManager tenancy", () => {
  test("mutate does not add rows to a dataset owned by another org", async () => {
    mockDbExecute.mockImplementation((async (sql: string) => {
      const q = norm(sql);
      if (q.startsWith("SELECT id FROM helicone_dataset WHERE id = $1")) {
        return { data: [], error: null };
      }
      throw new Error(`Unexpected query: ${q}`);
    }) as any);

    const manager = new HeliconeDatasetManager({ organizationId: ORG });
    const result = await manager.mutate(FOREIGN_DATASET, {
      addRequests: ["req-1"],
      removeRequests: [],
    });

    expect(result.error).toBe("Dataset not found");
    const [, params] = mockDbExecute.mock.calls[0] as [string, any[]];
    expect(params).toEqual([FOREIGN_DATASET, ORG]);
    expect(
      mockDbExecute.mock.calls.some(([sql]) =>
        (sql as string).includes("INSERT INTO helicone_dataset_row")
      )
    ).toBe(false);
  });

  test("getDatasets only counts rows from the same org", async () => {
    mockDbExecute.mockResolvedValue({ data: [], error: null });
    const manager = new HeliconeDatasetManager({ organizationId: ORG });
    await manager.getDatasets({});
    const [sql] = mockDbExecute.mock.calls[0] as [string, any[]];
    expect(norm(sql)).toContain(
      "ON hd.id = hdr.dataset_id AND hdr.organization_id = hd.organization"
    );
  });
});

describe("clampInputsLimit", () => {
  test("bounds the inputs page size", () => {
    expect(clampInputsLimit(10)).toBe(10);
    expect(clampInputsLimit(1_000_000)).toBe(MAX_INPUTS_LIMIT);
    expect(clampInputsLimit(-5)).toBe(1);
    expect(clampInputsLimit(Number.NaN)).toBe(1);
    expect(clampInputsLimit(2.7)).toBe(2);
  });
});
