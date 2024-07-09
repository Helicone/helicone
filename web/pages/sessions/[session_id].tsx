import { ReactElement } from "react";
import AuthLayout from "../../components/layout/authLayout";
import { withAuthSSR } from "../../lib/api/handlerWrappers";

import { useGetRequests } from "../../services/hooks/requests";

import SessionContent from "../../components/templates/sessions/sessionId/SessionContent";
import { sessionFromHeliconeRequests } from "../../lib/sessions/sessionsFromHeliconeTequests";

const SessionDetail = ({ session_id }: { session_id: string }) => {
  const requests = useGetRequests(
    1,
    100,
    {
      properties: {
        "Helicone-Session-Id": {
          equals: session_id as string,
        },
      },
    },
    {
      created_at: "desc",
    },
    false,
    false
  );

  const session = sessionFromHeliconeRequests(
    requests.requests.data?.data ?? []
  );

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
