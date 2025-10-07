import { subdivide } from "../subdivide";

describe("subdivide", () => {
  it("should subdivide array into chunks of specified size", () => {
    expect(subdivide([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("should subdivide array evenly when length is divisible by chunk size", () => {
    expect(subdivide([1, 2, 3, 4, 5, 6], 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("should handle single element chunks", () => {
    expect(subdivide([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it("should handle chunk size larger than array", () => {
    expect(subdivide([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });

  it("should handle empty array", () => {
    expect(subdivide([], 2)).toEqual([]);
  });

  it("should work with strings", () => {
    expect(subdivide(["a", "b", "c", "d"], 2)).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("should work with objects", () => {
    const objs = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(subdivide(objs, 2)).toEqual([[{ id: 1 }, { id: 2 }], [{ id: 3 }]]);
  });
});
