import { describe, it, expect } from "@jest/globals";
import { HeliconeHeaders } from "../../../shared/proxy/heliconeHeaders";
import { InternalHeaders } from "../../../shared/proxy/types/internalHeaders";

function makeHeaders(headers: Record<string, string>): HeliconeHeaders<InternalHeaders> {
  return new HeliconeHeaders(new InternalHeaders(headers));
}

const VALID_TARGET = "https://example.com/fallback";

describe("HeliconeHeaders — helicone-fallbacks validation", () => {
  it("returns null when the header is absent", () => {
    const headers = makeHeaders({});
    expect(headers.fallBacks).toBeNull();
  });

  it("parses a well-formed fallback entry", () => {
    const headers = makeHeaders({
      "helicone-fallbacks": JSON.stringify([
        {
          "target-url": VALID_TARGET,
          headers: { "x-api-key": "abc" },
          onCodes: [500, 502, { from: 520, to: 530 }],
        },
      ]),
    });
    expect(headers.fallBacks).toEqual([
      {
        "target-url": VALID_TARGET,
        headers: { "x-api-key": "abc" },
        onCodes: [500, 502, { from: 520, to: 530 }],
        bodyKeyOverride: undefined,
      },
    ]);
  });

  it("throws a clear error when headers is a string (not TypeError)", () => {
    expect(() =>
      makeHeaders({
        "helicone-fallbacks": JSON.stringify([
          {
            "target-url": VALID_TARGET,
            headers: "not-an-object",
            onCodes: [500],
          },
        ]),
      })
    ).toThrow(
      "helicone-fallbacks headers must be an object of string keys and string values"
    );
  });

  it("throws a clear error when headers is null", () => {
    // null is caught by the earlier "missing required field" guard, which
    // already produces a clear message — we just want to make sure the new
    // validator doesn't crash with TypeError on null.
    expect(() =>
      makeHeaders({
        "helicone-fallbacks": JSON.stringify([
          {
            "target-url": VALID_TARGET,
            headers: null,
            onCodes: [500],
          },
        ]),
      })
    ).toThrow(
      "helicone-fallbacks must have target-url, headers, and onCodes"
    );
  });

  it("throws a clear error when headers contains a non-string value", () => {
    expect(() =>
      makeHeaders({
        "helicone-fallbacks": JSON.stringify([
          {
            "target-url": VALID_TARGET,
            headers: { "x-api-key": 123 },
            onCodes: [500],
          },
        ]),
      })
    ).toThrow(
      "helicone-fallbacks headers must be an object of string keys and string values"
    );
  });

  it("throws a clear error when onCodes is a string (not TypeError)", () => {
    expect(() =>
      makeHeaders({
        "helicone-fallbacks": JSON.stringify([
          {
            "target-url": VALID_TARGET,
            headers: { "x-api-key": "abc" },
            onCodes: "oops",
          },
        ]),
      })
    ).toThrow(
      "helicone-fallbacks onCodes must be an array of numbers or {from, to} objects"
    );
  });

  it("throws a clear error when an onCodes entry is missing from/to", () => {
    expect(() =>
      makeHeaders({
        "helicone-fallbacks": JSON.stringify([
          {
            "target-url": VALID_TARGET,
            headers: { "x-api-key": "abc" },
            onCodes: [{ from: 500 }],
          },
        ]),
      })
    ).toThrow(
      "helicone-fallbacks onCodes must be an array of numbers or {from, to} objects"
    );
  });

  it("throws a clear error when an onCodes entry is null", () => {
    expect(() =>
      makeHeaders({
        "helicone-fallbacks": JSON.stringify([
          {
            "target-url": VALID_TARGET,
            headers: { "x-api-key": "abc" },
            onCodes: [null],
          },
        ]),
      })
    ).toThrow(
      "helicone-fallbacks onCodes must be an array of numbers or {from, to} objects"
    );
  });

  it("throws when the top-level value is not an array", () => {
    expect(() =>
      makeHeaders({
        "helicone-fallbacks": JSON.stringify({ "target-url": VALID_TARGET }),
      })
    ).toThrow("helicone-fallbacks must be an array");
  });

  it("throws when a fallback entry is missing a required field", () => {
    expect(() =>
      makeHeaders({
        "helicone-fallbacks": JSON.stringify([{ "target-url": VALID_TARGET }]),
      })
    ).toThrow(
      "helicone-fallbacks must have target-url, headers, and onCodes"
    );
  });
});
