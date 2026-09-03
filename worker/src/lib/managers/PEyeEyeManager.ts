/**
 * Peyeeye PII redaction & rehydration manager.
 *
 * Pre-call: redact every text-bearing chunk in the request body so PII never
 * reaches the upstream LLM provider. Post-call: rehydrate the model's
 * response by swapping the placeholder tokens back to the original values.
 *
 * Two session modes:
 *   - "stateful" (default): peyeeye stores the token -> value mapping under a
 *     `ses_...` id; rehydrate references the id, and the manager DELETEs the
 *     session after rehydrate.
 *   - "stateless": peyeeye returns a sealed `skey_...` AEAD blob; nothing is
 *     retained server-side.
 *
 * Brand note: the class is `PEyeEyeManager` (P-Eye-Eye) so the brand is
 * legible in code; snake-case identifiers and prose stay `peyeeye`.
 */

const DEFAULT_API_BASE = "https://api.peyeeye.ai";
const REQUEST_TIMEOUT_MS = 15_000;

export class PEyeEyeAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PEyeEyeAPIError";
  }
}

export class PEyeEyeMissingSecretsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PEyeEyeMissingSecretsError";
  }
}

export type PEyeEyeSessionMode = "stateful" | "stateless";

export interface PEyeEyeManagerOptions {
  apiKey: string;
  apiBase?: string;
  locale?: string;
  entities?: string[];
  sessionMode?: PEyeEyeSessionMode;
  // Injectable for tests.
  fetchImpl?: typeof fetch;
}

export interface PEyeEyeRedactResult {
  redacted: string[];
  sessionId: string | null;
}

interface RedactResponse {
  text?: string | string[];
  session_id?: string;
  session?: string;
  rehydration_key?: string;
}

interface RehydrateResponse {
  text?: string;
  replaced?: number;
}

