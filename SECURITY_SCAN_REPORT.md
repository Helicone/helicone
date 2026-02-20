# Helicone Security Scan Report

**Date:** 2026-02-20
**Scope:** Full codebase security audit across all services

---

## Executive Summary

A comprehensive security scan was performed across the Helicone monorepo covering 7 vulnerability categories. The scan identified **34 findings** across all severity levels. The codebase demonstrates generally strong security practices — parameterized queries are used on most critical paths, DOMPurify sanitization is applied consistently, and no production secrets are committed. However, several critical issues require immediate attention.

| Severity | Count |
|----------|-------|
| CRITICAL | 6 |
| HIGH | 10 |
| MEDIUM | 10 |
| LOW | 8 |

---

## CRITICAL Findings

### C1. Prototype Pollution in Request Body Override

**Files:**
- `worker/src/RequestBodyBuffer/RequestBodyBuffer_InMemory.ts:53-65`
- `worker/RequestBodyBufferContainer/src/app.ts:229-241`

**Issue:** The `applyOverride()` function recursively assigns user-controlled keys to objects without guarding against prototype pollution:

```typescript
const applyOverride = (body: any, override: object): object => {
  for (const [key, value] of Object.entries(override)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      body[key] = value;  // No __proto__ / constructor guard
    } else {
      body[key] = this.applyOverride(body[key], value);
    }
  }
  return body;
};
```

**Impact:** An attacker could inject `{"__proto__": {"isAdmin": true}}` to pollute the Object prototype, potentially escalating privileges across the entire worker process.

**Fix:** Filter dangerous keys:
```typescript
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
if (DANGEROUS_KEYS.has(key)) continue;
```

---

### C2. Command Injection in Python Evaluator

**File:** `valhalla/jawn/src/managers/evaluator/pythonEvaluator.ts:76,91`

**Issue:** User-provided code and IDs are concatenated into shell commands:

```typescript
sandbox.shells.python.run(`HELICONE_EXECUTION_ID="${uniqueId}"\n${code}`)
await withTimeout(sandbox.shells.run(`rm -rf /tmp/${uniqueId}`), 10000);
```

**Impact:** While sandboxed, the string concatenation pattern enables injection if `uniqueId` or `code` contain shell metacharacters.

**Fix:** Validate `uniqueId` against `/^[a-zA-Z0-9-]+$/` and use the sandbox's file system API for cleanup instead of shell commands.

---

### C3. Disabled Webhook Signature Verification — Intercom

**File:** `web/pages/api/intercom.ts:90-92`

**Issue:** Webhook signature verification is completely commented out:

```typescript
// Verify webhook signature (temporarily disabled for testing)
// if (signature && !verifyIntercomWebhook(...)) {
//   return res.status(401).json({ error: "Invalid signature" });
// }
```

**Impact:** Any attacker can forge Intercom webhook events, potentially manipulating customer support workflows and accessing conversation data.

**Fix:** Uncomment and enable the verification logic.

---

### C4. Disabled Webhook Signature Verification — Slack

**File:** `web/pages/api/slack-events.ts:72-76`

**Issue:** Verification only runs if signature is present, meaning unsigned requests are accepted:

```typescript
if (signature && !verifySlackWebhook(payload, signature, slackSecret)) {
  return res.status(401).json({ error: "Invalid signature" });
}
```

**Impact:** Attackers can send forged Slack events by simply omitting the signature header.

**Fix:** Require signature to be present: `if (!signature || !verifySlackWebhook(...))`.

---

### C5. Wildcard CORS in Worker API Router

**File:** `worker/src/routers/api/apiRouter.ts:573`

**Issue:** OPTIONS handler returns `Access-Control-Allow-Origin: *` for all routes:

```typescript
return new Response(null, {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE, POST, GET, PUT",
  },
});
```

**Impact:** Enables cross-origin requests from any website, potentially allowing CSRF attacks against authenticated API endpoints.

**Fix:** Restrict to known Helicone origins or reflect the request origin after validation.

---

### C6. Open Redirect in Auth Form

**File:** `web/components/templates/auth/authForm.tsx:48-55`

**Issue:** URL parameter from query string is directly assigned to `window.location.href` without origin validation:

