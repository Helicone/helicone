import { describe, it, expect } from "@jest/globals";
import {
  moonshotaiModels,
  moonshotaiEndpointConfig as moonshotaiEndpoints,
} from "../../cost/models/authors/moonshotai";
import { calculateModelCostBreakdown } from "../../cost/models/calculate-cost";
import { modelCostBreakdownFromRegistry } from "../../cost/costCalc";
import type { ModelProviderName } from "../../cost/models/providers";
import type { ModelConfig, ModelProviderConfig } from "../../cost/models/types";

describe("MoonshotAI Kimi K3 Registry", () => {
  describe("Model Definition", () => {
    it("should define the kimi-k3 model", () => {
      expect(Object.keys(moonshotaiModels)).toContain("kimi-k3");
    });

    it("should have correct model metadata", () => {
      const model = (moonshotaiModels as Record<string, ModelConfig>)[
        "kimi-k3"
      ];
      expect(model.author).toBe("moonshotai");
      expect(model.tokenizer).toBe("MoonshotAI");
      expect(model.contextLength).toBe(1_048_576);
      expect(model.modality.inputs).toContain("text");
      expect(model.modality.outputs).toContain("text");
    });
  });

  describe("Endpoint Configurations", () => {
    const expectedEndpoints = ["kimi-k3:openrouter", "kimi-k3:novita"];

    it.each(expectedEndpoints)("should define endpoint %s", (endpointKey) => {
      expect(Object.keys(moonshotaiEndpoints)).toContain(endpointKey);
    });

    it.each(expectedEndpoints)(
      "%s should have verified K3 pricing ($3.00/1M input, $15.00/1M output)",
      (endpointKey) => {
        const endpoint = (
          moonshotaiEndpoints as Record<string, ModelProviderConfig>
        )[endpointKey];
        expect(endpoint).toBeDefined();
        const pricing = endpoint.pricing[0];
        expect(pricing.input).toBe(0.000003); // $3.00 per 1M tokens
        expect(pricing.output).toBe(0.000015); // $15.00 per 1M tokens
        expect(pricing.cacheMultipliers?.cachedInput).toBe(0.1); // $0.30 per 1M tokens
      }
    );

    it.each(expectedEndpoints)(
      "%s should route to the moonshotai/kimi-k3 provider model id",
      (endpointKey) => {
        const endpoint = (
          moonshotaiEndpoints as Record<string, ModelProviderConfig>
        )[endpointKey];
        expect(endpoint.providerModelId).toBe("moonshotai/kimi-k3");
        expect(endpoint.author).toBe("moonshotai");
      }
    );
  });

  describe("Cost Calculation (regression for #5742: K3 traffic billed $0)", () => {
    const providersServingK3: ModelProviderName[] = [
      "openrouter" as ModelProviderName,
      "novita" as ModelProviderName,
    ];

    it.each(providersServingK3)(
      "should resolve a nonzero cost for kimi-k3 usage via %s",
      (provider) => {
        const breakdown = modelCostBreakdownFromRegistry({
          modelUsage: { input: 1_000_000, output: 1_000_000 },
          providerModelId: "moonshotai/kimi-k3",
          provider,
        });

        expect(breakdown).not.toBeNull();
        if (breakdown) {
          expect(breakdown.totalCost).toBeGreaterThan(0);
          // $3.00 input + $15.00 output for 1M/1M tokens
          expect(breakdown.totalCost).toBeCloseTo(18.0, 10);
          expect(breakdown.inputCost).toBeCloseTo(3.0, 10);
          expect(breakdown.outputCost).toBeCloseTo(15.0, 10);
        }
      }
    );

    it.each(providersServingK3)(
      "should apply the cached-input discount (10% of input) via %s",
      (provider) => {
        const breakdown = calculateModelCostBreakdown({
          modelUsage: {
            input: 1_000_000,
            output: 1_000_000,
            cacheDetails: { cachedInput: 1_000_000 },
          },
          providerModelId: "moonshotai/kimi-k3",
          provider,
        });

        expect(breakdown).not.toBeNull();
        if (breakdown) {
          // $3.00 input + $0.30 cached input + $15.00 output
          expect(breakdown.cachedInputCost).toBeCloseTo(0.3, 10);
          expect(breakdown.totalCost).toBeCloseTo(18.3, 10);
        }
      }
    );
  });
});
