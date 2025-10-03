import { buildRequestSortClickhouse, SortLeafRequest } from "./sorts";

describe("buildRequestSortClickhouse", () => {
  it("should cast latency to Int32 for proper numeric sorting", () => {
    const sort: SortLeafRequest = { latency: "desc" };
    const result = buildRequestSortClickhouse(sort);
    expect(result).toBe("toInt32(request_response_rmt.latency) desc");
  });

  it("should cast latency to Int32 for ascending sort", () => {
    const sort: SortLeafRequest = { latency: "asc" };
    const result = buildRequestSortClickhouse(sort);
    expect(result).toBe("toInt32(request_response_rmt.latency) asc");
  });

  it("should handle created_at sorting without casting", () => {
    const sort: SortLeafRequest = { created_at: "desc" };
    const result = buildRequestSortClickhouse(sort);
    expect(result).toBe("request_response_rmt.request_created_at desc");
  });

  it("should handle cost sorting", () => {
    const sort: SortLeafRequest = { cost: "desc" };
    const result = buildRequestSortClickhouse(sort);
    expect(result).toBe("cost desc");
  });

  it("should handle total_tokens with calculation", () => {
    const sort: SortLeafRequest = { total_tokens: "desc" };
    const result = buildRequestSortClickhouse(sort);
    expect(result).toBe(
      "(request_response_rmt.prompt_tokens + request_response_rmt.completion_tokens) desc"
    );
  });
});
