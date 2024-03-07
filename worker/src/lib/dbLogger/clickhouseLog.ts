import { Database } from "../../../supabase/database.types";
import { ClickhouseClientWrapper, ClickhouseDB } from "../db/clickhouse";

export function formatTimeString(timeString: string): string {
  return new Date(timeString).toISOString().replace("Z", "");
}

function buildPropertyWithResponseInserts(
  request: Database["public"]["Tables"]["request"]["Row"],
  response: Database["public"]["Tables"]["response"]["Insert"],
  properties: Database["public"]["Tables"]["properties"]["Insert"][]
): ClickhouseDB["Tables"]["property_with_response_v1"][] {
  const model = request.model_override ?? response.model ?? request.model ?? "";
  return properties.map((p) => ({
    response_id: response.id ?? "",
    response_created_at: response.created_at
      ? formatTimeString(response.created_at)
      : null,
    latency: response.delay_ms ?? 0,
    status: response.status ?? 0,
    completion_tokens: response.completion_tokens ?? 0,
    prompt_tokens: response.prompt_tokens ?? 0,
    model: model,
    request_id: request.id,
    request_created_at: formatTimeString(request.created_at),
    auth_hash: request.auth_hash,
    user_id: request.user_id ?? "",
    organization_id:
      request.helicone_org_id ?? "00000000-0000-0000-0000-000000000000",
    time_to_first_token: response.time_to_first_token ?? null,
    threat: request.threat ?? null,
    property_key: p.key,
    property_value: p.value,
  }));
}

export async function logInClickhouse(
  request: Database["public"]["Tables"]["request"]["Row"],
  response: Database["public"]["Tables"]["response"]["Insert"],
  properties: Database["public"]["Tables"]["properties"]["Insert"][],
  node: {
    id: string | null;
    job: string | null;
  },
  clickhouseDb: ClickhouseClientWrapper
) {
  const model =
    request.model_override ?? response.model ?? request.model ?? "not-found";
  return Promise.all([
    clickhouseDb.dbInsertClickhouse("request_response_log", [
      {
        auth_hash: request.auth_hash,
        user_id: request.user_id,
        request_id: request.id,
        completion_tokens: response.completion_tokens ?? null,
        latency: response.delay_ms ?? null,
        model: model,
        prompt_tokens: response.prompt_tokens ?? null,
        request_created_at: formatTimeString(request.created_at),
        response_created_at: response.created_at
          ? formatTimeString(response.created_at)
          : null,
        response_id: response.id ?? null,
        status: response.status ?? null,
        organization_id:
          request.helicone_org_id ?? "00000000-0000-0000-0000-000000000000",
        job_id: node.job,
        node_id: node.id,
        proxy_key_id: request.helicone_proxy_key_id ?? null,
        threat: request.threat ?? null,
        time_to_first_token: response.time_to_first_token ?? null,
        target_url: request.target_url ?? null,
      },
    ]),
    clickhouseDb.dbInsertClickhouse(
      "properties_v3",
      properties.map((p) => ({
        id: p.id ?? 0,
        created_at: p.created_at
          ? formatTimeString(p.created_at)
          : formatTimeString(new Date().toISOString()),
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
