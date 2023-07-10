import { User, useUser } from "@supabase/auth-helpers-react";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { checkOnboardedAndUpdate } from "./api/user/checkOnboarded";
import { init } from "commandbar";

import { useEffect } from "react";

interface DashboardProps {
  user: User;
}

const Dashboard = (props: DashboardProps) => {
  const user = useUser();

  useEffect(() => {
    if (!user) return;
    if (!process.env.NEXT_PUBLIC_COMMAND_BAR_HELPHUB_0) return;
    if (typeof window !== "undefined") {
      init(process.env.NEXT_PUBLIC_COMMAND_BAR_HELPHUB_0 ?? "");
      window.CommandBar.boot(user.id);
    }

    return () => {
      window.CommandBar.shutdown();
    };
  }, [user]);

  if (!user) return null;

  return (
    <MetaData title="Dashboard">
      <AuthLayout user={user}>
        <DashboardPage user={user} />
      </AuthLayout>
    </MetaData>
  );
};

export default Dashboard;
