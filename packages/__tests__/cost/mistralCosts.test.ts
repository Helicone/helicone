import { describe, it, expect } from "@jest/globals";
import { costs as mistralCosts } from "../../cost/providers/mistral";

describe("Mistral cost configuration", () => {
  it("should have per-token rates under 0.0001 for all models", () => {
    for (const row of mistralCosts) {
      expect(row.cost.prompt_token).toBeLessThan(0.0001);
      expect(row.cost.completion_token).toBeLessThan(0.0001);
    }
  });

  it("should have correct per-token rates for mistral-large", () => {
    const mistralLarge = mistralCosts.find(
      (row) => row.model.value === "mistral-large"
    );
    expect(mistralLarge).toBeDefined();
    expect(mistralLarge?.cost.prompt_token).toBe(0.000002);
    expect(mistralLarge?.cost.completion_token).toBe(0.000006);
  });

  it("should have correct per-token rates for codestral", () => {
    const codestral = mistralCosts.find(
      (row) => row.model.value === "codestral"
    );
    expect(codestral).toBeDefined();
    expect(codestral?.cost.prompt_token).toBe(0.0000003);
    expect(codestral?.cost.completion_token).toBe(0.0000009);
  });
});
