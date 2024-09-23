import { User } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import { ReactElement } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import WebhooksPage from "../components/templates/webhooks/webhooksPage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";

interface WebhooksProps {
  user: User;
}

const Webhooks = (props: WebhooksProps) => {
  const { user } = props;

  return <WebhooksPage user={user} />;
};
Webhooks.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Webhooks;

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
