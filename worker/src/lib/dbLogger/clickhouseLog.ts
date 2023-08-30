import { Database } from "../../../supabase/database.types";
import { ClickhouseClientWrapper, ClickhouseDB } from "../db/clickhouse";

function formatTimeString(timeString: string): string {
  return new Date(timeString).toISOString().replace("Z", "");
}

function buildPropertyWithResponseInserts(
  request: Database["public"]["Tables"]["request"]["Row"],
  response: Database["public"]["Tables"]["response"]["Insert"],
  properties: Database["public"]["Tables"]["properties"]["Row"][]
): ClickhouseDB["Tables"]["property_with_response_v1"][] {
  return properties.map((p) => ({
    response_id: response.id ?? "",
    response_created_at: response.created_at
      ? formatTimeString(response.created_at)
      : null,
    latency: response.delay_ms ?? 0,
    status: response.status ?? 0,
    completion_tokens: response.completion_tokens ?? 0,
    prompt_tokens: response.prompt_tokens ?? 0,
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
  response: Database["public"]["Tables"]["response"]["Insert"],
  properties: Database["public"]["Tables"]["properties"]["Insert"][],
  clickhouseDb: ClickhouseClientWrapper
) {
  return Promise.all([
    clickhouseDb.dbInsertClickhouse("response_copy_v1", [
      {
        auth_hash: request.auth_hash,
        user_id: request.user_id,
        request_id: request.id,
        completion_tokens: response.completion_tokens ?? null,
        latency: response.delay_ms ?? null,
        model: ((response.body as any)?.model as string) || null,
        prompt_tokens: response.prompt_tokens ?? null,
        request_created_at: formatTimeString(request.created_at),
        response_created_at: response.created_at
          ? formatTimeString(response.created_at)
          : null,
        response_id: response.id ?? null,
        status: response.status ?? null,
      },
    ]),
    clickhouseDb.dbInsertClickhouse("response_copy_v2", [
      {
        auth_hash: request.auth_hash,
        user_id: request.user_id,
        request_id: request.id,
        completion_tokens: response.completion_tokens ?? null,
        latency: response.delay_ms ?? null,
        model: ((response.body as any)?.model as string) || null,
        prompt_tokens: response.prompt_tokens ?? null,
        request_created_at: formatTimeString(request.created_at),
        response_created_at: response.created_at
          ? formatTimeString(response.created_at)
          : null,
        response_id: response.id ?? null,
        status: response.status ?? null,
        organization_id:
          request.helicone_org_id ?? "00000000-0000-0000-0000-000000000000",
      },
    ]),
    clickhouseDb.dbInsertClickhouse("response_copy_v3", [
      {
        auth_hash: request.auth_hash,
        user_id: request.user_id,
        request_id: request.id,
        completion_tokens: response.completion_tokens ?? null,
        latency: response.delay_ms ?? null,
        model: ((response.body as any)?.model as string) || null,
        prompt_tokens: response.prompt_tokens ?? null,
        request_created_at: formatTimeString(request.created_at),
        response_created_at: response.created_at
          ? formatTimeString(response.created_at)
          : null,
        response_id: response.id ?? null,
        status: response.status ?? null,
        organization_id:
          request.helicone_org_id ?? "00000000-0000-0000-0000-000000000000",
      },
    ]),
    clickhouseDb.dbInsertClickhouse("provider_log", [
      {
        auth_hash: request.auth_hash,
        user_id: request.user_id,
        request_id: request.id,
        completion_tokens: response.completion_tokens ?? null,
        latency: response.delay_ms ?? null,
        model: ((response.body as any)?.model as string) || null,
        prompt_tokens: response.prompt_tokens ?? null,
        request_created_at: formatTimeString(request.created_at),
        response_created_at: response.created_at
          ? formatTimeString(response.created_at)
          : null,
        response_id: response.id ?? null,
        status: response.status ?? null,
        organization_id:
          request.helicone_org_id ?? "00000000-0000-0000-0000-000000000000",
        feedback_id: null,
        feedback_created_at: null,
        rating: null,
      },
    ]),
    clickhouseDb.dbInsertClickhouse(
      "properties_copy_v1",
      properties.map((p) => ({
        key: p.key,
        value: p.value,
        user_id: p.user_id ?? null,
        auth_hash: request.auth_hash ?? null,
        request_id: request.id ?? null,
        created_at: p.created_at ? formatTimeString(p.created_at) : null,
        id: p.id ?? 0,
      }))
    ),
  ]);
}

export async function insertProviderInClickHouse(
  clickhouseDb: ClickhouseClientWrapper,
  request: Database["public"]["Tables"]["request"]["Row"],
  response: Database["public"]["Tables"]["response"]["Insert"],
  feedback: Database["public"]["Tables"]["feedback"]["Row"]
) {
  await clickhouseDb.dbInsertClickhouse("provider_log", [
    {
      auth_hash: request.auth_hash,
      user_id: request.user_id,
      request_id: request.id,
      completion_tokens: response.completion_tokens ?? null,
      latency: response.delay_ms ?? null,
      model: ((response.body as any)?.model as string) || null,
      prompt_tokens: response.prompt_tokens ?? null,
      request_created_at: formatTimeString(request.created_at),
      response_created_at: response.created_at
        ? formatTimeString(response.created_at)
        : null,
      response_id: response.id ?? null,
      status: response.status ?? null,
      organization_id:
        request.helicone_org_id ?? "00000000-0000-0000-0000-000000000000",
      feedback_id: feedback.id,
      feedback_created_at: formatTimeString(feedback.created_at),
      rating: feedback.rating,
    },
  ]);
}
