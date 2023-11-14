import { Database } from "../../../supabase/database.types";
import { Result } from "../../results";
import { ClickhouseClientWrapper, ClickhouseDB } from "../db/clickhouse";

export function formatTimeString(timeString: string): string {
  return new Date(timeString).toISOString().replace("Z", "");
}

function buildPropertyWithResponseInserts(
  request: Database["public"]["Tables"]["request"]["Row"],
  response: Database["public"]["Tables"]["response"]["Insert"],
  properties: Database["public"]["Tables"]["properties"]["Insert"][]
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
  node: {
    id: string | null;
    job: string | null;
  },
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
        job_id: node.job,
        node_id: node.id,
        proxy_key_id: request.helicone_proxy_key_id ?? null,
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
    clickhouseDb.dbInsertClickhouse(
      "properties_copy_v2",
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

export async function insertFeedback(
  clickhouseDb: ClickhouseClientWrapper,
  feedback: Database["public"]["Tables"]["feedback"]["Row"],
  request: Database["public"]["Tables"]["request"]["Row"]
): Promise<Result<string, string>> {
  console.log(feedback.created_at);
  const feedbackCreatedAt = formatTimeString(feedback.created_at);
  console.log(feedbackCreatedAt);
  const requestCreatedAt = formatTimeString(request.created_at);
  const currentCreatedAt = formatTimeString(new Date().toISOString());

  const feedbackLog = {
    feedback_id: feedback.id,
    rating: feedback.rating ? 1 : 0,
    feedback_created_at: feedbackCreatedAt,
    request_id: request.id,
    request_created_at: requestCreatedAt,
    response_id: feedback.response_id,
    organization_id:
      request.helicone_org_id ?? "00000000-0000-0000-0000-000000000000",
    user_id: request.user_id,
    created_at: currentCreatedAt,
  };

  return await clickhouseDb.dbInsertClickhouse("feedback", [feedbackLog]);
}

export async function addFeedbackToResponse(
  clickhouseDb: ClickhouseClientWrapper,
  feedback: Database["public"]["Tables"]["feedback"]["Insert"][]
): Promise<Result<null, string>> {
  const updateQueries: string[] = [];

  for (const fb of feedback) {
    const { response_id, created_at, id, rating } = fb;

    const updateQuery = `
      UPDATE feedback_created_at = '${formatTimeString(
        created_at ?? new Date().toISOString()
      )}',
          feedback_id = '${id}',
          rating = ${rating ? "1" : "0"}
      WHERE response_id = '${response_id}'`;

    updateQueries.push(updateQuery);
  }

  const batchUpdateQuery = `ALTER TABLE default.response_copy_v3 ${updateQueries.join(
    ", "
  )}`;

  const updateResult = await clickhouseDb.dbUpdateClickhouse(batchUpdateQuery);

  if (updateResult.error) {
    console.error(`Error updating response_copy_v3: ${updateResult.error}`);
    return { error: updateResult.error, data: null };
  }

  return { error: null, data: null };
}
