import { ReactElement, useMemo, useState } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import {
  EMPTY_SESSION_NAME,
  HELICONE_EMPTY_SESSION_NAME,
  SessionContent,
} from "../../../components/templates/sessions/sessionId/SessionContent";
import { withAuthSSR } from "../../../lib/api/handlerWrappers";
import {
  convertRealtimeRequestToSteps,
  isRealtimeRequest,
} from "../../../lib/sessions/realtimeSession";
import { sessionFromHeliconeRequests } from "../../../lib/sessions/sessionsFromHeliconeTequests";
import { useGetRequests } from "../../../services/hooks/requests";

export const SessionDetail = ({
  session_id,
  session_name,
}: {
  session_id: string;
  session_name: string;
}) => {
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
            "Helicone-Session-Name": {
              equals: session_name as string, // A hackright now but users that actually name it "Unnamed" will specifically filter the ones that are ""
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
      session_id={session_id}
      session_name={session_name}
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
  const { session_id, name: session_name } = options.context.query;

  const decodedSessionId =
    typeof session_id === "string"
      ? decodeURIComponent(session_id)
      : session_id;

  const decodedSessionName =
    typeof session_name === "string"
      ? decodeURIComponent(session_name)
      : session_name;

  return {
    props: {
      session_id: decodedSessionId,
      session_name: decodedSessionName,
    },
  };
});
