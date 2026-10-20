import {
  approvedDomains,
  isApprovedApiBase,
} from "../../cost/providers/mappings";

describe("isApprovedApiBase", () => {
  it("accepts an absent override", () => {
    expect(isApprovedApiBase(undefined)).toBe(true);
    expect(isApprovedApiBase(null)).toBe(true);
  });

  it("accepts real provider hosts, with and without paths", () => {
    expect(isApprovedApiBase("https://api.anthropic.com")).toBe(true);
    expect(isApprovedApiBase("https://api.anthropic.com/")).toBe(true);
    expect(isApprovedApiBase("https://api.anthropic.com/v1/messages")).toBe(
      true,
    );
    expect(isApprovedApiBase("https://api.openai.com/v1")).toBe(true);
    expect(isApprovedApiBase("https://us.api.openai.com/v1")).toBe(true);
    expect(isApprovedApiBase("https://api.together.xyz/v1")).toBe(true);
    expect(isApprovedApiBase("https://openrouter.ai/api/v1")).toBe(true);
    expect(
      isApprovedApiBase("https://bedrock-runtime.us-east-1.amazonaws.com"),
    ).toBe(true);
    expect(
      isApprovedApiBase(
        "https://bedrock-runtime.us-east-1.amazonaws.com/model/x/invoke",
      ),
    ).toBe(true);
    expect(isApprovedApiBase("https://myres.openai.azure.com/openai")).toBe(
      true,
    );
    expect(
      isApprovedApiBase("https://generativelanguage.googleapis.com/v1beta"),
    ).toBe(true);
    expect(isApprovedApiBase("http://127.0.0.1:8080/v1")).toBe(true);
  });

  it("rejects userinfo tricks that split the regex host from the real host", () => {
    expect(isApprovedApiBase("https://api.anthropic.com@attacker.com/")).toBe(
      false,
    );
    expect(isApprovedApiBase("https://api.openai.com:x@attacker.com/v1")).toBe(
      false,
    );
  });

  it("rejects suffix and lookalike hosts", () => {
    expect(isApprovedApiBase("https://api.anthropic.com.evil.com/")).toBe(
      false,
    );
    expect(isApprovedApiBase("https://api.anthropic.community/")).toBe(false);
    expect(isApprovedApiBase("https://api.together.xyz.attacker.com")).toBe(
      false,
    );
    expect(isApprovedApiBase("https://evil.com/?x=.amdbartek.dev")).toBe(false);
    expect(isApprovedApiBase("https://evil.com/.googleapis.com")).toBe(false);
    expect(
      isApprovedApiBase(
        "https://bedrock-runtime.us-east-1.amazonaws.com.evil.com/",
      ),
    ).toBe(false);
  });

  it("accepts gateway-only hosts the worker forwards to", () => {
    expect(
      isApprovedApiBase("https://inference.baseten.co/v1/chat/completions"),
    ).toBe(true);
    expect(
      isApprovedApiBase("https://llm.chutes.ai/v1/chat/completions"),
    ).toBe(true);
    expect(isApprovedApiBase("https://api.hyperbolic.xyz")).toBe(true);
    expect(isApprovedApiBase("https://api.app.predibase.com")).toBe(true);
    expect(isApprovedApiBase("https://gateway.llmmapper.com")).toBe(true);
    expect(isApprovedApiBase("https://api.firecrawl.dev/v0/scrape")).toBe(
      true,
    );
    expect(isApprovedApiBase("https://inference.baseten.co.evil.com")).toBe(
      false,
    );
  });

  it("rejects a dotless host borrowing an Azure suffix from the path", () => {
    expect(isApprovedApiBase("https://ai/.openai.azure.com")).toBe(false);
    expect(isApprovedApiBase("http://intranet/x.azure-api.net")).toBe(false);
    expect(
      isApprovedApiBase("https://myres.cognitiveservices.azure.com/openai"),
    ).toBe(true);
  });

  it("rejects plain http for provider hosts (keys must not travel in clear)", () => {
    expect(isApprovedApiBase("http://myres.openai.azure.com/openai")).toBe(
      false,
    );
    expect(isApprovedApiBase("http://api.openai.com/v1")).toBe(false);
    expect(isApprovedApiBase("http://127.0.0.1:8080/v1")).toBe(true);
  });

  it("rejects unparseable or non-http inputs", () => {
    expect(isApprovedApiBase("not a url")).toBe(false);
    expect(isApprovedApiBase("api.anthropic.com")).toBe(false);
    expect(isApprovedApiBase("ftp://api.anthropic.com/")).toBe(false);
    expect(isApprovedApiBase("javascript:alert(1)")).toBe(false);
  });

  it("every host pattern is anchored so a suffix cannot extend the host", () => {
    for (const pattern of approvedDomains) {
      const src = pattern.source;
      // Patterns must terminate the host with a path boundary or end anchor.
      expect(
        src.endsWith("(\\/|$)") ||
          src.endsWith("$") ||
          src.endsWith("(\\/.*)?$"),
      ).toBe(true);
    }
  });
});
