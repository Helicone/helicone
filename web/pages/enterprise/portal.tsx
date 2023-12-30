import { User } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import MetaData from "../../components/shared/metaData";
import AuthLayout from "../../components/shared/layout/authLayout";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";
import PortalPage from "../../components/templates/enterprise/portal/portalPage";

interface PortalProps {
  user: User;
}

const Portal = (props: PortalProps) => {
  const { user } = props;

  return (
    <MetaData title="Customer Portal">
      <AuthLayout user={user}>
        <PortalPage />
      </AuthLayout>
    </MetaData>
  );
};

export default Portal;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
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
      initialSession: session,
      user: session.user,
    },
  };
};
