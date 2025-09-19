import { AwsClient } from "aws4fetch";
import Fastify, { FastifyInstance } from "fastify";
import type { IncomingMessage } from "http";
import { Readable } from "node:stream";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { z } from "zod";
import { MemoryStore } from "./storage/memoryStore";
import { signAws } from "./aws/sign";
import type { SignAwsInput } from "./types";
import type { AppConfig } from "./config";

const gzipAsync = promisify(gzip);

const REQUEST_TIMEOUT_MS = 1000 * 60 * 5; // 5 minutes
const CONNECTION_TIMEOUT_MS = REQUEST_TIMEOUT_MS; // 5 minutes
const KEEP_ALIVE_TIMEOUT_MS = 1 * 60 * 1000; // 1 minute
const HEADERS_TIMEOUT_MS = 30 * 1000; // 30 seconds

export function createApp(config: AppConfig, logger: any): FastifyInstance {
  const app = Fastify({
    logger,
    bodyLimit: config.maxSizeBytes, // Set Fastify body limit to match our config
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    requestTimeout: REQUEST_TIMEOUT_MS,
    keepAliveTimeout: KEEP_ALIVE_TIMEOUT_MS,
    http: {
      headersTimeout: HEADERS_TIMEOUT_MS,
      requestTimeout: REQUEST_TIMEOUT_MS,
      keepAliveTimeout: KEEP_ALIVE_TIMEOUT_MS,
    },
  });
  const store = new MemoryStore(config.ttlSeconds);

  // Accept any content-type and parse as Buffer for simplicity.
  // In production, we can switch to stream-based handling when needed.
  app.addContentTypeParser(
    "*",
    { parseAs: "buffer", bodyLimit: config.maxSizeBytes },
    (_req, payload, done) => {
      done(null, payload);
    }
  );

  // No internal secret: container is not publicly accessible.

  type IngestRequest = {
    raw: IncomingMessage;
    body?: Buffer | string;
  };

  async function readBody(
    req: IngestRequest,
    maxBytes: number
  ): Promise<Buffer> {
    const b = req.body;
    if (typeof b === "string") {
      const buf = Buffer.from(b);
      if (buf.byteLength > maxBytes) throw new Error("Payload Too Large");
      return buf;
    }
    if (Buffer.isBuffer(b)) {
      if (b.byteLength > maxBytes) throw new Error("Payload Too Large");
      return b;
    }
    const stream: Readable = req.raw;
    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let total = 0;
      stream.on("data", (chunk: Buffer) => {
        total += chunk.length;
        if (total > maxBytes) {
          stream.destroy(new Error("Payload Too Large"));
          return;
        }
        chunks.push(chunk);
      });
      stream.once("end", () => resolve(Buffer.concat(chunks)));
      stream.once("error", reject);
    });
  }

  app.get("/healthz", async () => ({ ok: true }));

  app.post<{
    Params: { requestId: string };
    Body: string | Buffer;
  }>("/:requestId", async (request, reply) => {
    const { requestId } = request.params;
    const t0 = Date.now();
    try {
      const buf = await readBody(request, config.maxSizeBytes);
      const size = store.set(requestId, buf);
      let isStream: boolean | undefined;
      let userId: string | undefined;
      let model: string | undefined;
      try {
        const obj = JSON.parse(buf.toString("utf8"));
        if (typeof obj?.stream === "boolean") isStream = obj.stream === true;
        if (typeof obj?.user === "string") userId = obj.user;
        if (typeof obj?.model === "string") model = obj.model;
      } catch (_e) {
        // non-JSON bodies are fine; leave metadata undefined
      }
      request.log.info(
        { requestId, size, isStream, userId, model },
        "ingested body"
      );
      return reply.send({ size, isStream, userId, model });
    } catch (e: any) {
      request.log.warn({ err: e, requestId }, "ingest failed");
      const msg = String(e?.message ?? e ?? "error");
      if (msg.includes("Too Large"))
        return reply.code(413).send({ error: "payload too large" });
      return reply.code(500).send({ error: "ingest failed" });
    } finally {
      request.log.debug({ requestId, ms: Date.now() - t0 }, "ingest done");
    }
  });

  app.get<{
    Params: { requestId: string };
  }>("/:requestId/metadata", async (request, reply) => {
    const { requestId } = request.params;
    const entry = store.get(requestId);

    if (!entry) return reply.code(404).send("not found");

    let isStream: boolean | undefined;
    let userId: string | undefined;
    let model: string | undefined;
    let size: number = entry.size;
    try {
      const obj = JSON.parse(entry.data.toString("utf8"));
      if (typeof obj?.stream === "boolean") isStream = obj.stream === true;
      if (typeof obj?.user === "string") userId = obj.user;
      if (typeof obj?.model === "string") model = obj.model;
    } catch (_e) {
      // non-JSON bodies are fine; leave metadata undefined
    }

    return reply.send({ isStream, userId, model, size });
  });

  app.get<{
    Params: { requestId: string };
  }>("/:requestId/unsafe/read", async (request, reply) => {
    const { requestId } = request.params;
    const entry = store.get(requestId);
    if (!entry) return reply.code(404).send("not found");

    reply.header("content-type", "text/plain; charset=utf-8");
    return reply.send(entry.data.toString("utf8"));
  });

  const SignSchema = z.object({
    region: z.string().min(1),
    forwardToHost: z.string().min(1),
    requestHeaders: z.record(z.string()),
    method: z.string().min(1),
    urlString: z.string().url(),
  });

  app.post<{
    Params: { requestId: string };
    Body: SignAwsInput;
  }>("/:requestId/sign-aws", async (request, reply) => {
    const { requestId } = request.params;
    const entry = store.get(requestId);
    if (!entry) return reply.code(404).send({ error: "not found" });

    const parse = SignSchema.safeParse(request.body);
    if (!parse.success)
      return reply
        .code(400)
        .send({ error: "bad request", details: parse.error.flatten() });

    try {
      const res = await signAws(parse.data, entry.data.toString("utf8"));
      return reply.send(res);
    } catch (e: any) {
      request.log.error({ err: e, requestId }, "sign-aws failed");
      return reply.code(500).send({ error: "sign failed" });
    }
  });

  // Build a streamed JSON payload suitable for S3 storage:
  // {
  //   request: "<original or mutated request body string>",
  //   response: <response body JSON>
  // }
  const BuildS3Schema = z.object({
    response: z.any(),
    tags: z.record(z.string()),
    url: z.string().url(),
  });

  app.get<{
    Params: { requestId: string };
  }>("/:requestId/body-length", async (request, reply) => {
    const { requestId } = request.params;
    const entry = store.get(requestId);
    if (!entry) return reply.code(404).send({ error: "not found" });
    return reply.send({ length: entry.size });
  });

  app.post<{
    Params: { requestId: string };
    Body: { body: string };
  }>("/:requestId/s3/set-body", async (request, reply) => {
    const { requestId } = request.params;
    const entry = store.get(requestId);
    if (!entry) return reply.code(404).send({ error: "not found" });
    entry.data = Buffer.from(request.body.body);
    return reply.send({ ok: true });
  });

  app.post<{
    Params: { requestId: string };
    Body: { response: unknown };
  }>("/:requestId/s3/upload-body", async (request, reply) => {
    const awsClient = new AwsClient({
      accessKeyId: request.headers["x-access-key"] as string,
      secretAccessKey: request.headers["x-secret-key"] as string,
      service: "s3",
      region: request.headers["x-region"] as string,
    });

    const { requestId } = request.params;
    const entry = store.get(requestId);
    if (!entry) return reply.code(404).send({ error: "not found" });

    const parsed = BuildS3Schema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: "bad request", details: parsed.error.flatten() });
    }

    const responseText = parsed.data.response;

    const requestText = entry.data.toString("utf8");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Content-Encoding": "gzip",
    };

    const tags = parsed.data.tags;

    if (tags && Object.keys(tags).length > 0) {
      const tagsString = Object.entries(tags)
        .map(
          ([key, val]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
        )
        .join("&");
      headers["x-amz-tagging"] = tagsString;
    }

    const jsonData = JSON.stringify({
      request: requestText,
      response: responseText,
    });

    const compressedBody = await gzipAsync(jsonData);
    headers["Content-Length"] = String(compressedBody.byteLength);

    const signedRequest = await awsClient.sign(parsed.data.url, {
      method: "PUT",
      body: compressedBody,
      headers,
    });
    // return reply.send({ url: signedRequest.url });

    return await fetch(signedRequest.url, signedRequest);
  });

  app.delete<{
    Params: { requestId: string };
  }>("/:requestId", async (request, reply) => {
    const { requestId } = request.params;
    store.delete(requestId);
    return reply.send({ ok: true });
  });

  return app;
}
