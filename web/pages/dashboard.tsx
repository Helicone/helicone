import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import MetaData from "../components/shared/metaData";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { requestOverLimit } from "../lib/checkRequestLimit";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
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
  const supabase = new SupabaseServerWrapper(context).getClient();
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
  if (keyData?.length === 0) {
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
