import { User } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { DEMO_EMAIL } from "../lib/constants";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";

interface DashboardProps {
  user: User;
}

const Dashboard = (props: DashboardProps) => {
  const { user } = props;
  return (
    <MetaData title="Dashboard">
      <AuthLayout user={user}>
        <DashboardPage user={user} />
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
    return {
      props: {
        user: user,
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
