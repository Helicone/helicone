import { Database } from "../../../supabase/database.types";
import { ClickhouseClientWrapper, ClickhouseDB } from "../db/clickhouse";

function formatTimeString(timeString: string): string {
  return new Date(timeString).toISOString().replace("Z", "");
}

function buildPropertyWithResponseInserts(
  request: Database["public"]["Tables"]["request"]["Row"],
  response: Database["public"]["Tables"]["response"]["Row"],
  properties: Database["public"]["Tables"]["properties"]["Row"][]
): ClickhouseDB["Tables"]["property_with_response_v1"][] {
  return properties.map((p) => ({
    response_id: response.id,
    response_created_at: formatTimeString(response.created_at),
    latency: response.delay_ms,
    status: response.status ?? 0,
    completion_tokens: response.completion_tokens,
    prompt_tokens: response.prompt_tokens,
    model: ((response.body as any)?.model as string) || "",
    request_id: request.id,
    request_created_at: formatTimeString(request.created_at),
    auth_hash: request.auth_hash,
    user_id: request.user_id ?? "",
    organization_id:
      request.helicone_org_id ?? "00000000-0000-0000-0000-000000000000",
    property_key: p.key,
    property_value: p.value,
  }));
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
    clickhouseDb.dbInsertClickhouse("response_copy_v3", [
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
    clickhouseDb.dbInsertClickhouse(
      "property_with_response_v1",
      buildPropertyWithResponseInserts(request, response, properties)
    ),
  ]);
}
