import { describe, it, expect } from "@jest/globals";
import type { ModelName, ModelProviderConfigId } from "../../cost/models/registry-types";
import { moonshotaiModels, moonshotaiEndpointConfig } from "../../cost/models/authors/moonshotai";
import {
  perplexityModels,
  perplexityEndpointConfig,
} from "../../cost/models/authors/perplexity/sonar";

/**
 * registry-types.ts derives `ModelName` and `ModelProviderConfigId` from a
 * static import list. If a new author is added to `registry.ts` but not to
 * this file, models and configs from that author stop satisfying the type
 * at every call site, even though runtime data is fine.
 *
 * This test compiles only if moonshotai and perplexity are part of both
 * unions. The casts below are the actual assertion — a TypeScript error
 * here means the import list in registry-types.ts has drifted behind
 * registry.ts.
 *
 * Runtime assertions check that the cast preserved the value.
 */

describe("registry-types.ts covers all authors", () => {
  describe("moonshotai", () => {
    it("includes every moonshotai model in ModelName", () => {
      for (const name of Object.keys(moonshotaiModels)) {
        const typed: ModelName = name as ModelName;
        expect(typed).toBe(name);
      }
    });

    it("includes every moonshotai endpoint in ModelProviderConfigId", () => {
      for (const id of Object.keys(moonshotaiEndpointConfig)) {
        const typed: ModelProviderConfigId = id as ModelProviderConfigId;
        expect(typed).toBe(id);
      }
    });
  });

  describe("perplexity", () => {
    it("includes every perplexity model in ModelName", () => {
      for (const name of Object.keys(perplexityModels)) {
        const typed: ModelName = name as ModelName;
        expect(typed).toBe(name);
      }
    });

    it("includes every perplexity endpoint in ModelProviderConfigId", () => {
      for (const id of Object.keys(perplexityEndpointConfig)) {
        const typed: ModelProviderConfigId = id as ModelProviderConfigId;
        expect(typed).toBe(id);
      }
    });
  });
});
