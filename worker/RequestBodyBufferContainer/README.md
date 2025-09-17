RequestBodyBufferContainer (Memory-Only)
=======================================

Minimal Node.js + TypeScript service that acts as the Remote RequestBodyBuffer
for the Worker. It accepts large request bodies, stores them in memory with a
TTL, exposes a small API to read small bodies, and can sign AWS Bedrock
requests using SigV4.

Endpoints
- POST `/:requestId` — stream-ingest body; returns `{ size: number, isStream?: boolean, userId?: string, model?: string }` extracted from JSON bodies when present.
- GET `/:requestId/unsafe/read` — returns stored body text (for small bodies / debugging).
- POST `/:requestId/sign-aws` — body `{ region, forwardToHost, requestHeaders, method, urlString }`; returns `{ newHeaders, model }`.
- GET `/healthz` — liveness probe.

Env
- `PORT` (default `8000`)
- `MAX_SIZE_BYTES` (default `268435456` => 256MB)
- `TTL_SECONDS` (default `120`)
  (No internal secret — the container is assumed private to the Worker.)

Build & Run (Docker)
```bash
docker build -t rbb-container .
docker run -p 8000:8000 rbb-container

Notes
- This variant keeps everything in memory. It is suitable for low concurrency
  and short-lived bodies. Scale and caps should be enforced by the Worker.
- The Worker-side Remote client should POST to `/:requestId` immediately after
  selecting the Remote path, and then may read metadata from the response (e.g., `isStream`, `userId`, `model`).
  When needed, call `sign-aws` for Bedrock signing.

Tests (bare metal)
- Install deps and run: `npm i && npm test`
- Tests start a real HTTP server on `127.0.0.1` with an ephemeral port and use `fetch` for requests.
