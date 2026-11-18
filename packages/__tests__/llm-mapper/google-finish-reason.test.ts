import { describe, expect, it } from "@jest/globals";
import { toOpenAI } from "../../llm-mapper/transform/providers/google/response/toOpenai";
import { GoogleToOpenAIStreamConverter } from "../../llm-mapper/transform/providers/google/streamedResponse/toOpenai";

const functionCallPart = {
  functionCall: { name: "get_weather", args: { city: "Paris" } },
};

describe("Google finish_reason with tool calls", () => {
  it("maps STOP to tool_calls when the response has a functionCall", () => {
    const result = toOpenAI({
      candidates: [
        {
          content: { role: "model", parts: [functionCallPart] },
          finishReason: "STOP",
          index: 0,
        },
      ],
    } as any);

    expect(result.choices[0].message.tool_calls).toHaveLength(1);
    expect(result.choices[0].finish_reason).toBe("tool_calls");
  });

  it("keeps STOP as stop for plain text responses", () => {
    const result = toOpenAI({
      candidates: [
        {
          content: { role: "model", parts: [{ text: "hi" }] },
          finishReason: "STOP",
          index: 0,
        },
      ],
    } as any);

    expect(result.choices[0].finish_reason).toBe("stop");
  });

  it("keeps MAX_TOKENS as length even with tool calls", () => {
    const result = toOpenAI({
      candidates: [
        {
          content: { role: "model", parts: [functionCallPart] },
          finishReason: "MAX_TOKENS",
          index: 0,
        },
      ],
    } as any);

    expect(result.choices[0].finish_reason).toBe("length");
  });

  it("streams tool_calls as the final finish_reason after a functionCall", () => {
    const converter = new GoogleToOpenAIStreamConverter();
    const chunks = [
      ...converter.convert({
        candidates: [
          { content: { role: "model", parts: [functionCallPart] }, index: 0 },
        ],
      } as any),
      ...converter.convert({
        candidates: [
          { content: { role: "model", parts: [{ text: "" }] }, finishReason: "STOP", index: 0 },
        ],
      } as any),
    ];

    const reasons = chunks
      .map((c) => c.choices[0]?.finish_reason)
      .filter((r) => r !== null && r !== undefined);
    expect(reasons).toEqual(["tool_calls"]);
  });

  it("streams stop for text-only responses", () => {
    const converter = new GoogleToOpenAIStreamConverter();
    const chunks = converter.convert({
      candidates: [
        { content: { role: "model", parts: [{ text: "hi" }] }, finishReason: "STOP", index: 0 },
      ],
    } as any);

    const reasons = chunks
      .map((c) => c.choices[0]?.finish_reason)
      .filter((r) => r !== null && r !== undefined);
    expect(reasons).toEqual(["stop"]);
  });
});
