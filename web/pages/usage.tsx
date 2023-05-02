import {
  createServerSupabaseClient,
  User,
} from "@supabase/auth-helpers-nextjs";

import { GetServerSidePropsContext } from "next";
import AuthHeader from "../components/shared/authHeader";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import UsagePage from "../components/templates/usage/usagePage";
import { getUserSettings } from "../services/lib/user";
import {
  getOrCreateUserSettings,
  UserSettingsResponse,
} from "./api/user_settings";

interface UsageProps {
  user: User;
  userSettings: UserSettingsResponse;
}

const Usage = (props: UsageProps) => {
  const { user } = props;

  return (
    <MetaData title="Usage">
      <AuthLayout user={user}>
        <AuthHeader title={"Usage"} />
        <UsagePage user={user} />
      </AuthLayout>
    </MetaData>
  );
};

export default Usage;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient(ctx);
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
