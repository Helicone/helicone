RequestBodyBufferContainer (Memory-Only)
=======================================

Minimal Node.js + TypeScript service that acts as the Remote RequestBodyBuffer
for the Worker. It accepts large request bodies, stores them in memory with a
TTL, exposes a small API to read small bodies, and can sign AWS Bedrock
requests using SigV4.

Endpoints
- POST `/:requestId` — stream-ingest body; returns `{ size: number }`.
- GET `/:requestId/unsafe/read` — returns text if size ≤ `UNSAFE_READ_MAX_BYTES`.
- POST `/:requestId/sign-aws` — body `{ region, forwardToHost, requestHeaders, method, urlString }`; returns `{ newHeaders, model }`.
- GET `/healthz` — liveness probe.

Env
- `PORT` (default `8000`)
- `MAX_SIZE_BYTES` (default `268435456` => 256MB)
- `TTL_SECONDS` (default `120`)
- `INTERNAL_SECRET` (optional). If set, all endpoints require header `x-helicone-internal-secret` to match.

Build & Run (Docker)
```
docker build -t rbb-container .
docker run -p 8000:8000 rbb-container
```

Notes
- This variant keeps everything in memory. It is suitable for low concurrency
  and short-lived bodies. Scale and caps should be enforced by the Worker.
- The Worker-side Remote client should POST to `/:requestId` immediately after
  selecting the Remote path, and then call `sign-aws` when needed.

Tests (bare metal)
- Install deps and run: `npm i && npm test`
- Tests start a real HTTP server on `127.0.0.1` with an ephemeral port and use `fetch` for requests.
