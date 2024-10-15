import getNormalizedRequest from "../../components/templates/requestsV2/builder/requestBuilder";
import { modelCost } from "../api/metrics/costCalc";
import { HeliconeRequest } from "../api/request/request";
import { Session, Trace } from "./sessionTypes";

export function sessionFromHeliconeRequests(
  requests: HeliconeRequest[]
): Session {
  if (requests.length === 0) {
    return {
      start_time_unix_timestamp_ms: 0,
      end_time_unix_timestamp_ms: 0,
      session_id: "0",
      session_tags: [],
      session_cost_usd: 0,
      traces: [],
    };
  }

  const firstRequest = requests[requests.length - 1];
  const lastRequest = requests[0];

  return {
    start_time_unix_timestamp_ms: new Date(
      firstRequest.request_created_at
    ).getTime(),
    end_time_unix_timestamp_ms: new Date(
      lastRequest.response_created_at ?? Date.now().toString()
    ).getTime(),
    session_id: firstRequest.request_properties?.[
      "Helicone-Session-Id"
    ] as string,
    session_tags: [],
    session_cost_usd: requests
      .map((r) =>
        modelCost({
          model: r.model_override ?? r.request_model ?? r.response_model ?? "",
          provider: r.provider,
          sum_completion_tokens: r.completion_tokens ?? 0,
          sum_prompt_tokens: r.prompt_tokens ?? 0,
          sum_tokens: r.completion_tokens ?? 0 + (r.prompt_tokens ?? 0),
        })
      )
      .reduce((a, b) => a + b, 0),
    traces: requests
      .map((request) => {
        const x: Trace = {
          start_unix_timestamp_ms: new Date(
            request.request_created_at
          ).getTime(),
          end_unix_timestamp_ms: new Date(
            request.response_created_at ?? Date.now().toString()
          ).getTime(),
          properties: Object.entries(request.request_properties ?? {})
            .filter(([key]) => key.startsWith("Helicone-") === false)
            .reduce((acc, [key, value]) => {
              acc[key] = value as string;
              return acc;
            }, {} as Record<string, string>),
          path:
            (request.request_properties?.["Helicone-Session-Path"] as string) ??
            "/",
          request_id: request.request_id,
          request: getNormalizedRequest(request),
        };
        return x;
      })
      .sort((a, b) => a.start_unix_timestamp_ms - b.start_unix_timestamp_ms),
  };
}