```typescript
const urlParam = fullUrl.substring(startIndex + 4);
const decodedUrl = decodeURIComponent(urlParam);
window.location.href = decodedUrl;
```

**Impact:** Attacker can craft URLs like `https://helicone.ai/signin?url=https://evil.com` to redirect users to phishing sites after login.

**Fix:** Validate the redirect URL origin matches `window.location.origin` or use a whitelist.

---

## HIGH Findings

### H1. SQL Injection — AlertStore Property Interpolation

**File:** `worker/src/lib/db/AlertStore.ts:60,118,121`

User-controlled `alert.grouping`, `alert.threshold`, and `alert.minimum_request_count` are interpolated directly into SQL queries without parameterization.

---

### H2. SQL Injection — Direct Numeric Interpolation (Multiple Files)

**Files:**
- `valhalla/jawn/src/managers/SessionManager.ts:360-382`
- `valhalla/jawn/src/controllers/private/adminController.ts:222-224`
- `valhalla/jawn/src/managers/MetricsManager.ts:142-155,775-776`
- `valhalla/jawn/src/lib/stores/request/request.ts:132-133,181-182,307-308`
- `valhalla/jawn/src/managers/dataset/HeliconeDatasetManager.ts:123-124`

LIMIT, OFFSET, HAVING, and INTERVAL values are interpolated via template literals instead of parameterized queries.

---

### H3. SQL Injection — Feedback API

**File:** `web/pages/api/feedback/index.ts:16-22`

`org_id` is directly interpolated into a SQL query string instead of using parameterized query.

---

### H4. innerHTML Assignment in Input Editor

**File:** `web/components/templates/prompts/experiments/table/components/inputEditor.tsx:108,118`

Direct `innerHTML` assignment. Input is escaped via `escapeHTML()` which mitigates the risk, but `innerHTML` should be avoided when possible.

---

### H5. eval() Usage in Requests Page

**File:** `web/pages/requests.tsx:52`

Hardcoded `eval()` call. While the string is not user-controlled, `eval()` is a dangerous anti-pattern that should be replaced.

---

### H6. Path Traversal in CSV Upload

**File:** `valhalla/jawn/src/lib/stores/HqlStore.ts:34,58,66`

`fileName` parameter passed to `fs.readFileSync()` and `fs.unlinkSync()` without path validation. Current callers use safe timestamp-based names, but the function itself is vulnerable.

---

### H7. Temporary File Race Condition in FineTuningManager

**File:** `valhalla/jawn/src/managers/FineTuningManager.ts:86-92`

Temp directory created with `fs.mkdirSync()` using predictable UUID path. Vulnerable to TOCTOU race conditions with symlink attacks.

---

### H8. Database Query Parameter Logging

**Files:**
- `valhalla/jawn/src/lib/shared/db/dbExecute.ts:37,88`
- `valhalla/jawn/src/lib/db/ClickhouseWrapper.ts:104,162-167`
- `valhalla/jawn/src/lib/db/valhalla.ts:112,121`
- `worker/src/lib/db/ClickhouseWrapper.ts:97`

Full SQL queries and parameters (potentially containing PII or secrets) are logged to console in error handlers.

---

### H9. Offensive Tier Name with Fake Response

**File:** `web/pages/api/llm/index.ts:100-126`

Blocked users receive a fake "success" response instead of proper access denial, creating a confused deputy problem.

---

### H10. Blanket Public Route Bypass

**File:** `valhalla/jawn/src/middleware/auth.ts:71-73`

All `/v1/public/*` routes bypass authentication entirely via prefix match, risking accidental exposure of new endpoints added under this path.

---

## MEDIUM Findings

### M1. Sort Key Interpolation with Regex-Only Validation

**File:** `valhalla/jawn/src/lib/shared/sorts/requests/sorts.ts:97-100,190`

Property keys validated via `/^[a-zA-Z0-9_]+$/` then interpolated into SQL. Regex validation is a defense, but parameterized queries would be safer.

---

### M2. Dynamic Table Name in dbExecute

**File:** `web/lib/api/db/dbExecute.ts:159-174`

The `from` parameter (table name) in the dynamic UPDATE builder is not validated against a whitelist.

---

### M3. Interval Value Injection in MetricsManager

**File:** `valhalla/jawn/src/managers/MetricsManager.ts:142-155`

