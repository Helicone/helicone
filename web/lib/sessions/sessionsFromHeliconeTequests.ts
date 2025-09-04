import { heliconeRequestToMappedContent } from "@helicone-package/llm-mapper/utils/getMappedContent";
import { HeliconeRequest } from "@helicone-package/llm-mapper/types";
import { Session, Trace } from "./sessionTypes";

export function sessionFromHeliconeRequests(
  requests: HeliconeRequest[],
): Session {
  if (requests.length === 0) {
    return {
      start_time_unix_timestamp_ms: 0,
      end_time_unix_timestamp_ms: 0,
      session_id: "0",
      session_tags: [],
      session_cost: 0,
      traces: [],
    };
  }

  // Sort the requests by creation time ascending to ensure correct session boundaries
  // and trace order, especially crucial for simulated realtime steps.
  const sortedRequests = [...requests].sort((a, b) => {
    const timeA = a.request_created_at
      ? new Date(a.request_created_at).getTime()
      : 0;
    const timeB = b.request_created_at
      ? new Date(b.request_created_at).getTime()
      : 0;
    return timeA - timeB;
  });

  const firstRequest = sortedRequests[0];
  const lastRequest = sortedRequests[sortedRequests.length - 1];

  return {
    start_time_unix_timestamp_ms: new Date(
      firstRequest.request_created_at,
    ).getTime(),
    end_time_unix_timestamp_ms: new Date(
      lastRequest.response_created_at ?? lastRequest.request_created_at, // Fallback to request time if response time is missing
    ).getTime(),
    session_id: firstRequest.request_properties?.[
      "Helicone-Session-Id"
    ] as string,
    session_tags: [],
    session_cost: sortedRequests.reduce((total, r) => total + (r.cost ?? 0), 0),
    traces: sortedRequests // Use sortedRequests here
      .map((request) => {
        const x: Trace = {
          start_unix_timestamp_ms: new Date(
            request.request_created_at,
          ).getTime(),
          end_unix_timestamp_ms: new Date(
            request.response_created_at ?? request.request_created_at, // Fallback to request time if response time is missing
          ).getTime(),
          properties: Object.entries(request.request_properties ?? {})
            .filter(([key]) => key.startsWith("Helicone-") === false)
            .reduce(
              (acc, [key, value]) => {
                acc[key] = value as string;
                return acc;
              },
              {} as Record<string, string>,
            ),
          path:
            (request.request_properties?.["Helicone-Session-Path"] as string) ??
            "/",
          request_id: request.request_id,
          request: heliconeRequestToMappedContent(request),
        };
        return x;
      }),
  };
}
