import { User, useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import MetaData from "../components/shared/metaData";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { DEMO_EMAIL } from "../lib/constants";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { getKeys } from "../services/lib/keys";
import { Database } from "../supabase/database.types";
import AuthLayout from "../components/shared/layout/authLayout";

interface DashboardProps {
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

const Dashboard = (props: DashboardProps) => {
  const { keys } = props;
  const user = useUser();
  return (
    <MetaData title="Dashboard">
      <AuthLayout user={user!}>
        <DashboardPage keys={keys} />
      </AuthLayout>
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
  if (user?.email === DEMO_EMAIL) {
    const { data: keyData } = await getKeys(supabase);
    return {
      props: {
        user: user,
        keys: keyData,
      },
    };
  } else {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
};
