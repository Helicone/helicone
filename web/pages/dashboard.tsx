import { User, useUser } from "@supabase/auth-helpers-react";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { checkOnboardedAndUpdate } from "./api/user/checkOnboarded";
import { init } from "commandbar";

import { useEffect } from "react";
import { GetServerSidePropsContext } from "next";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";

interface DashboardProps {
  user: User;
}

const Dashboard = (props: DashboardProps) => {
  const { user } = props;

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_COMMAND_BAR_HELPHUB_0) return;
    if (typeof window !== "undefined") {
      init(process.env.NEXT_PUBLIC_COMMAND_BAR_HELPHUB_0 ?? "");
      window.CommandBar.boot(user.id);
    }

    return () => {
      window.CommandBar.shutdown();
    };
  }, [user]);

  return (
    <MetaData title="Dashboard">
      <AuthLayout user={user!}>
        <DashboardPage />
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
