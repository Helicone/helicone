import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PEyeEyeAPIError,
  PEyeEyeManager,
  PEyeEyeMissingSecretsError,
  applyRedactedTexts,
  collectMessageTexts,
} from "../../src/lib/managers/PEyeEyeManager";

type FetchMock = ReturnType<typeof vi.fn>;

function buildManager(fetchMock: FetchMock, opts: Partial<{
  sessionMode: "stateful" | "stateless";
  apiKey: string;
}> = {}) {
  return new PEyeEyeManager({
    apiKey: opts.apiKey ?? "test_pek_key",
    apiBase: "https://api.peyeeye.ai",
    sessionMode: opts.sessionMode ?? "stateful",
    fetchImpl: fetchMock as unknown as typeof fetch,
  });
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("PEyeEyeManager", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("throws PEyeEyeMissingSecretsError when no API key is provided", () => {
      expect(
        () =>
          new PEyeEyeManager({
            apiKey: "",
            fetchImpl: vi.fn() as unknown as typeof fetch,
          })
      ).toThrow(PEyeEyeMissingSecretsError);
    });
  });

  describe("redact", () => {
    it("redacts a batch of texts and returns the session id (stateful)", async () => {
      const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
        expect(url).toBe("https://api.peyeeye.ai/v1/redact");
        expect(init.method).toBe("POST");
        const body = JSON.parse(String(init.body));
        expect(body.text).toEqual([
          "Email me at alice@example.com",
          "Call 555-867-5309",
        ]);
        expect(body.locale).toBe("auto");
        expect(body.session).toBeUndefined();
        return jsonResponse({
          text: ["Email me at [EMAIL_1]", "Call [PHONE_1]"],
          session_id: "ses_abc123",
        });
      });

      const manager = buildManager(fetchMock);
      const result = await manager.redact([
        "Email me at alice@example.com",
        "Call 555-867-5309",
      ]);

      expect(result.redacted).toEqual([
        "Email me at [EMAIL_1]",
        "Call [PHONE_1]",
      ]);
      expect(result.sessionId).toBe("ses_abc123");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("requests a stateless session when configured and reads rehydration_key", async () => {
      const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body));
        expect(body.session).toBe("stateless");
        return jsonResponse({
          text: ["[EMAIL_1]"],
          rehydration_key: "skey_zzz",
        });
      });

      const manager = buildManager(fetchMock, { sessionMode: "stateless" });
      const result = await manager.redact(["alice@example.com"]);
      expect(result.sessionId).toBe("skey_zzz");
    });

    it("returns empty result when given no texts (no HTTP call)", async () => {
      const fetchMock = vi.fn();
      const manager = buildManager(fetchMock);
      const result = await manager.redact([]);
      expect(result).toEqual({ redacted: [], sessionId: null });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("raises PEyeEyeAPIError when the redact response is the wrong shape", async () => {
      const fetchMock = vi.fn(async () => jsonResponse({ session_id: "ses_x" }));
      const manager = buildManager(fetchMock);
      await expect(manager.redact(["hi"])).rejects.toBeInstanceOf(
        PEyeEyeAPIError
      );
    });

    it("raises PEyeEyeAPIError when the redact response length doesn't match input", async () => {
      const fetchMock = vi.fn(async () =>
        jsonResponse({
          text: ["only one"],
          session_id: "ses_x",
        })
      );
      const manager = buildManager(fetchMock);
      await expect(
        manager.redact(["one", "two", "three"])
      ).rejects.toMatchObject({
        name: "PEyeEyeAPIError",
        message: expect.stringContaining("refusing to forward"),
      });
    });

    it("maps a 401 response to PEyeEyeMissingSecretsError", async () => {
      const fetchMock = vi.fn(async () =>
        new Response("unauthorized", { status: 401 })
      );
      const manager = buildManager(fetchMock);
      await expect(manager.redact(["hi"])).rejects.toBeInstanceOf(
        PEyeEyeMissingSecretsError
      );
    });

    it("maps a 429 response to a rate-limit PEyeEyeAPIError", async () => {
      const fetchMock = vi.fn(async () =>
        new Response("rate limit", { status: 429 })
      );
      const manager = buildManager(fetchMock);
      await expect(manager.redact(["hi"])).rejects.toMatchObject({
        name: "PEyeEyeAPIError",
        message: expect.stringContaining("rate limit"),
      });
    });
  });

  describe("rehydrate", () => {
    it("round-trips redact -> rehydrate", async () => {
      const calls: { url: string; body: any }[] = [];
      const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body));
        calls.push({ url, body });
        if (url.endsWith("/v1/redact")) {
          return jsonResponse({
            text: ["Hello [NAME_1]"],
            session_id: "ses_abc123",
          });
        }
        if (url.endsWith("/v1/rehydrate")) {
          return jsonResponse({
            text: "Hello Alice",
            replaced: 1,
          });
        }
        throw new Error(`unexpected url ${url}`);
      });

      const manager = buildManager(fetchMock);
      const redactRes = await manager.redact(["Hello Alice"]);
      const rehydrated = await manager.rehydrate(
        redactRes.redacted[0],
        redactRes.sessionId!
      );
      expect(rehydrated).toBe("Hello Alice");
      expect(calls).toHaveLength(2);
      expect(calls[1].body).toEqual({
        text: "Hello [NAME_1]",
        session: "ses_abc123",
      });
    });

    it("returns the input unchanged on rehydrate failure (best-effort)", async () => {
      const fetchMock = vi.fn(async () =>
        new Response("oops", { status: 500 })
      );
      const manager = buildManager(fetchMock);
      const out = await manager.rehydrate("Hello [NAME_1]", "ses_abc");
      expect(out).toBe("Hello [NAME_1]");
    });

    it("is a no-op for empty input (no HTTP call)", async () => {
      const fetchMock = vi.fn();
      const manager = buildManager(fetchMock);
      const out = await manager.rehydrate("", "ses_abc");
      expect(out).toBe("");
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("deleteSession", () => {
    it("DELETEs stateful sessions only", async () => {
      const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
      const manager = buildManager(fetchMock);
      await manager.deleteSession("ses_abc");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.peyeeye.ai/v1/sessions/ses_abc");
      expect((init as RequestInit).method).toBe("DELETE");
    });

    it("skips deletion for stateless skey_ sealed blobs", async () => {
      const fetchMock = vi.fn();
      const manager = buildManager(fetchMock);
      await manager.deleteSession("skey_zzz");
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});

describe("collectMessageTexts / applyRedactedTexts", () => {
  it("collects plain string content and writes it back", () => {
    const messages = [
      { role: "user", content: "alice@example.com" },
      { role: "assistant", content: "" },
    ];
    const parts = collectMessageTexts(messages);
    expect(parts).toEqual([
      { messageIndex: 0, partPath: "content", text: "alice@example.com" },
    ]);
    applyRedactedTexts(messages, parts, ["[EMAIL_1]"]);
    expect(messages[0].content).toBe("[EMAIL_1]");
  });

  it("collects multimodal text parts and writes them back", () => {
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: "alice@example.com" },
          { type: "image_url", image_url: { url: "https://x" } },
          { type: "text", text: "hello" },
        ],
      },
    ];
    const parts = collectMessageTexts(messages);
    expect(parts).toEqual([
      { messageIndex: 0, partPath: 0, text: "alice@example.com" },
      { messageIndex: 0, partPath: 2, text: "hello" },
    ]);
    applyRedactedTexts(messages, parts, ["[EMAIL_1]", "[GREETING]"]);
    const content = messages[0].content as Array<{ type: string; text?: string }>;
    expect(content[0].text).toBe("[EMAIL_1]");
    expect(content[1]).toEqual({ type: "image_url", image_url: { url: "https://x" } });
    expect(content[2].text).toBe("[GREETING]");
  });

  it("opt-out: when no peyeeye-related work happens (no text parts), returns empty", () => {
    const messages = [
      { role: "user", content: "" },
      {
        role: "assistant",
        content: [{ type: "image_url", image_url: { url: "https://x" } }],
      },
    ];
    const parts = collectMessageTexts(messages);
    expect(parts).toEqual([]);
  });

  it("throws when applying mismatched redacted-text count", () => {
    const messages = [
      { role: "user", content: "a" },
      { role: "user", content: "b" },
    ];
    const parts = collectMessageTexts(messages);
    expect(() =>
      applyRedactedTexts(messages, parts, ["only-one"])
    ).toThrow(PEyeEyeAPIError);
  });
});
