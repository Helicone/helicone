import { HeliconeHeaders } from "../../../shared/proxy/heliconeHeaders";

const parse = (fallbacks: unknown) =>
  new HeliconeHeaders(
    new Headers({ "helicone-fallbacks": JSON.stringify(fallbacks) }),
  ).fallBacks;

const fallback = (overrides: Record<string, unknown> = {}) => [
  {
    "target-url": "https://example.com",
    headers: { Authorization: "Bearer x" },
    onCodes: [500, { from: 502, to: 504 }],
    ...overrides,
  },
];

describe("helicone-fallbacks validation", () => {
  test("accepts a well-formed fallback", () => {
    expect(parse(fallback())).toEqual(fallback());
  });

  test.each([["oops"], [42], [{ Authorization: 1 }]])(
    "rejects headers %p",
    (headers) => {
      expect(() => parse(fallback({ headers }))).toThrow(
        "helicone-fallbacks headers must be an object",
      );
    },
  );

  test.each([["500"], [{ from: 500 }], [[500, "502"]], [[null]]])(
    "rejects onCodes %p",
    (onCodes) => {
      expect(() => parse(fallback({ onCodes }))).toThrow(
        "helicone-fallbacks onCodes must be an array",
      );
    },
  );
});
