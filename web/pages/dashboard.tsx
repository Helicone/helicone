import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { User, useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import MetaData from "../components/shared/metaData";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { getRequestCount } from "../lib/api/request/request";
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
    <MetaData title="Dashboard">
      <DashboardPage user={user} keys={keys} />
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
        destination: "/login",
        permanent: false,
      },
    };

  const [{ data: keyData }, isRequestLimitOver, { data: count }] =
    await Promise.all([
      getKeys(supabase),
      requestOverLimit(supabase),
      getRequestCount(user.id, "all"),
    ]);
  console.log(count);
  if (keyData?.length === 0 || (count ?? 0) === 0) {
    return {
      redirect: {
        destination: "/welcome",
        permanent: false,
      },
    };
  }

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
