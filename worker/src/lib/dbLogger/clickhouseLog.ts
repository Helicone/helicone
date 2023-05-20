import { Database } from "../../../supabase/database.types";
import { ClickhouseClientWrapper } from "../db/clickhouse";

function formatTimeString(timeString: string): string {
  return new Date(timeString).toISOString().replace("Z", "");
}

export async function logInClickhouse(
  request: Database["public"]["Tables"]["request"]["Row"],
  response: Database["public"]["Tables"]["response"]["Row"],
  properties: Database["public"]["Tables"]["properties"]["Row"][],
  clickhouseDb: ClickhouseClientWrapper
) {
  return Promise.all([
    clickhouseDb.dbInsertClickhouse("response_copy_v1", [
      {
        auth_hash: request.auth_hash,
        user_id: request.user_id,
        request_id: request.id,
        completion_tokens: response.completion_tokens,
        latency: response.delay_ms,
        model: ((response.body as any)?.model as string) || null,
        prompt_tokens: response.prompt_tokens,
        request_created_at: formatTimeString(request.created_at),
        response_created_at: formatTimeString(response.created_at),
        response_id: response.id,
        status: response.status,
      },
    ]),
    clickhouseDb.dbInsertClickhouse("response_copy_v2", [
      {
        auth_hash: request.auth_hash,
        user_id: request.user_id,
        request_id: request.id,
        completion_tokens: response.completion_tokens,
        latency: response.delay_ms,
        model: ((response.body as any)?.model as string) || null,
        prompt_tokens: response.prompt_tokens,
        request_created_at: formatTimeString(request.created_at),
        response_created_at: formatTimeString(response.created_at),
        response_id: response.id,
        status: response.status,
        organization_id:
          request.helicone_org_id ?? "00000000-0000-0000-0000-000000000000",
      },
    ]),
    clickhouseDb.dbInsertClickhouse(
      "properties_copy_v1",
      properties.map((p) => ({
        key: p.key,
        value: p.value,
        user_id: p.user_id,
        auth_hash: request.auth_hash,
        request_id: request.id,
        created_at: p.created_at ? formatTimeString(p.created_at) : null,
        id: p.id,
      }))
    ),
    clickhouseDb.dbInsertClickhouse(
      "properties_copy_v2",
      properties.map((p) => ({
        id: p.id,
        created_at: formatTimeString(p.created_at),
        request_id: request.id,
        key: p.key,
        value: p.value,
        organization_id:
          request.helicone_org_id ?? "00000000-0000-0000-0000-000000000000",
      }))
    ),
  ]);
}
