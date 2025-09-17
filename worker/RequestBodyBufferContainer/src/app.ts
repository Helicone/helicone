import Fastify, { FastifyInstance } from "fastify";
import type { FastifyRequest } from "fastify";
import type { IncomingMessage } from "http";
import { Readable } from "node:stream";
import { z } from "zod";
import { MemoryStore } from "./storage/memoryStore";
import { signAws } from "./aws/sign";
import type { SignAwsInput } from "./types";
import type { AppConfig } from "./config";

export function createApp(config: AppConfig, logger: any): FastifyInstance {
  const app = Fastify({ logger });
  const store = new MemoryStore(config.ttlSeconds);

  // Accept any content-type and parse as Buffer for simplicity.
  // In production, we can switch to stream-based handling when needed.
  app.addContentTypeParser('*', { parseAs: 'buffer' }, (_req, payload, done) => {
    done(null, payload);
  });

  // No internal secret: container is not publicly accessible.

  type IngestRequest = Pick<FastifyRequest, "body" | "raw"> & {
    raw: IncomingMessage;
    // after our content-type parser, body is either Buffer or string
    body?: Buffer | string;
  };

  async function readBody(req: IngestRequest, maxBytes: number): Promise<Buffer> {
    const b = req.body;
    if (typeof b === 'string') {
      const buf = Buffer.from(b);
      if (buf.byteLength > maxBytes) throw new Error('Payload Too Large');
      return buf;
    }
    if (Buffer.isBuffer(b)) {
      if (b.byteLength > maxBytes) throw new Error('Payload Too Large');
      return b;
    }
    const stream: Readable = req.raw as unknown as Readable;
    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let total = 0;
      stream.on('data', (chunk: Buffer) => {
        total += chunk.length;
        if (total > maxBytes) {
          stream.destroy(new Error('Payload Too Large'));
          return;
        }
        chunks.push(chunk);
      });
      stream.once('end', () => resolve(Buffer.concat(chunks)));
      stream.once('error', reject);
    });
  }

  app.get("/healthz", async () => ({ ok: true }));

  app.post<{
    Params: { requestId: string };
  }>("/:requestId", async (request, reply) => {

    const { requestId } = request.params;
    const t0 = Date.now();
    try {
      const buf = await readBody(request, config.maxSizeBytes);
      const size = store.set(requestId, buf);
      request.log.info({ requestId, size }, "ingested body");
      return reply.send({ size });
    } catch (e: any) {
      request.log.warn({ err: e, requestId }, "ingest failed");
      const msg = String(e?.message ?? e ?? "error");
      if (msg.includes("Too Large")) return reply.code(413).send({ error: "payload too large" });
      return reply.code(500).send({ error: "ingest failed" });
    } finally {
      request.log.debug({ requestId, ms: Date.now() - t0 }, "ingest done");
    }
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
      return reply.code(400).send({ error: "bad request", details: parse.error.flatten() });

    try {
      const res = await signAws(parse.data, entry.data.toString("utf8"));
      return reply.send(res);
    } catch (e: any) {
      request.log.error({ err: e, requestId }, "sign-aws failed");
      return reply.code(500).send({ error: "sign failed" });
    }
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
