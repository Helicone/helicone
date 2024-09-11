import { User } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../../../components/layout/auth/authLayout";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";
import PortalPage from "../../../components/templates/enterprise/portal/portalPage";
import { ReactElement } from "react";

interface PortalProps {
  user: User;
}

const Portal = (props: PortalProps) => {
  const { user } = props;

  return <PortalPage />;
};

Portal.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
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