export class PEyeEyeManager {
  private readonly apiKey: string;
  private readonly apiBase: string;
  private readonly locale: string;
  private readonly entities: string[] | undefined;
  private readonly sessionMode: PEyeEyeSessionMode;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: PEyeEyeManagerOptions) {
    if (!opts.apiKey) {
      throw new PEyeEyeMissingSecretsError(
        "Peyeeye API key is required. Set the PEYEEYE_API_KEY environment variable."
      );
    }
    this.apiKey = opts.apiKey;
    this.apiBase = (opts.apiBase ?? DEFAULT_API_BASE).replace(/\/+$/, "");
    this.locale = opts.locale ?? "auto";
    this.entities =
      opts.entities && opts.entities.length > 0 ? opts.entities : undefined;
    this.sessionMode = opts.sessionMode ?? "stateful";
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  /**
   * Redact a list of text strings via /v1/redact. The returned `redacted`
   * array is the SAME LENGTH as `texts` -- if peyeeye returns a different
   * count or an unexpected shape, this throws rather than silently
   * forwarding unredacted text.
   */
  async redact(texts: string[]): Promise<PEyeEyeRedactResult> {
    if (texts.length === 0) {
      return { redacted: [], sessionId: null };
    }

    const body: Record<string, unknown> = {
      text: texts,
      locale: this.locale,
    };
    if (this.entities) {
      body.entities = this.entities;
    }
    if (this.sessionMode === "stateless") {
      body.session = "stateless";
    }

    const payload = await this.post<RedactResponse>("/v1/redact", body);

    const out = payload.text;
    let redacted: string[];
    if (typeof out === "string") {
      redacted = [out];
    } else if (Array.isArray(out)) {
      redacted = out.map((x) => String(x));
    } else {
      throw new PEyeEyeAPIError(
        "peyeeye /v1/redact returned unexpected response shape; refusing to forward unredacted text"
      );
    }

    // Length-guard the zip: refuse to forward partially-redacted data.
    if (redacted.length !== texts.length) {
      throw new PEyeEyeAPIError(
        `peyeeye /v1/redact returned ${redacted.length} texts for ${texts.length} inputs; ` +
          "refusing to forward partially-redacted data"
      );
    }

    const sessionId =
      this.sessionMode === "stateless"
        ? (payload.rehydration_key ?? null)
        : (payload.session_id ?? payload.session ?? null);

    return { redacted, sessionId };
  }

  /**
   * Rehydrate a single text string against the given session id (`ses_...`)
   * or sealed key (`skey_...`). Best-effort: on failure returns the input
   * unchanged so the user still gets something.
   */
  async rehydrate(text: string, sessionId: string): Promise<string> {
    if (!text) return text;
    try {
      const payload = await this.post<RehydrateResponse>("/v1/rehydrate", {
        text,
        session: sessionId,
      });
      return typeof payload.text === "string" ? payload.text : text;
    } catch (err) {
      console.warn("peyeeye: rehydrate failed", err);
      return text;
    }
  }

  /**
   * Best-effort: drop a stateful session server-side. Stateless `skey_...`
   * blobs hold no server state, so this is a no-op for them.
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!sessionId.startsWith("ses_")) return;
    const url = `${this.apiBase}/v1/sessions/${encodeURIComponent(sessionId)}`;
    try {
      await this.fetchImpl(url, {
        method: "DELETE",
        headers: this.headers(),
        signal: timeoutSignal(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      console.warn("peyeeye: best-effort session cleanup failed", err);
    }
  }

  // -------------------------------------------------------------- internals

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.apiBase}${path}`;
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: timeoutSignal(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      if (err instanceof PEyeEyeAPIError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new PEyeEyeAPIError(`peyeeye ${path} failed: ${message}`);
    }

    if (!response.ok) {
      const status = response.status;
      if (status === 401) {
        throw new PEyeEyeMissingSecretsError("Invalid peyeeye API key");
      }
      if (status === 429) {
        throw new PEyeEyeAPIError("peyeeye rate limit exceeded");
      }
      throw new PEyeEyeAPIError(`peyeeye ${path} returned ${status}`);
    }

    try {
      return (await response.json()) as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new PEyeEyeAPIError(
        `peyeeye ${path} returned non-JSON body: ${message}`
      );
    }
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }
}

function timeoutSignal(ms: number): AbortSignal {
  // AbortSignal.timeout exists on modern runtimes (Cloudflare Workers, Node 18+).
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return (
      AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }
    ).timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// ---------------------------------------------------------- message helpers

export type ChatMessage = {
  role?: string;
  // Either a plain string or a multimodal content list.
  content?:
    | string
    | Array<{ type?: string; text?: string; [k: string]: unknown }>;
  [k: string]: unknown;
};

/**
 * `(messageIndex, partPath, text)` triples for every text-bearing chunk in a
 * chat-completion-style messages array. `partPath` is `"content"` for the
 * plain-string case, or an integer index into a multimodal `content` list.
 */
export type TextPart = {
  messageIndex: number;
  partPath: "content" | number;
  text: string;
};

export function collectMessageTexts(messages: ChatMessage[]): TextPart[] {
  const out: TextPart[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") continue;
    const content = msg.content;
    if (typeof content === "string") {
      if (content.length > 0) {
        out.push({ messageIndex: i, partPath: "content", text: content });
      }
    } else if (Array.isArray(content)) {
      for (let j = 0; j < content.length; j++) {
        const part = content[j];
        if (part && typeof part === "object" && part.type === "text") {
          const t = typeof part.text === "string" ? part.text : "";
          if (t.length > 0) {
            out.push({ messageIndex: i, partPath: j, text: t });
          }
        }
      }
    }
  }
  return out;
}

export function applyRedactedTexts(
  messages: ChatMessage[],
  parts: TextPart[],
  redacted: string[]
): ChatMessage[] {
  if (parts.length !== redacted.length) {
    throw new PEyeEyeAPIError(
      `peyeeye redacted-text count (${redacted.length}) does not match input count (${parts.length})`
    );
  }
  // Mutate in place; callers pass in their own array.
  for (let k = 0; k < parts.length; k++) {
    const { messageIndex, partPath } = parts[k];
    const value = redacted[k];
    const msg = messages[messageIndex];
    if (!msg) continue;
    if (partPath === "content") {
      msg.content = value;
    } else if (Array.isArray(msg.content)) {
      const part = msg.content[partPath];
      if (part && typeof part === "object") {
        part.text = value;
      }
    }
  }
  return messages;
}
