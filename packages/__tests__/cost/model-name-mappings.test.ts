import { describe, it, expect } from "@jest/globals";
import {
  parseModelString,
  MODEL_NAME_MAPPINGS,
} from "../../cost/models/provider-helpers";

/**
 * The mapping table that translates deprecated / alternate model ids to
 * their current registry ids. Each alias must reach the same final
 * `modelName` whether the user wrote it in dotted or dashed form —
 * Anthropic and OpenAI both emit dashed ids in their SDKs, error
 * messages, and changelogs, so the mapping has to cover both.
 */

describe("MODEL_NAME_MAPPINGS — alias coverage", () => {
  it("maps claude-3.5-sonnet and claude-3-5-sonnet to the same model", () => {
    const dotted = parseModelString("claude-3.5-sonnet");
    const dashed = parseModelString("claude-3-5-sonnet");
    expect(dotted.data?.modelName).toBe("claude-3.5-sonnet-v2");
    expect(dashed.data?.modelName).toBe("claude-3.5-sonnet-v2");
  });

  it("maps claude-3.5-sonnet-20240620 and claude-3-5-sonnet-20240620 to the same model", () => {
    const dotted = parseModelString("claude-3.5-sonnet-20240620");
    const dashed = parseModelString("claude-3-5-sonnet-20240620");
    expect(dotted.data?.modelName).toBe("claude-3.5-sonnet-v2");
    expect(dashed.data?.modelName).toBe("claude-3.5-sonnet-v2");
  });

  it("maps the dashed upgraded id claude-3-5-sonnet-20241022 to v2", () => {
    const r = parseModelString("claude-3-5-sonnet-20241022");
    expect(r.data?.modelName).toBe("claude-3.5-sonnet-v2");
    expect(r.error).toBeNull();
  });

  it("preserves the online flag across dashed and dotted forms", () => {
    const dotted = parseModelString("claude-3.5-sonnet:online");
    const dashed = parseModelString("claude-3-5-sonnet:online");
    expect(dotted.data?.modelName).toBe("claude-3.5-sonnet-v2");
    expect(dashed.data?.modelName).toBe("claude-3.5-sonnet-v2");
    expect(dotted.data?.isOnline).toBe(true);
    expect(dashed.data?.isOnline).toBe(true);
  });

  it("maps kimi-k2 and kimi-k2-0905 (already mapped before this fix)", () => {
    // Regression guard — the original mapping shouldn't have regressed.
    const r = parseModelString("kimi-k2");
    expect(r.data?.modelName).toBe("kimi-k2-0905");
  });

  it("keeps the mapping table free of dangling aliases", () => {
    for (const [alias, target] of Object.entries(MODEL_NAME_MAPPINGS)) {
      // every mapped target must itself be a real registry model
      const r = parseModelString(target);
      expect(r.data?.modelName).toBe(target);
      expect(r.error).toBeNull();
      // alias itself must not be a real registry model (otherwise the
      // mapping is a no-op and the entry should be removed)
      const aliasR = parseModelString(alias);
      expect(aliasR.data?.modelName).not.toBe(alias);
    }
  });
});
