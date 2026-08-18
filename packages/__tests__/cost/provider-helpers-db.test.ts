import { describe, it, expect } from "@jest/globals";
import { dbProviderToProvider } from "../../cost/models/provider-helpers";
import { providers, ModelProviderName } from "../../cost/models/providers";

// The actual legacy human-readable variants accepted by
// `dbProviderToProvider`. Several are special-cased (e.g. "AWS Bedrock",
// "Google AI (Gemini)", "Vertex AI", "XAI", "OpenAI"), so we cannot derive
// this from the canonical lowercase name by simple capitalisation.
const LEGACY_ALIASES: Record<ModelProviderName, string[]> = {
  baseten: ["baseten", "Baseten"],
  anthropic: ["anthropic", "Anthropic"],
  azure: ["azure", "Azure OpenAI"],
  bedrock: ["bedrock", "AWS Bedrock", "aws"],
  canopywave: ["canopywave", "Canopy Wave"],
  cerebras: ["cerebras", "Cerebras"],
  chutes: ["chutes", "Chutes"],
  deepinfra: ["deepinfra", "DeepInfra"],
  deepseek: ["deepseek", "DeepSeek"],
  fireworks: ["fireworks", "Fireworks"],
  "google-ai-studio": ["google", "google-ai-studio", "Google AI (Gemini)"],
  groq: ["groq", "Groq"],
  helicone: ["helicone", "Helicone"],
  mistral: ["mistral", "Mistral"],
  nebius: ["nebius", "Nebius"],
  novita: ["novita", "Novita"],
  openai: ["openai", "OpenAI"],
  openrouter: ["openrouter", "OpenRouter"],
  perplexity: ["perplexity", "Perplexity"],
  vertex: ["vertex", "Vertex AI"],
  xai: ["xai", "XAI"],
};

describe("dbProviderToProvider legacy-format adapter", () => {
  it("exposes a legacy alias for every provider in the providers map", () => {
    const canonicalNames = Object.keys(providers) as ModelProviderName[];
    expect(canonicalNames.length).toBeGreaterThanOrEqual(21);
    for (const name of canonicalNames) {
      expect(LEGACY_ALIASES[name]).toBeDefined();
      expect(LEGACY_ALIASES[name].length).toBeGreaterThan(0);
    }
  });

  it("returns the canonical name for the lowercase input for every provider", () => {
    const canonicalNames = Object.keys(providers) as ModelProviderName[];
    for (const name of canonicalNames) {
      expect(dbProviderToProvider(name)).toBe(name);
    }
  });

  it("returns the canonical name for every legacy alias in the table", () => {
    const entries = Object.entries(LEGACY_ALIASES) as [
      ModelProviderName,
      string[],
    ][];
    for (const [canonical, aliases] of entries) {
      for (const alias of aliases) {
        expect(dbProviderToProvider(alias)).toBe(canonical);
      }
    }
  });

  // Spot-check the 4 providers that were silently dropped before this fix.
  // Each row in `decrypted_provider_keys_v2` whose `provider_name` matched
  // one of these caused `getDecryptedProviderKeys` to filter the row out
  // without any log or error.
  describe("previously-missing providers (regression for the silent drop)", () => {
    it("maps xai / XAI to canonical xai", () => {
      expect(dbProviderToProvider("xai")).toBe("xai");
      expect(dbProviderToProvider("XAI")).toBe("xai");
    });

    it("maps perplexity / Perplexity to canonical perplexity", () => {
      expect(dbProviderToProvider("perplexity")).toBe("perplexity");
      expect(dbProviderToProvider("Perplexity")).toBe("perplexity");
    });

    it("maps mistral / Mistral to canonical mistral", () => {
      expect(dbProviderToProvider("mistral")).toBe("mistral");
      expect(dbProviderToProvider("Mistral")).toBe("mistral");
    });

    it("maps helicone / Helicone to canonical helicone", () => {
      expect(dbProviderToProvider("helicone")).toBe("helicone");
      expect(dbProviderToProvider("Helicone")).toBe("helicone");
    });
  });

  it("returns null for unknown provider names", () => {
    expect(dbProviderToProvider("foo")).toBeNull();
    expect(dbProviderToProvider("OpenAI Extra")).toBeNull();
    expect(dbProviderToProvider("")).toBeNull();
  });

  it("accepts the special-cased vertex alias 'Vertex AI' but not the naive 'Vertex'", () => {
    // Documents the asymmetry: callers must use the exact legacy form for
    // vertex. A naive capitalisation ("Vertex") does not match.
    expect(dbProviderToProvider("vertex")).toBe("vertex");
    expect(dbProviderToProvider("Vertex AI")).toBe("vertex");
    expect(dbProviderToProvider("Vertex")).toBeNull();
  });
});
