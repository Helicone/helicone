import { describe, it, expect } from "@jest/globals";
import { calculateModelCostBreakdown } from "../../cost/models/calculate-cost";

// claude-4.5-sonnet:anthropic has two pricing tiers:
//   threshold 0:      input 0.000003, cacheMultipliers.cachedInput 0.1
//   threshold 200000: input 0.000006  (cacheMultipliers inherited from the base tier)
//
// Above 200k prompt tokens the input rate doubles, and a cached read is priced as a
// multiple of the input rate, so it should double too. This pins that cached reads pick
// the same long-context tier as input and output do.
describe("Anthropic long-context cache pricing", () => {
  const providerModelId = "claude-sonnet-4-5-20250929";

  it("prices cached reads at the >200k tier, like input and output", () => {
    const breakdown = calculateModelCostBreakdown({
      modelUsage: {
        input: 250_000, // above the 200k threshold on its own
        output: 1_000,
        cacheDetails: { cachedInput: 100_000 },
      },
      providerModelId,
      provider: "anthropic",
    });

    expect(breakdown).not.toBeNull();
    // input:  250_000 * 0.000006             = 1.5
    // cached: 100_000 * 0.000006 * 0.1       = 0.06  (base tier would give 0.03)
    expect(breakdown?.inputCost).toBeCloseTo(1.5, 10);
    expect(breakdown?.cachedInputCost).toBeCloseTo(0.06, 10);
  });

  it("prices cached reads at the base tier below the threshold", () => {
    const breakdown = calculateModelCostBreakdown({
      modelUsage: {
        input: 10_000,
        output: 1_000,
        cacheDetails: { cachedInput: 5_000 },
      },
      providerModelId,
      provider: "anthropic",
    });

    expect(breakdown).not.toBeNull();
    // Base tier: cached 5_000 * 0.000003 * 0.1 = 0.0015
    expect(breakdown?.cachedInputCost).toBeCloseTo(0.0015, 10);
  });
});
