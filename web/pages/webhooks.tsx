import { User } from "@supabase/auth-helpers-nextjs";

import { GetServerSidePropsContext } from "next";
import AuthHeader from "../components/shared/authHeader";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import UsagePage from "../components/templates/usage/usagePage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { stripeServer } from "../utlis/stripeServer";
import {
  getOrCreateUserSettings,
  UserSettingsResponse,
} from "./api/user_settings";
import WebhooksPage from "../components/templates/webhooks/webhooksPage";

interface WebhooksProps {
  user: User;
}

const Webhooks = (props: WebhooksProps) => {
  const { user } = props;

  return (
    <MetaData title="Webhook">
      <AuthLayout user={user}>
        <AuthHeader title={"Webhooks"} />
        <WebhooksPage user={user} />
      </AuthLayout>
    </MetaData>
  );
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
