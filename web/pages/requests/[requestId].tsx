import { User } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import AuthHeader from "../../components/shared/authHeader";
import AuthLayout from "../../components/shared/layout/authLayout";
import MetaData from "../../components/shared/metaData";
import RequestIdPage from "../../components/templates/requestId/requestIdPage";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";

interface RequestIdProps {
  user: User;
  requestId: string;
}

const RequestId = (props: RequestIdProps) => {
  const { user, requestId } = props;

  return (
    <MetaData title="Request ID">
      <AuthLayout user={user}>
        <AuthHeader
          title={`${requestId}`}
          breadcrumb={{
            title: "Requests",
            href: "/requests",
          }}
        />
        <RequestIdPage requestId={requestId} />
      </AuthLayout>
    </MetaData>
  );
};

export default RequestId;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { requestId } = ctx.query;
  // Create authenticated Supabase Client
  const supabase = new SupabaseServerWrapper(ctx).getClient();
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  return {
    props: {
      requestId,
      initialSession: session,
      user: session.user,
    },
  };
};
