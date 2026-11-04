import { describe, it, expect } from "@jest/globals";
import { costOf, costOfPrompt, providers } from "../../cost";
import { modelCostBreakdownFromRegistry } from "../../cost/costCalc";

// Batch requests are logged with a "-batch" model suffix (see the OpenAI Batch
// API cookbook) and must be billed at half of the regular token price.
describe("OpenAI batch model costs", () => {
  it.each([
    ["o4-mini", 0.0000011, 0.0000044],
    ["o4-mini-2025-04-16", 0.0000011, 0.0000044],
    ["o3-pro", 0.00002, 0.00008],
    ["o1-pro", 0.00015, 0.0006],
    ["gpt-4o-search-preview", 0.0000025, 0.00001],
  ])("bills %s-batch at half of the regular price", (model, prompt, completion) => {
    const regular = costOf({ model, provider: "OPENAI" });
    expect(regular?.prompt_token).toBe(prompt);
    expect(regular?.completion_token).toBe(completion);

    const batch = costOf({ model: `${model}-batch`, provider: "OPENAI" });
    expect(batch?.prompt_token).toBe(prompt / 2);
    expect(batch?.completion_token).toBe(completion / 2);
  });

  it("logs the half-price cost for an o4-mini batch request", () => {
    // The model registry has no "-batch" ids, so the logged cost comes from costOfPrompt
    expect(
      modelCostBreakdownFromRegistry({
        modelUsage: { input: 1_000_000, output: 1_000_000 },
        providerModelId: "o4-mini-batch",
        provider: "openai",
      })
    ).toBeNull();

    const cost = costOfPrompt({
      provider: "OPENAI",
      model: "o4-mini-batch",
      promptTokens: 1_000_000,
      promptCacheWriteTokens: 0,
      promptCacheReadTokens: 0,
      promptAudioTokens: 0,
      completionTokens: 1_000_000,
      completionAudioTokens: 0,
    });
    // $0.55/M input + $2.20/M output
    expect(cost).toBeCloseTo(0.55 + 2.2, 10);
  });

  it("resolves every OpenAI and Azure batch model to its own batch price", () => {
    for (const provider of ["OPENAI", "AZURE"]) {
      const costs = providers.find((p) => p.provider === provider)!.costs!;
      for (const row of costs) {
        if (!row.model.value.endsWith("-batch")) continue;
        expect({ model: row.model.value, cost: costOf({ model: row.model.value, provider }) }).toEqual({
          model: row.model.value,
          cost: row.cost,
        });
      }
    }
  });
});
