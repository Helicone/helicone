import {
  createServerSupabaseClient,
  User,
} from "@supabase/auth-helpers-nextjs";

import { GetServerSidePropsContext } from "next";
import MetaData from "../components/shared/metaData";
import BillingPage from "../components/templates/usage/usagePage";
import { UserSettingsResponse } from "./api/user_settings";

interface UsageProps {
  user: User;
  userSettings: UserSettingsResponse;
}

const Usage = (props: UsageProps) => {
  const { user } = props;

  return (
    <MetaData title="Usage">
      <BillingPage user={user} />
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
        destination: "/login",
        permanent: false,
      },
    };

  // const data = await getUserSettings();

  return {
    props: {
      initialSession: session,
      user: session.user,
      // userSettings: data,
    },
  };
};
