import { buildRequestSortClickhouse, SortLeafRequest } from "./sorts";

describe("buildRequestSortClickhouse", () => {
  it("should sort latency with NULLS LAST and secondary sort for desc", () => {
    const sort: SortLeafRequest = { latency: "desc" };
    const result = buildRequestSortClickhouse(sort);
    expect(result).toBe(
      "request_response_rmt.latency desc NULLS LAST, request_response_rmt.request_created_at DESC"
    );
  });

  it("should sort latency with NULLS LAST and secondary sort for asc", () => {
    const sort: SortLeafRequest = { latency: "asc" };
    const result = buildRequestSortClickhouse(sort);
    expect(result).toBe(
      "request_response_rmt.latency asc NULLS LAST, request_response_rmt.request_created_at DESC"
    );
  });

  it("should handle created_at sorting without casting", () => {
    const sort: SortLeafRequest = { created_at: "desc" };
    const result = buildRequestSortClickhouse(sort);
    expect(result).toBe("request_response_rmt.request_created_at desc");
  });

  it("should handle cost sorting with secondary sort", () => {
    const sort: SortLeafRequest = { cost: "desc" };
    const result = buildRequestSortClickhouse(sort);
    expect(result).toBe(
      "cost desc NULLS LAST, request_response_rmt.request_created_at DESC"
    );
  });

  it("should handle total_tokens with calculation and secondary sort", () => {
    const sort: SortLeafRequest = { total_tokens: "desc" };
    const result = buildRequestSortClickhouse(sort);
    expect(result).toBe(
      "(request_response_rmt.prompt_tokens + request_response_rmt.completion_tokens) desc, request_response_rmt.request_created_at DESC"
    );
  });
});
