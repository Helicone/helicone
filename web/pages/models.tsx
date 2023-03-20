import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { User, useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import ModelPage from "../components/templates/models/modelPage";

interface ModelProps {
  user: User;
}

const Dashboard = (props: ModelProps) => {
  const { user } = props;

  return (
    <MetaData title="Dashboard">
      <AuthLayout user={user}>
        <ModelPage />
      </AuthLayout>
    </MetaData>
  );
};

export default Dashboard;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = createServerSupabaseClient(context);
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
