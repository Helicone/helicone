import { ReactElement, useMemo } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { withAuthSSR } from "../../lib/api/handlerWrappers";

import { useGetRequests } from "../../services/hooks/requests";

import { sessionFromHeliconeRequests } from "../../lib/sessions/sessionsFromHeliconeTequests";
import { SessionContent } from "../../components/templates/sessions/sessionId/SessionContent";

const SessionDetail = ({ session_id }: { session_id: string }) => {
  const ThreeMonthsAgo = useMemo(() => {
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 * 3);
  }, []);

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
    false
  );

  const session = sessionFromHeliconeRequests(requests.requests.requests ?? []);

  return (
    <SessionContent
      session={session}
      session_id={session_id as string}
      requests={requests}
    />
  );
};

SessionDetail.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default SessionDetail;

export const getServerSideProps = withAuthSSR(async (options) => {
  const session_id = options.context.query.session_id;
  return {
    props: {
      user: options.userData.user,
      session_id,
    },
  };
});
