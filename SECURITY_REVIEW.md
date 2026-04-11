# Helicone Security Review

**Date:** 2026-04-11
**Branch:** `claude/security-review-helicone-BGyoG`
**Scope:** Full monorepo — `web/`, `valhalla/jawn/`, `worker/`, `aigateway/`, `packages/`, `supabase/`, `clickhouse/`, Docker/deployment config.

> This review was performed by static analysis. Findings are prioritized by impact. Each finding cites the specific file and line so an engineer can verify it directly. Severity levels: **Critical / High / Medium / Low / Info**. Items tagged `[POS]` are positive observations.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Secrets, Credentials & Logging](#1-secrets-credentials--logging)
3. [Authentication & Authorization (Jawn)](#2-authentication--authorization-jawn)
4. [Proxy / Gateway (Worker + aigateway)](#3-proxy--gateway-worker--aigateway)
5. [Frontend (Next.js `web/`)](#4-frontend-nextjs-web)
6. [Database Layer (Postgres + ClickHouse)](#5-database-layer-postgres--clickhouse)
7. [Storage, Uploads, Webhooks & Outbound HTTP](#6-storage-uploads-webhooks--outbound-http)
8. [Remediation Priority](#remediation-priority)

---

## Executive Summary

_To be finalized once all section reviews complete._

---

## 1. Secrets, Credentials & Logging

### 1.1 [HIGH] Hardcoded default credentials in production-shaped deployment config

**Files:**
- `docker/docker-compose.yml:14, 58-59, 77, 118, 151-152, 166, 187, 225-226, 240, 267, 307-308, 335-336, 362-363`
- `supervisord.conf:44, 55, 82, 102`
- `Dockerfile:39, 146, 151-152, 162`

Default/placeholder credentials are hardcoded in Docker Compose, the Dockerfile, and supervisord.conf. These files are shaped like production deployment artifacts even though they are intended for development.

```yaml
# docker/docker-compose.yml
POSTGRES_PASSWORD: testpassword
POSTGRES_USER: postgres
MINIO_ROOT_USER: minioadmin
MINIO_ROOT_PASSWORD: minioadmin
```

```dockerfile
# Dockerfile:162
ENV BETTER_AUTH_SECRET=change-me-in-production
```

**Impact.** If a deployer copy-pastes one of these files as the starting point for production, they inherit trivially-guessable database and object-store credentials and (worse) a publicly-known auth-signing secret.

**Fix.** Remove literal secrets entirely — rely on `.env.example` + required-variable checks. Fail fast in the entrypoint if `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD`, etc. are unset or equal to the default string.

---

### 1.2 [HIGH] `BETTER_AUTH_SECRET` falls back to a known literal

**Files:**
- `docker/docker-compose.yml:165, 195, 239, 275`
- `Dockerfile:162`

```yaml
BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET:-your-secret-key}
```

If the env var is unset, Better Auth signs session cookies / JWTs with the literal string `your-secret-key` — an attacker who knows this (anyone reading the repo) can forge arbitrary sessions.

**Fix.** Drop the `:-` fallback. Let the container refuse to start until an operator provides a real secret.

---

### 1.3 [HIGH] Provider (BYOK) keys inserted in plaintext; relies on DB trigger for encryption

**File:** `valhalla/jawn/src/managers/apiKeys/KeyManager.ts:334-348`

```ts
const result = await dbExecute<{ id: string }>(
  `INSERT INTO provider_keys (provider_name, provider_key_name, provider_key, provider_secret_key, org_id, soft_delete, config, cuid, byok_enabled)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
   RETURNING id`,
  [providerName, providerKeyName, providerKey, providerSecretKey, ...]
);
```

The customer-owned OpenAI / Anthropic / etc. key is sent to Postgres in plaintext. A `pgsodium` trigger re-encrypts on insert (`supabase/migrations/20250915234553_provider_key_encryption_fix.sql`), but until the trigger runs the plaintext exists in:
- Postgres write-ahead logs,
- replication streams,
- any `pg_stat_statements` / query-log capture,
- backup snapshots taken mid-insert.

**[POS]** The encryption migration uses `pgsodium.crypto_aead_det_encrypt` with `org_id` as additional-authenticated-data (prevents cross-org decryption) and transparent reads via `decrypted_provider_keys_v2`.

**Fix.** Encrypt application-side before the `INSERT`. At minimum, redact `provider_key` / `provider_secret_key` from any query logging / APM capture.

---

### 1.4 [MEDIUM] `Math.random()` used in security-adjacent paths

**Files:**
- `valhalla/jawn/src/managers/prompt/PromptManager.ts:73` — random prompt ID generation
- `valhalla/jawn/src/lib/handlers/RateLimitHandler.ts:83, 92, 154` — probabilistic free-tier checks
- `valhalla/jawn/src/controllers/public/piController.ts:38` — 10% chance session-table cleanup

```ts
// PromptManager.ts
private generateRandomPromptId(): string {
  const chars = '0123456789abcdef...XYZ';
  let result = '';
  for (let i = 0; i < PROMPT_ID_LENGTH; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
```

`Math.random()` is a predictable PRNG. Prompt IDs are used in URLs and may be treated as capability handles; predictable generation enables enumeration.

**Fix.** Use `crypto.randomUUID()` or `crypto.randomBytes(...).toString('base64url')`.

---

### 1.5 [MEDIUM] SMTP TLS verification disabled for `NODE_ENV=development`

**File:** `web/lib/auth.ts:27-31`

```ts
tls:
  process.env.SMTP_HOST?.includes("mailhog") ||
  process.env.NODE_ENV === "development"
    ? { rejectUnauthorized: false }
    : undefined,
```

Disabling TLS verification for _any_ dev environment is too broad — a staging build that happens to set `NODE_ENV=development` and connects to a real SMTP is MITM-able.

**Fix.** Gate the relaxation on `SMTP_HOST` containing `mailhog` (or `localhost`) only.

---

### 1.6 [MEDIUM] Supervisord and child programs run as root

**File:** `supervisord.conf:3, 42, 53, 81, 102, 110`

```ini
[supervisord]
nodaemon=true
user=root

[program:jawn]
user=root
[program:web]
user=root
[program:minio]
user=root
[program:ai-gateway]
user=root
```

Every in-container service runs with UID 0. Any code-exec bug in Jawn or the gateway is immediately a container-root compromise.

**Fix.** Create dedicated low-privilege users per service; drop Linux capabilities in the container runtime.

---

### 1.7 [LOW] API-key hashing uses SHA-256 (not a KDF)

**File:** `valhalla/jawn/src/utils/hash.ts:1-24`

```ts
export async function hashAuth(key: string): Promise<string> {
  key = `Bearer ${key}`;
  const hashedKey = await crypto.subtle.digest({ name: "SHA-256" }, encoder.encode(key));
  // -> hex
}
```

SHA-256 is fast; API-key lookups that compare a SHA-256 of the submitted key to a stored digest are acceptable only when the key itself has high entropy (e.g. 256-bit random). The `"Bearer "` prefix is not a salt. No rate-limit or constant-time comparison is visible here.

**[POS]** Proxy keys in `KeyManager.ts:556` use `pgsodium.crypto_pwhash_str` (Argon2), which is the correct primitive.

**Fix.** Either use `pgsodium.crypto_pwhash_str` consistently, or document that Helicone API keys are cryptographically-random ≥128-bit strings (so a plain hash is fine) and use `crypto.timingSafeEqual` when comparing.

---

### 1.8 [POS] No real secrets checked into git

A sweep for `sk-…`, `AKIA…`, `-----BEGIN …PRIVATE KEY-----`, etc. in tracked files turned up only placeholder/dummy values. Developers are following the `.env` pattern.

### 1.9 [POS] `NEXT_PUBLIC_*` variables do not leak private credentials

`NEXT_PUBLIC_HELICONE_JAWN_SERVICE`, `NEXT_PUBLIC_BETTER_AUTH`, `NEXT_PUBLIC_SLACK_CLIENT_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_POSTHOG_API_KEY` — all appropriate for client exposure.

### 1.10 [POS] Error messages are re-wrapped before returning to clients

No instances of leaking raw `err.message` / `err.stack` from DB or provider errors were observed; Jawn managers consistently return `err("Failed to …")` style strings.

---

## 2. Authentication & Authorization (Jawn)

### 2.1 [CRITICAL] PI session endpoint mints an API key for any org whose `sessionUUID` you guess — IDOR → full account takeover

**Files:**
- `valhalla/jawn/src/controllers/public/piPublicController.ts:12-68`
- `valhalla/jawn/src/controllers/public/piController.ts`

```ts
const sessionResult = await dbExecute<{ organization_id: string }>(
  `SELECT organization_id FROM pi_session
   WHERE session_id = $1
   AND created_at > $2
   LIMIT 1`,
  [body.sessionUUID, one_hour_ago.toISOString()]
);

if (!sessionResult.data || sessionResult.data.length === 0) {
  this.setStatus(404);
  return err("Session not found");
}

const apiKey = await generateHeliconeAPIKey(
  sessionResult.data[0].organization_id,   // ← no ownership check
  "Auto Generated PI Key",
  "rw"
);
```

`POST /v1/public/pi/get-api-key` accepts a client-supplied `sessionUUID`, looks up the corresponding row, and mints a new **read/write** Helicone API key for whatever organization the row points at. There is:

- no verification that the caller created the session,
- no check that the session is bound to the caller's IP / device / user,
- no rate limiting on session lookups,
- a 1-hour validity window that starts from the session creator's `created_at`.

Any attacker who obtains a session UUID — e.g. via logs, referrer leakage, screen share, a compromised mobile client, or brute force — gets a fresh `rw` API key for the victim org. With that key they can read every logged request/response (which often contains sensitive end-user data), modify prompts, delete data, and rack up provider-key usage costs.

**Fix.** Add `created_by_user_id` to `pi_session`, require the request to carry proof of the same user (authenticated session cookie / JWT), and validate both the UUID *and* the user match. As a defense in depth, bind the session to a second high-entropy secret that's only returned to the creator (not derivable from the UUID alone).

---

### 2.2 [HIGH] Helicone API keys hashed with bare SHA-256, no salt, no KDF

**File:** `valhalla/jawn/src/lib/db/hash.ts` / `valhalla/jawn/src/utils/hash.ts`

```ts
export async function hashAuth(key: string): Promise<string> {
  key = `Bearer ${key}`;
  const hashedKey = await crypto.subtle.digest(
    { name: "SHA-256" },
    encoder.encode(key),
  );
  // → hex
  return res;
}
```

`hashAuth()` is the sole protection for `helicone_api_keys`. If that table is ever exfiltrated, every stored key is crackable at GPU speeds:

- SHA-256 is not a password hash — there's no work factor.
- The prefix `"Bearer "` is a fixed salt, not a per-row salt — rainbow tables are possible.
- The API-key alphabet is base32 (see §2.7 below), reducing the cracking search space.

Because Helicone keys grant full org access, this is a "breach → full key compromise" exposure.

**Fix.** Migrate to `pgsodium.crypto_pwhash_str` (already used for proxy keys — `KeyManager.ts:556`) or bcrypt. Since rehashing on login isn't possible for API keys, run a background job that replaces the stored hash with the KDF result the next time each key is used.

---

### 2.3 [HIGH] Logging endpoint has effectively no rate limit; unauthenticated rate-limit keys are spoofable

**File:** `valhalla/jawn/src/middleware/ratelimitter.ts:15-59`

```ts
keyGenerator: (req) => {
  return (
    (req as JawnAuthenticatedRequest)?.authParams?.organizationId ??
    req.ip ??                                    // spoofable
    "unknown"
  );
},
limit: (req) => {
  if (req.path.startsWith("/v1/log")) {
    return 10_000_000;                           // effectively unlimited
  }
  // free: 1_000 / 5 min, pro: 10_000, ent: 100_000
}
```

Two issues:

1. `/v1/log/*` skips the normal quota (`10_000_000` / window). A single misconfigured or malicious proxy-key holder can bury the DB logger and ClickHouse ingest with junk, and the free-tier counters don't push back.
2. For requests that fail auth — the path auth-brute-force attackers use — the key falls back to `req.ip`. Behind Cloudflare/any L7 LB this is a header (`x-forwarded-for`) that's trivial to rotate, defeating the limit entirely.

**Fix.** Keep a low absolute cap on `/v1/log/*` per org, and for unauthenticated requests key on `(route, true-client-ip)` using Cloudflare's `CF-Connecting-IP` (not `X-Forwarded-For`).

---

### 2.4 [MEDIUM] Webhook HMAC key is allowed to be empty / null

**Files:**
- `valhalla/jawn/src/lib/clients/webhookSender.ts:121-239`
- `valhalla/jawn/src/controllers/public/webhookController.ts:29-94`

```ts
const hmacKey = webhook.hmac_key ?? "";     // null → empty string
const hmac = createHmac("sha256", hmacKey);
```

A webhook row with `hmac_key = NULL` (or with `""` from a legacy migration) produces a signature derived from an empty secret. Any attacker who can reach the webhook receiver can then forge valid payloads — the "signature" becomes `HMAC("", body)`, which is public knowledge.

**Fix.** Enforce `NOT NULL` and `length >= 32` at the DB and at the manager. Rotate existing empty keys with random 32-byte secrets and surface a "rotate HMAC" action in the UI.

---

### 2.5 [MEDIUM] Reseller customer-list endpoint admits access whenever the guessed `resellerId` matches the caller's own org id

**File:** `valhalla/jawn/src/controllers/private/organizationController.ts:173-206`

```ts
const resellerCheck = await dbExecute<{ reseller_id: string }>(
  `SELECT reseller_id FROM organization WHERE id = $1 AND soft_delete = false`,
  [orgId],
);
if (!resellerCheck.data?.length || resellerCheck.data[0].reseller_id !== resellerId) {
  const isReseller = await dbExecute<{ id: string }>(
    `SELECT id FROM organization WHERE id = $1 AND reseller_id = $2 AND soft_delete = false`,
    [orgId, resellerId],
  );
  if (!isReseller.data?.length) {
    this.setStatus(403);
    return err("Not authorized");
  }
}
```

The "am I a reseller?" fallback reuses `resellerId` as both the URL parameter *and* the filter, which allows an attacker to list customers of any reseller whose id they can guess, as long as they themselves belong to that reseller (a natural condition for any of their sub-accounts). Error cases also leak existence (404 vs 403).

**Fix.** Fetch the caller's `reseller_id` once, then require the URL parameter to equal it; return a single generic 403 on any mismatch.

---

### 2.6 [MEDIUM] JWT auth uses a client-supplied `orgId` header for multi-org membership lookup

**File:** `valhalla/jawn/src/packages/common/toImplement/server/BetterAuthWrapper.ts:141-162`

```ts
async authenticate(auth: HeliconeAuth, headers?: GenericHeaders) {
  if (auth._type === "jwt") {
    const user = await this.getUser(auth, headers);
    const org = await dbExecute(
      `SELECT organization.*, organization_member.org_role as role
         FROM organization
         LEFT JOIN organization_member ON organization_member.organization = organization.id
         WHERE organization.id = $1
           AND organization_member.member = $2
         LIMIT 1`,
      [auth.orgId, user.data?.id],                 // ← orgId from request header
    );
  }
}
```

Intended behaviour: user can switch between orgs. Risk: the user's `orgId` is taken from a request header and used verbatim in the WHERE clause. If any downstream code path trusts `authParams.organizationId` without first checking a membership table (some managers only rely on the wrapper), a user who is a member of two orgs can move requests from org B into org A's context by flipping the header. This is tolerable *if* every access is gated by the DB query above — but if a new endpoint ever reads `authParams.organizationId` without going through the wrapper, the wrong org will be used.

**Fix.** Cache membership per-user and require the `orgId` to be server-validated on every controller invocation. Add a test that rejects a user-supplied `orgId` the user isn't a member of.

---

### 2.7 [LOW] API-key alphabet is base32, shrinking the effective keyspace

**File:** `valhalla/jawn/src/managers/apiKeys/KeyManager.ts:184-237`

```ts
const apiKey = `sk-helicone${IS_EU ? "-eu" : ""}-${generateApiKey({
  method: "base32",
  dashes: true,
}).toString()}`.toLowerCase();
```

Base32 encodes 5 bits/char; the same visual length in base64url is 6 bits/char. Combined with `toLowerCase()` (which collapses any upper-case variant), the key is noticeably weaker than it looks. Still within safe territory (~140 bits) for uniform random keys, but makes #2.2 (SHA-256 hashing) worse if breached.

**Fix.** Use `crypto.randomBytes(32).toString('base64url')`.

---

### 2.8 [LOW] CORS allows requests with no `Origin` header

**File:** `valhalla/jawn/src/index.ts:75-94`

```ts
if (!origin) {
  // Allow requests with no origin (like server-to-server, curl)
  callback(null, true);
  return;
}
```

Deliberate, but it widens the surface for credential-cookie replay from non-browser clients. Consider gating this branch on a specific header or reserving it for explicitly public endpoints.

---

### 2.9 [POS] Authorization is correctly enforced at the controller layer

- `authParams.organizationId` is derived from the validated session/API key in `index.ts:191`, not from request body/query params.
- Controllers use `authParams.organizationId` when building DB filters, e.g. `organizationController.ts:152-157` joins on `organization_member.member = $1 or organization.owner = $1`.
- RBAC for destructive ops checks `owner`/`admin` in `OrganizationManager.ts:158-163`.
- Permission-scoped API keys honour `r`/`w`/`rw` via HTTP method in `auth.ts:104-113`.

### 2.10 [POS] Webhook outbound SSRF prevention

`webhookSender.ts:11-76` validates destinations, blocks RFC1918/loopback/metadata ranges, and enforces HTTPS. This is the right pattern — it's just undone by §2.4.

### 2.11 [POS] Admin routes require JWT only, with an explicit allow-list

`auth.ts:142-149` forces JWT for `/v1/admin/*` (API keys are rejected), and `adminController.authCheckThrow` is invoked for every admin path except the narrow `has-feature-flag` exception.

### 2.12 [POS] Public-route allow-list is explicit and tiny

`index.ts:191` has an explicit 7-route public allow-list. New controllers default to requiring auth.

---

---

## 3. Proxy / Gateway (Worker + aigateway)

### 3.1 [CRITICAL] SSRF via `baseURLOverride` bypasses domain allow-list

**File:** `worker/src/lib/models/HeliconeProxyRequest.ts:219-220`

```ts
private getApiBase(): Result<string, string> {
  if (this.request.baseURLOverride) {
    return ok(this.request.baseURLOverride);   // ← no validation
  }
  const api_base =
    this.request.heliconeHeaders.openaiBaseUrl ??
    this.request.heliconeHeaders.targetBaseUrl;
  if (api_base && !this.validateApiConfiguration(api_base)) {
    return { data: null, error: `Invalid API base "${api_base}"` };
  }
  ...
}
```

When `baseURLOverride` is populated on a `RequestWrapper`, the call skips `validateApiConfiguration()` entirely. If any user-controllable path can set this field — e.g. proxy-key config, a custom-model endpoint, or a provider-router rule — the proxy will fetch arbitrary URLs on the caller's behalf:

- `http://169.254.169.254/latest/meta-data/…` (AWS IMDS credentials)
- `http://localhost:<internal-port>/admin`
- `http://10.x.x.x/…` RFC1918 reachable from the worker
- `file://` schemes (depending on fetch impl)

**Fix.** Run `validateApiConfiguration(this.request.baseURLOverride)` before returning it, same as the other branch.

---

### 3.2 [CRITICAL] `helicone-fallbacks` target URLs are not validated against `approvedDomains`

**File:** `worker/src/lib/models/HeliconeHeaders.ts:229-279` (parser), and the usage in `worker/src/routers/gatewayRouter.ts` (fallback execution)

```ts
return parsedFallBacks.map((fb) => {
  if (!fb["target-url"] || !fb.headers || !fb.onCodes) {
    throw new Error("helicone-fallbacks must have target-url, headers, and onCodes");
  }
  if (typeof fb["target-url"] !== "string") {
    throw new Error("helicone-fallbacks target-url must be a string");
  }
  // ← nothing checks fb["target-url"] against approvedDomains
  return {
    "target-url": fb["target-url"],
    headers: fb.headers,
    onCodes: fb.onCodes,
    bodyKeyOverride: fb.bodyKeyOverride,
  };
});
```

Any client can send

```json
helicone-fallbacks: [{"target-url":"http://169.254.169.254/","headers":{},"onCodes":[500]}]
```

…and if the primary provider returns one of `onCodes`, the worker performs the fallback fetch. Combined with arbitrary `headers`, this is a full SSRF primitive with header injection.

**Fix.** Apply the same `approvedDomains` regex check that `validateApiConfiguration()` uses (`packages/cost/providers/mappings.ts:32-328`) to every fallback URL at parse time.

---

### 3.3 [HIGH] Authorization header is forwarded (and logged) by default

**File:** `worker/src/lib/clients/ProviderClient.ts:36-50, 144`

```ts
function removeHeliconeHeaders(request: Headers, removeAuth = false): Headers {
  const newHeaders = new Headers();
  for (const [key, value] of request.entries()) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.startsWith("helicone-")) continue;
    if (removeAuth && lowerKey === "authorization") continue;
    newHeaders.set(key, value);
  }
  return newHeaders;
}
// …
const removedHeaders = removeHeliconeHeaders(headers);   // removeAuth defaults to false
```

Call sites don't pass `removeAuth=true`, so provider API keys stay on the request. That is expected for upstream calls, but the same `Headers` objects are logged downstream (DB logger / S3 / Kafka) without header sanitization. Any provider that echoes the Authorization header in an error body — or any request body field that contains a key — ends up durably stored.

**Fix.** Add a dedicated `sanitizeHeadersForLogging()` that drops `authorization`, `x-api-key`, `api-key`, `cookie`, `helicone-auth`, and `helicone-proxy-key`. Scrub response bodies with a regex pass before persisting to S3.

---

### 3.4 [HIGH] Cache lookup picks a *random* entry from the bucket

**File:** `worker/src/lib/util/cache/cacheFunctions.ts:33-66`

```ts
export async function getCachedResponse(
  request: HeliconeProxyRequest,
  settings: { bucketSize: number },
  cacheKv: KVNamespace,
  cacheSeed: string | null,
) {
  ...
  const cacheIdx = Math.floor(Math.random() * requestCaches.length);
  const randomCache = requestCaches[cacheIdx];
  ...
}
```

Entries within the bucket share the same cache key. The cache key does include a hash of the Authorization header, so in principle entries are per-caller — but if any code path ever stores an entry under a key that isn't fully caller-scoped (e.g. a test key rotation, or a request with a `cacheSeed` overlap), a user's request can deterministically return another user's cached response. The use of `Math.random()` means this isn't even reproducible.

**Fix.** (a) Always include the authenticated `orgId` (from the validated session/API key, not from the raw header) in the cache key derivation. (b) Pick cache entries deterministically, e.g. return the newest entry, or key each bucket slot by `(orgId, seed, seq)`.

---

### 3.5 [MEDIUM] SSE/stream parser has no line-length or total-size bound

**File:** `worker/src/lib/dbLogger/streamParsers/openAIStreamParser.ts:3-16`

```ts
export async function parseOpenAIStream(result: string) {
  const lines = result.split("\n").filter(...)
    .filter((line) => line !== "");
  const data = lines.map((line, i) => {
    if (i === lines.length - 1) return {};
    try {
      return JSON.parse(line.replace("data:", ""));  // no size cap
    } catch (e) {
      console.error("Error parsing line", line);
      return {};
    }
  });
}
```

A hostile upstream (or a user acting as one via `helicone-fallbacks`) can return a single giant SSE line and push the worker into OOM or long parse times.

**Fix.** Reject any line > 64 KiB and cap the total parsed size per request.

---

### 3.6 [MEDIUM] No per-request `messages[]` count / cumulative body-size cap

**File:** `worker/src/RequestBodyBuffer/RequestBodyBufferBuilder.ts:94-103`

```ts
const MAX_INMEMORY_BYTES = 20 * 1024 * 1024; // 20 MiB
if (contentLength > MAX_INMEMORY_BYTES) {
  // spill to S3 …
}
```

A single body is bounded, but:
- Nothing caps the number of `messages` in a chat request → parsers and DB logger loop on attacker-chosen N.
- No cumulative per-org body-size budget → floods of 20 MiB requests are accepted.

**Fix.** Add a `MAX_MESSAGES` check and a sliding-window body-size quota per org.

---

### 3.7 [POS] `approvedDomains` regex list is strict and HTTPS-only

**File:** `packages/cost/providers/mappings.ts:32-328`

The main allow-list is narrow (per-provider regex, HTTPS only, anchored). This is a solid base — issues 3.1 and 3.2 are about code paths that go *around* it.

### 3.8 [POS] Helicone-auth and provider auth are split correctly

**File:** `worker/src/lib/RequestWrapper.ts:87-151`

`Authorization: Bearer <provider>, Bearer <helicone>` is correctly parsed by `mutatedAuthorizationHeaders()` into a provider token kept on `authorization` and a Helicone token moved to `helicone-auth`. Provider creds never get stored in a Helicone-auth-labeled field.

### 3.9 [POS] prompt/session IDs are correctly tenant-scoped

**File:** `worker/src/routers/generateRouter.ts:470-479`

Lookups filter on `organization = orgId` *and* `user_defined_id = promptId`, so a guessed prompt ID from another org does not resolve. Good.

---

---

## 4. Frontend (Next.js `web/`)

### 4.1 [HIGH] No HTTP security headers configured

**File:** `web/next.config.js`

No `headers()` function is defined; no CSP, no `X-Frame-Options`, no HSTS, no `X-Content-Type-Options`, no `Referrer-Policy`. This is a general hardening gap:

- Without CSP, any future XSS (or any sanitization-library bug) has unrestricted capability.
- Without `X-Frame-Options` / `frame-ancestors`, the dashboard can be iframed → clickjacking against billing, key-management, and admin flows.
- Without HSTS, downgrade attacks are possible on first visit.

**Fix.** Add:

```js
async headers() {
  return [{
    source: "/:path*",
    headers: [
      { key: "Content-Security-Policy",
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'none'" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    ],
  }];
}
```

---

### 4.2 [MEDIUM] `ReactMarkdown` relies on library defaults — no explicit sanitization

**Files:**
- `web/components/templates/agent/MessageRenderer.tsx:55-59, 152-157, 235-240`
- `web/components/shared/prompts/ResponsePanel.tsx:128-191` (custom components)

`ReactMarkdown` v9 strips raw HTML by default, but the custom `components` override map (e.g. the `a` and `img` renderers) does not validate hrefs / src schemes, so `javascript:` or `data:text/html` URLs flow through the overridden link renderer.

**Fix.** Either pass an explicit rehype plugin (`rehype-sanitize` with a strict schema), or in the custom `a` component validate `href`:

```ts
a: ({ href, children, ...rest }) => {
  const safe = href && /^(https?:|mailto:|\/|#)/.test(href);
  return safe ? <a href={href} {...rest}>{children}</a> : <span>{children}</span>;
}
```

---

### 4.3 [MEDIUM] Unvalidated image URLs in agent message renderer

**File:** `web/components/templates/agent/MessageRenderer.tsx:85-88, 181-185`

```tsx
{message.content
  .filter((item: any) => item.type === "image_url")
  .map((item: any, index: number) => (
    <img src={item.image_url.url} alt={`Image ${index + 1}`} />
  ))}
```

`item.image_url.url` originates from logged LLM request/response content — i.e. attacker-controlled. Although `<img src>` won't execute JS, `data:image/svg+xml` can carry scripts and trigger XSS in some browsers, and any scheme can be used as an exfil beacon for viewing-user state (org cookies are same-site, but path info and referrer still leak).

**Fix.** Enforce `http:`/`https:` in a util and fall back to a placeholder:

```ts
const isSafeImg = (u: string) => {
  try { return ["http:", "https:"].includes(new URL(u).protocol); }
  catch { return false; }
};
```

---

### 4.4 [LOW] ESLint disabled at build time

**File:** `web/next.config.js:11-13`

```js
eslint: { ignoreDuringBuilds: true },
```

Security-relevant lint rules (`react/no-danger`, `jsx-no-script-url`, `no-eval`, etc.) won't block merges. Minor, but removes a backstop.

---

### 4.5 [POS] `dangerouslySetInnerHTML` usages are properly sanitized

Every one of the five call sites observed runs content through DOMPurify first:

| File | Policy |
|---|---|
| `web/components/shared/CodeHighlighter.tsx:30-33` | allow `pre, code, span, div` + `class/style/data-*` |
| `web/components/templates/requests/components/error/ErrorMessage.tsx:10-15` | strip **all** tags |
| `web/components/layout/ChangelogModal.tsx:40` | DOMPurify default |
| `web/components/shared/themed/demo/textbookCourse.tsx:74-79` | DOMPurify default |
| `web/lib/sanitizeContent.ts` (`stripDangerousHtml`) | regex strip before markdown render |

The `ErrorMessage` renderer in particular is the safe pattern — strip everything.

### 4.6 [POS] All checked Next.js API routes are wrapped with `withAuth`

`web/pages/api/proxy_keys/create.ts`, `web/pages/api/proxy_keys/[id]/delete.ts`, `web/pages/api/user/checkOnboarded.ts` all go through `withAuth(handler, [Permission.MANAGE_KEYS])` or similar. The wrapper pulls `orgId` from the validated session (not from the request body) and all DB mutations scope to that `orgId`, which is the correct pattern.

### 4.7 [POS] OAuth `state` parameter validated on the Slack callback

**File:** `web/pages/slack/redirect.tsx:29-63` — `state` is checked against `organization.id` in Postgres before the OAuth exchange proceeds. Prevents cross-org OAuth CSRF.

### 4.8 [POS] Secrets vs. `NEXT_PUBLIC_*` discipline is clean

No private keys or signing secrets are exposed under `NEXT_PUBLIC_*`. Only Slack client ID, Supabase anon key, Stripe publishable key, PostHog key — all appropriately public.

### 4.9 [POS] No `window.addEventListener("message", ...)` → no unsafe postMessage

### 4.10 [POS] No query-parameter-driven redirects found → no open-redirect vectors

---

---

## 5. Database Layer (Postgres + ClickHouse)

The baseline posture here is reasonable — Jawn uses parameterized queries consistently via `dbExecute` / the ClickHouse client's `query_params`, and the HQL path enforces `readonly: 1`, `allow_ddl: 0`, and tight execution limits. The issues below are mostly soft spots around *dynamic SQL construction* and *regex-based allow-listing*.

### 5.1 [MEDIUM] HQL keyword blocking is regex-based and bypassable

**File:** `valhalla/jawn/src/lib/db/ClickhouseWrapper.ts:131-138`

```ts
const forbiddenPattern = /sql[_\s]*helicone[_\s]*organization[_\s]*id/i;
if (forbiddenPattern.test(query)) {
  return {
    data: null,
    error: "Query contains 'SQL_helicone_organization_id' keyword, which is not allowed...",
  };
}
```

The HQL layer tries to keep users from referencing the placeholder `SQL_helicone_organization_id` (presumably the mechanism that rewrites queries to enforce org scoping). Regex-based SQL filtering always loses to:

- comments: `SQL/**/_helicone_organization_id`,
- case/whitespace tricks already partly handled,
- string-literal concatenation,
- `char()` / `hex` constructions in `WHERE` predicates,
- multi-statement queries, EXPLAIN, etc.

Combined with `HeliconeSqlManager.ts:64` which does another regex for DML/DDL, this is defense *in layers* but still not defense *in depth* — any bypass goes straight to arbitrary org-context query execution.

**Fix.** Use the `node-sql-parser` AST (already a dep) to reject queries that reference the placeholder identifier or tables outside the allow-list. AST-walk on `From`, `Join`, `Subquery`, `Union`, `With`, and `Columns`. Reject on unknown node types rather than try to blacklist.

---

### 5.2 [MEDIUM] ORDER BY direction / column name validation relies on TypeScript types

**File:** `valhalla/jawn/src/managers/UserManager.ts:87`

```ts
const sortColumn = sortMappings[sortKey as keyof UserMetric];
argsAcc = argsAcc.concat([sortColumn]);
return {
  orderByString: `{val_${argsAcc.length - 1}: Identifier} ${sortDirection}`,
  argsAcc,
};
```

`sortKey as keyof UserMetric` is a compile-time cast; at runtime the value comes from a request and the `as` assertion is a no-op. If `sortMappings[sortKey]` returns `undefined`, ClickHouse will still receive an Identifier bind. `assertValidSortDirection` gates `sortDirection`, but the column branch should also be a strict allow-list check:

```ts
if (!(sortKey in sortMappings)) throw new Error("invalid sort key");
```

Current impact is limited because ClickHouse Identifier binding prevents SQL injection — but an attacker can sort by arbitrary internal columns (information disclosure) or trigger error paths.

---

### 5.3 [MEDIUM] `timeGrain` interpolated directly into a ClickHouse query

**File:** `valhalla/jawn/src/managers/UsageLimitManager.ts:30`

```ts
WHERE (
  request_response_rmt.request_created_at >= DATE_TRUNC('${timeGrain}', now())
)
```

`timeGrain` is type-narrowed to `"minute" | "hour" | "day" | "week" | "month"` in TypeScript, but no runtime guard sits between the controller and this code. If any controller widens the type (e.g. a new endpoint that accepts `string`), this is directly injectable.

**Fix.** Guard at the managers entry:

```ts
if (!["minute","hour","day","week","month"].includes(timeGrain)) {
  throw new Error("invalid timeGrain");
}
```

Same pattern applies to every place that interpolates a "dimension" or "grain" string into a query.

---

### 5.4 [MEDIUM] `SECURITY DEFINER` trigger missing `SET search_path`

**File:** `supabase/migrations/20230803235603_key_management.sql:39-54`

```sql
CREATE OR REPLACE FUNCTION soft_delete_helicone_proxy_keys()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NEW.soft_delete = TRUE THEN
        UPDATE helicone_proxy_keys SET soft_delete = TRUE WHERE provider_key_id = NEW.id;
    END IF;
    RETURN NEW;
END $$;
```

A `SECURITY DEFINER` function without a pinned `search_path` is a classic privilege-escalation vector: an attacker who can create an object in a schema that appears earlier in the caller's `search_path` can shadow `helicone_proxy_keys` and run code as the function owner.

**Fix.** Add `SET search_path = public, pg_temp;` to the function definition. Audit every other `SECURITY DEFINER` function in `supabase/migrations/` for the same omission.

---

### 5.5 [LOW] `USING (true)` policy on `system_config`

**File:** `supabase/migrations/20250408183827_user_signup_tracking.sql`

```sql
CREATE POLICY "Allow postgres access to system_config"
  ON public.system_config FOR ALL TO postgres
  USING (true);
```

Scoped to the `postgres` role only, so in practice limited — but it's still an explicit `USING (true)` next to other tables that have granular policies. At minimum, flag it so future additions don't copy the pattern.

---

### 5.6 [LOW] Single-table HQL allow-list via regex-extracted table names

**File:** `valhalla/jawn/src/managers/HeliconeSqlManager.ts:21, 81`

```ts
const CLICKHOUSE_TABLES = ["request_response_rmt"];
// …
if (!CLICKHOUSE_TABLES.includes(tableName)) { return hqlError(...); }
```

The extraction uses `\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi` and confuses under `FROM (SELECT …)`, CTEs, table-valued functions, and multi-statement queries. Since HQL runs with `readonly: 1` this isn't immediately exploitable, but the single table's authoritative allow-list should be the AST check from §5.1, not a regex pass.

---

### 5.7 [LOW] `TOTAL_TOKENS_EXPR` / `COST_PRECISION_MULTIPLIER` interpolated as literal SQL

**Files:**
- `valhalla/jawn/src/managers/ModelUsageStatsManager.ts:101, 139, 160`
- `valhalla/jawn/src/managers/MetricsManager.ts:314`
- `valhalla/jawn/src/managers/SessionManager.ts:369`
- `valhalla/jawn/src/managers/creditsManager.ts:129` (≥15 sites total)

These are module-level constants today, so there's no injection *today*. Called out because the pattern "constants stitched into queries with template literals" is one refactor away from a vulnerability — any PR that turns one of these into a parameter inherits SQL injection by default.

**Fix.** Move them into a `sql\`...\`` tag helper that rejects non-literal interpolations at the type level, or use ClickHouse parameter substitution for the multiplier.

---

### 5.8 [POS] Consistent parameterized query usage

- Jawn `dbExecute` always takes `(sql, params[])`, never a pre-formatted string with user values.
- ClickHouse queries use `{val_N: Type}` binds with `query_params`.
- No `.raw(` or similar escape-hatch calls appear in the app code.

### 5.9 [POS] HQL sandboxing

`ClickhouseWrapper.ts:150-151` sets `readonly: 1`, `allow_ddl: 0`, `max_execution_time: 30`, `max_rows_to_read: 1e9`, `max_result_rows: 10_000`. Even a successful HQL filter bypass would hit these caps, which greatly reduces the blast radius.

### 5.10 [POS] Write/DDL statements are rejected before execution

`HeliconeSqlManager.ts:64` rejects `INSERT/UPDATE/DELETE/DROP/CREATE/ALTER` keywords. Combined with `readonly: 1` at the client, write amplification from a bypass is unlikely.

---

---

## 6. Storage, Uploads, Webhooks & Outbound HTTP

_Pending agent completion._

---

## Remediation Priority

_To be finalized once all section reviews complete._
