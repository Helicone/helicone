import { ReactElement, useMemo, useState } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { SessionContent } from "../../components/templates/sessions/sessionId/SessionContent";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import {
  convertRealtimeRequestToSteps,
  isRealtimeRequest,
} from "../../lib/sessions/realtimeSession";
import { sessionFromHeliconeRequests } from "../../lib/sessions/sessionsFromHeliconeTequests";
import { useGetRequests } from "../../services/hooks/requests";

const SessionDetail = ({ session_id }: { session_id: string }) => {
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
          properties: {
            "Helicone-Session-Id": {
              equals: session_id as string,
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
  // -> Create session object
  const session = sessionFromHeliconeRequests(processedRequests);

  // Extract session name from requests properties (use original requests for this)
  const sessionName = useMemo(() => {
    const reqs = requestsHookResult.requests.requests ?? [];
    for (const req of reqs) {
      if (req.properties && req.properties["Helicone-Session-Name"]) {
        return req.properties["Helicone-Session-Name"] as string;
      }
    }
    return "Unnamed"; // Default if not found
  }, [requestsHookResult.requests.requests]);

  return (
    <SessionContent
      session={session}
      session_id={session_id}
      session_name={sessionName}
      requests={requestsHookResult}
      isLive={isLive}
      setIsLive={setIsLive}
    />
  );
};

SessionDetail.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default SessionDetail;

export const getServerSideProps = withAuthSSR(async (options) => {
  const session_id = options.context.query.session_id;
  const decodedSessionId =
    typeof session_id === "string"
      ? decodeURIComponent(session_id)
      : session_id;
  return {
    props: {
      session_id: decodedSessionId,
    },
  };
});
