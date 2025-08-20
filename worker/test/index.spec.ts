import { describe, it, expect } from "vitest";

describe("Basic worker tests", () => {
  it("should pass basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle simple logic", () => {
    const testFunction = (x: number) => x * 2;
    expect(testFunction(5)).toBe(10);
  });
});
