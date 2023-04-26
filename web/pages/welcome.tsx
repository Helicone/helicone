import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { User, useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import BasePageV2 from "../components/shared/layout/basePageV2";
import MetaData from "../components/shared/metaData";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import WelcomePage from "../components/templates/welcome/welcomePage";
import { requestOverLimit } from "../lib/checkRequestLimit";
import { getKeys } from "../services/lib/keys";
import { Database } from "../supabase/database.types";

interface DashboardProps {
  user: User;
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

const Dashboard = (props: DashboardProps) => {
  const { user, keys } = props;

  return (
    <MetaData title="Welcome">
      <BasePageV2>
        <WelcomePage user={user} keys={keys} />
      </BasePageV2>
    </MetaData>
  );
};

export default Dashboard;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = createServerSupabaseClient(context);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  const [{ data: keyData }, isRequestLimitOver] = await Promise.all([
    getKeys(supabase),
    requestOverLimit(supabase),
  ]);

  if (isRequestLimitOver) {
    return {
      redirect: {
        destination: "/usage",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: user,
      keys: keyData,
    },
  };
};