`dbIncrement` values interpolated via `convertDbIncrement()` which provides basic validation but not parameterization.

---

### M4. Shell Script SQL Concatenation

**File:** `clickhouse/ch_local_hcone.sh:54,74,99-100`

`migration_name` variable interpolated directly into SQL queries without escaping.

---

### M5. SSRF Potential in Hypothesis Runner

**File:** `valhalla/jawn/src/lib/experiment/hypothesisRunner.ts:44`

`fetch(url)` called where URL could be influenced by experiment configuration.

---

### M6. Webhook URL Validation Lacks Origin Check

**Files:**
- `web/services/hooks/useCredits.ts:130`
- `web/services/hooks/useAutoTopoff.ts:107`
- `web/packages/common/toImplement/client/useSupabaseAuthClient.ts:212`

`window.location.href` set from API response URLs without validating the destination origin.

---

### M7. CORS Credentials with Potential Origin Bypass

**File:** `valhalla/jawn/src/index.ts:103`

`credentials: true` set on CORS config. If the origin validation has any bypass, cookies would be sent to unauthorized origins.

---

### M8. Unauthenticated Loop Trigger in Non-Production

**File:** `valhalla/jawn/src/index.ts:156-164`

`/run-loops/:index` endpoint available without authentication in staging environments.

---

### M9. TLS Verification Disabled in Development

**File:** `web/lib/auth.ts:30`

`rejectUnauthorized: false` when connecting to MailHog or when `NODE_ENV === "development"`.

---

### M10. Weak Random ID Generation

**File:** `valhalla/jawn/src/managers/prompt/PromptManager.ts:69-76`

Uses `Math.random()` instead of `crypto.randomBytes()` for prompt ID generation.

---

## LOW Findings

### L1-L2. Unsanitized dangerouslySetInnerHTML

- `bifrost/app/model/[modelName]/ModelDetailPage.tsx:712` — Code highlighting output without DOMPurify
- `bifrost/app/credits/waitlistPage.tsx:291` — Similar pattern

### L3. Header-Based Origin Construction

- `web/pages/api/stripe/create_pro_subscription/index.ts:76-92` — Uses `x-forwarded-proto` and `host` headers to construct origin

### L4. Hardcoded Test Email in Webhook Handler

- `web/pages/api/intercom.ts:143-145` — Test account detection in production code

### L5. Auth Error Returns HTTP 400 Instead of 401

- `valhalla/jawn/src/middleware/auth.ts:134`

### L6-L8. Development-Only Docker Credentials

- `Dockerfile:39,146,151-159` — Hardcoded dev passwords (testpassword, minioadmin)
- `docker/docker-compose.yml` — Similar development credentials throughout

---

## Positive Findings

The codebase demonstrates many strong security practices:

- **DOMPurify sanitization** consistently applied across 6+ `dangerouslySetInnerHTML` usages
- **Parameterized queries** used on most critical database paths
- **No production secrets** committed to source control
- **Proper `crypto.randomBytes()`** used for webhook HMAC keys and temporary passwords
- **HeliconeSqlManager** implements robust SQL validation with table whitelisting and forbidden keyword blocking
- **Content sanitization library** (`web/lib/sanitizeContent.ts`) strips dangerous HTML tags and event handlers
- **Error handler** properly omits stack traces in production responses
- **Secure secret rotation** pattern in `packages/secrets/SecretManager.ts`

---

## Remediation Priority

### Immediate (This Sprint)
1. **C1** — Add prototype pollution guards to `applyOverride()`
2. **C3/C4** — Re-enable Intercom and Slack webhook signature verification
3. **C5** — Replace wildcard CORS with origin whitelist in worker
4. **C6** — Add origin validation to auth redirect

### Short-Term (Next 2 Sprints)
5. **C2** — Sanitize command inputs in Python evaluator
6. **H1-H3** — Convert SQL string interpolation to parameterized queries
7. **H6** — Add path validation to HqlStore.uploadCsv
8. **H8** — Remove query parameters from error logs

### Medium-Term
9. **M1-M4** — Harden remaining SQL interpolation patterns
10. **M5-M6** — Add URL validation for SSRF and redirect protections
11. **M10** — Replace Math.random() with crypto.randomBytes()
