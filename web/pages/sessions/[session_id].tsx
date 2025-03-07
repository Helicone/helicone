import { ReactElement, useMemo, useState } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { SessionContent } from "../../components/templates/sessions/sessionId/SessionContent";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import { sessionFromHeliconeRequests } from "../../lib/sessions/sessionsFromHeliconeTequests";
import { useGetRequests } from "../../services/hooks/requests";

const SessionDetail = ({ session_id }: { session_id: string }) => {
  const ThreeMonthsAgo = useMemo(() => {
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 * 3);
  }, []);

  const [isLive, setIsLive] = useState(true);
  const requests = useGetRequests(
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

  const session = sessionFromHeliconeRequests(requests.requests.requests ?? []);

  return (
    <SessionContent
      session={session}
      session_id={session_id as string}
      requests={requests}
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
      user: options.userData.user,
      session_id: decodedSessionId,
    },
  };
});
