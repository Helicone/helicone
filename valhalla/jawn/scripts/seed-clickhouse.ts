import { testClickhouseDb } from "../src/lib/db/test/TestClickhouseWrapper";
import { RequestResponseRMT } from "../src/lib/db/ClickhouseWrapper";
import { randomUUID } from "node:crypto";

function parseArg(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  if (!arg) return fallback;
  return arg.slice(prefix.length);
}

async function main() {
  const count = Number(parseArg("count", "500"));
  const orgId = parseArg("orgId", "83635a30-5ba6-41a8-8cc6-fb7df941b24a")!;

  console.log(`[seed-clickhouse] Seeding request_response_rmt with ${count} rows for orgId=${orgId}`);

  // Ensure tables exist
  await testClickhouseDb.createTables();

  const now = Date.now();
  const rows: RequestResponseRMT[] = Array.from({ length: count }).map((_, i) => {
    const ts = new Date(now - i * 1000)
      .toISOString()
      .replace("T", " ")
      .replace("Z", "")
      .replace(/\.\d+$/, "");
    return {
      response_id: randomUUID(),
      response_created_at: ts,
      latency: 100 + (i % 50),
      status: 200,
      completion_tokens: 20 + (i % 10),
      prompt_tokens: 10 + (i % 5),
      prompt_cache_write_tokens: 0,
      prompt_cache_read_tokens: 0,
      prompt_audio_tokens: 0,
      completion_audio_tokens: 0,
      model: i % 2 === 0 ? "gpt-4o-mini" : "stardust",
      request_id: randomUUID(),
      request_created_at: ts,
      user_id: `user-${i % 3}`,
      organization_id: orgId,
      proxy_key_id: null as any,
      threat: false,
      time_to_first_token: 50,
      provider: "OPENAI",
      country_code: "US",
      target_url: "https://api.openai.com/v1/chat/completions",
      properties: {},
      scores: {},
      request_body: "test",
      response_body: "test",
      assets: [`asset-${i}`],
      // Let ClickHouse defaults apply for updated_at, cache_reference_id, cache_enabled, cost, etc.
    } as RequestResponseRMT;
  });

  const result = await testClickhouseDb.dbInsertClickhouse("request_response_rmt", rows);
  if (result.error) {
    console.error("[seed-clickhouse] Insert failed:", result.error);
    process.exit(1);
  }
  console.log("[seed-clickhouse] Done. Query ID:", result.data);
}

main().catch((err) => {
  console.error("[seed-clickhouse] Unexpected error:", err);
  process.exit(1);
});


