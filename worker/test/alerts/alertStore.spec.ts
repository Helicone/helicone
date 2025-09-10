import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertStore } from "../../src/lib/db/AlertStore";

// Minimal Clickhouse wrapper mock
class MockClickhouse {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async dbQuery<T>(query: string, params: (number | string)[]) {
    return { data: [] as unknown as T[], error: null };
  }
}

describe("AlertStore", () => {
  let supabase: any;
  let clickhouse: any;
  let store: AlertStore;
  let fromMock: any;

  beforeEach(() => {
    supabase = {
      from: vi.fn(),
    } as any;
    clickhouse = new MockClickhouse();
    store = new AlertStore(supabase as any, clickhouse);

    fromMock = (supabase as any).from;
    vi.restoreAllMocks();
  });

  it("getAlerts returns alerts list", async () => {
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [{ id: "a1" }], error: null }),
    };
    (fromMock as any).mockReturnValue(selectChain);

    const res = await store.getAlerts();
    expect(res.error).toBeNull();
    expect(res.data).toEqual([{ id: "a1" }]);
    expect(selectChain.select).toHaveBeenCalled();
    expect(selectChain.eq).toHaveBeenCalledWith("soft_delete", false);
  });

  it("updateAlertStatuses updates by ids", async () => {
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    (fromMock as any).mockReturnValue(updateChain);

    const res = await store.updateAlertStatuses("triggered", ["a1", "a2"]);
    expect(res.error).toBeNull();
    expect(updateChain.update).toHaveBeenCalled();
    expect(updateChain.in).toHaveBeenCalledWith("id", ["a1", "a2"]);
  });

  it("updateAlertHistoryStatuses updates active entries for alert ids", async () => {
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    (fromMock as any).mockReturnValue(updateChain);

    const now = new Date().toISOString();
    const res = await store.updateAlertHistoryStatuses(
      "resolved",
      ["a1"],
      now
    );
    expect(res.error).toBeNull();
    expect(updateChain.update).toHaveBeenCalled();
    expect(updateChain.in).toHaveBeenCalledWith("alert_id", ["a1"]);
    expect(updateChain.eq).toHaveBeenCalledWith("status", "triggered");
  });

  it("insertAlertHistory inserts rows", async () => {
    const insertChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    (fromMock as any).mockReturnValue(insertChain);

    const res = await store.insertAlertHistory([
      {
        alert_id: "a1",
        alert_metric: "response.status",
        alert_name: "name",
        alert_start_time: new Date().toISOString(),
        org_id: "org",
        status: "triggered",
        triggered_value: "10",
      } as any,
    ]);
    expect(res.error).toBeNull();
    expect(insertChain.insert).toHaveBeenCalled();
  });

  it("getErrorRate queries clickhouse and maps data", async () => {
    const mock = vi
      .spyOn(clickhouse, "dbQuery")
      .mockResolvedValue({
        data: [
          { totalCount: 100, errorCount: 10, requestCount: 100 },
        ],
        error: null,
      });

    const res = await store.getErrorRate("org", 60000);
    expect(res.error).toBeNull();
    expect(res.data).toEqual({ totalCount: 100, errorCount: 10, requestCount: 100 });
    expect(mock).toHaveBeenCalled();
  });

  it("getCost queries clickhouse and maps data", async () => {
    const mock = vi
      .spyOn(clickhouse, "dbQuery")
      .mockResolvedValue({
        data: [
          { totalCount: 5.5, requestCount: 42 },
        ],
        error: null,
      });

    const res = await store.getCost("org", 60000);
    expect(res.error).toBeNull();
    expect(res.data).toEqual({ totalCount: 5.5, requestCount: 42 });
    expect(mock).toHaveBeenCalled();
  });
});


