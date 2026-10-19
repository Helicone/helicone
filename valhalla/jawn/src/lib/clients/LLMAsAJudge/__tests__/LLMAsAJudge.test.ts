import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../../../shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));
jest.mock("../../../experiment/tempKeys/tempAPIKey", () => ({
  generateTempHeliconeAPIKey: jest.fn(),
}));
jest.mock("../../constant", () => ({
  GET_KEY: jest.fn(async () => "test-key"),
  OPENROUTER_WORKER_URL: "http://openrouter.test",
}));

import { dbExecute } from "../../../shared/db/dbExecute";
import { generateTempHeliconeAPIKey } from "../../../experiment/tempKeys/tempAPIKey";
import {
  buildJudgeRequestBody,
  extractScorerArguments,
  LLM_JUDGE_MAX_TOKENS,
  LLMAsAJudge,
  sanitizeJudgeTemplate,
} from "../LLMAsAJudge";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;
const mockTempKey = generateTempHeliconeAPIKey as jest.MockedFunction<
  typeof generateTempHeliconeAPIKey
>;

function validTemplate(overrides: Record<string, any> = {}) {
  return {
    model: "gpt-4o-mini",
    max_tokens: 512,
    temperature: 1,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: 'Output: <helicone-prompt-input key="outputBody" />',
          },
        ],
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "scorer",
          description: "score it",
          parameters: {
            type: "object",
            properties: { quality: { type: "boolean", description: "q" } },
            required: ["quality"],
          },
        },
      },
    ],
    ...overrides,
  };
}

describe("sanitizeJudgeTemplate", () => {
  test("accepts a normal UI-generated template", () => {
    const result = sanitizeJudgeTemplate(validTemplate());
    expect(result.error).toBeNull();
    expect(result.data?.model).toBe("gpt-4o-mini");
    expect(result.data?.max_tokens).toBe(512);
  });

  test("rejects models outside the allowlist", () => {
    const result = sanitizeJudgeTemplate(
      validTemplate({ model: "openai/o1-pro" })
    );
    expect(result.error).toMatch(/Model not allowed/);
  });

  test("caps max_tokens", () => {
    const result = sanitizeJudgeTemplate(validTemplate({ max_tokens: 100000 }));
    expect(result.data?.max_tokens).toBe(LLM_JUDGE_MAX_TOKENS);
  });

  test("defaults max_tokens when missing", () => {
    const t = validTemplate();
    delete (t as any).max_tokens;
    expect(sanitizeJudgeTemplate(t).data?.max_tokens).toBe(LLM_JUDGE_MAX_TOKENS);
  });

  test("rejects more than one tool", () => {
    const t = validTemplate();
    t.tools.push(t.tools[0]);
    expect(sanitizeJudgeTemplate(t).error).toMatch(/exactly one scorer/);
  });

  test("rejects non-text message parts (e.g. images)", () => {
    const t = validTemplate({
      messages: [
        {
          role: "user",
          content: [{ type: "image_url", image_url: { url: "http://x" } }],
        },
      ],
    });
    expect(sanitizeJudgeTemplate(t).error).toMatch(/only contain text/);
  });

  test("rejects unknown roles", () => {
    const t = validTemplate({ messages: [{ role: "tool", content: "x" }] });
    expect(sanitizeJudgeTemplate(t).error).toMatch(/Invalid LLM template/);
  });
});

describe("buildJudgeRequestBody", () => {
  test("forces the scorer tool and drops unknown fields", () => {
    const sanitized = sanitizeJudgeTemplate(
      validTemplate({ stream: true, n: 50, provider: { order: ["x"] } })
    ).data!;
    const body = buildJudgeRequestBody(sanitized, { outputBody: "hello" }).data!;
    expect(body.stream).toBeUndefined();
    expect(body.n).toBeUndefined();
    expect(body.provider).toBeUndefined();
    expect(body.tool_choice).toEqual({
      type: "function",
      function: { name: "scorer" },
    });
    expect(body.tools).toHaveLength(1);
    expect(body.tools[0].function.name).toBe("scorer");
    expect(JSON.stringify(body.messages)).toContain("Output: hello");
  });

  test("inputs cannot change the model or tool schema", () => {
    const sanitized = sanitizeJudgeTemplate(validTemplate()).data!;
    const body = buildJudgeRequestBody(sanitized, {
      outputBody: '", "model": "openai/o1-pro',
    }).data!;
    expect(body.model).toBe("gpt-4o-mini");
  });

  test("rejects oversized bodies", () => {
    const sanitized = sanitizeJudgeTemplate(validTemplate()).data!;
    const body = buildJudgeRequestBody(sanitized, {
      outputBody: "x".repeat(2 * 1024 * 1024),
    });
    expect(body.error).toBe("Evaluator input too large");
  });
});

describe("extractScorerArguments", () => {
  test("never echoes raw model output", () => {
    const secret = "SECRET-MODEL-OUTPUT";
    const res = extractScorerArguments({
      choices: [
        {
          message: {
            tool_calls: [
              { function: { name: "scorer", arguments: `not json ${secret}` } },
            ],
          },
        },
      ],
    });
    expect(res.error).toBe("No score found");
    expect(res.error).not.toContain(secret);
  });

  test("rejects calls to a different function", () => {
    const res = extractScorerArguments({
      choices: [
        {
          message: {
            tool_calls: [{ function: { name: "other", arguments: "{}" } }],
          },
        },
      ],
    });
    expect(res.error).toBe("No score found");
  });
});

describe("LLMAsAJudge.evaluate", () => {
  beforeEach(() => {
    mockDbExecute.mockReset();
    mockTempKey.mockReset();
  });

  const judge = (llmTemplate: any) =>
    new LLMAsAJudge({
      scoringType: "LLM-BOOLEAN",
      llmTemplate,
      inputRecord: { inputs: {} },
      outputBody: "out",
      inputBody: "in",
      promptTemplate: "",
      evaluatorName: "quality",
      organizationId: "org-1",
    });

  test("free tier is rejected before any key is minted", async () => {
    mockDbExecute.mockResolvedValue({ data: [{ tier: "free" }], error: null });
    const result = await judge(validTemplate()).evaluate();
    expect(result.error).toBe("You are not authorized to use this evaluator");
    expect(mockTempKey).not.toHaveBeenCalled();
  });

  test("disallowed model is rejected before any key is minted", async () => {
    mockDbExecute.mockResolvedValue({
      data: [{ tier: "pro-20250202" }],
      error: null,
    });
    const result = await judge(
      validTemplate({ model: "anthropic/claude-opus-4" })
    ).evaluate();
    expect(result.error).toMatch(/Model not allowed/);
    expect(mockTempKey).not.toHaveBeenCalled();
  });
});
