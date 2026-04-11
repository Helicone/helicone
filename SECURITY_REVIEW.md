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

_Pending agent completion._

---

## 3. Proxy / Gateway (Worker + aigateway)

_Pending agent completion._

---

## 4. Frontend (Next.js `web/`)

_Pending agent completion._

---

## 5. Database Layer (Postgres + ClickHouse)

_Pending agent completion._

---

## 6. Storage, Uploads, Webhooks & Outbound HTTP

_Pending agent completion._

---

## Remediation Priority

_To be finalized once all section reviews complete._
