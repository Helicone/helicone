import { useParams } from "react-router";
import { SessionContent } from "./sessionId/SessionContent";
import { useGetRequests } from "@/services/hooks/requests";
import { useMemo, useState } from "react";
import {
  convertRealtimeRequestToSteps,
  isRealtimeRequest,
} from "@/lib/sessions/realtimeSession";
import { sessionFromHeliconeRequests } from "@/lib/sessions/sessionsFromHeliconeTequests";
import { EMPTY_SESSION_NAME } from "./sessionId/SessionContent";

export default function SessionDetailShell() {
  const { session_id, name: session_name } = useParams();
  const decodedSessionId = session_id ? decodeURIComponent(session_id) : "";
  const decodedSessionName = session_name
    ? decodeURIComponent(session_name)
    : "";

  const ThreeMonthsAgo = useMemo(() => {
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 * 3);
  }, []);

  const [isLive, setIsLive] = useState(false);
  const requestsHookResult = useGetRequests(
    1,
    1000,
    {
      left: {
        request_response_rmt: {
          properties:
            decodedSessionName !== EMPTY_SESSION_NAME
              ? {
                  "Helicone-Session-Id": {
                    equals: decodedSessionId,
                  },
                  "Helicone-Session-Name": {
                    equals: decodedSessionName,
                  },
                }
              : {
                  "Helicone-Session-Id": {
                    equals: decodedSessionId,
                  },
                },
        },
      },
      operator: "and",
      right: {
        request_response_rmt: {
          request_created_at: {
            gt: ThreeMonthsAgo,
          },
        },
      },
    },
    {
      created_at: "desc",
    },
    false,
    isLive
  );

  // Process requests: Check for realtime session and convert if necessary
  const processedRequests = useMemo(() => {
    const rawRequests = requestsHookResult.requests.requests ?? [];

    // Iterate through all requests. If a request is realtime, convert it to steps.
    // Otherwise, keep the original request. Flatten the result.
    return rawRequests.flatMap((request) => {
      if (isRealtimeRequest(request)) {
        return convertRealtimeRequestToSteps(request);
      } else {
        return [request]; // Keep non-realtime requests as a single-element array for flatMap
      }
    });
  }, [requestsHookResult.requests.requests]);

  const session = sessionFromHeliconeRequests(processedRequests);

  return (
    <SessionContent
      session={session}
      session_id={decodedSessionId}
      session_name={decodedSessionName}
      requests={requestsHookResult}
      isLive={isLive}
      setIsLive={setIsLive}
    />
  );
}
