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
import { useOrg } from "../components/shared/layout/organizationContext";

interface UsageProps {
  user: User;
}

const Usage = (props: UsageProps) => {
  const { user } = props;

  const org = useOrg();

  return (
    <MetaData title="Usage">
      <AuthLayout user={user}>
        <AuthHeader title={"Usage"} />
        {!org?.currentOrg ? (
          <h1>Loading...</h1>
        ) : (
          <UsagePage org={org?.currentOrg!} />
        )}
      </AuthLayout>
    </MetaData>
  );
};

export default Usage;

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

  await getOrCreateUserSettings(session.user);

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  };
};
