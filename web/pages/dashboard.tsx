import { User } from "@supabase/auth-helpers-react";
import { init } from "commandbar";
import { User } from "@supabase/auth-helpers-react";
import { init } from "commandbar";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";

import { useEffect, useState } from "react";
import { useOrg } from "../components/shared/layout/organizationContext";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Result } from "../lib/result";
import { useGetAuthorized } from "../services/hooks/dashboard";
import UpgradeProModal from "../components/shared/upgradeProModal";
import { useTheme } from "../components/shared/theme/themeContext";

interface DashboardProps {
  user: User;
}

const Dashboard = (props: DashboardProps) => {
  const { user } = props;
  const theme = useTheme();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_COMMAND_BAR_HELPHUB_0) return;
    if (typeof window !== "undefined") {
      init(process.env.NEXT_PUBLIC_COMMAND_BAR_HELPHUB_0 ?? "");
      window.CommandBar.boot(user.id);
      theme?.theme === "dark"
        ? window.CommandBar.setTheme("dark")
        : window.CommandBar.setTheme("light");
    }

    return () => {
      window.CommandBar.shutdown();
    };
  }, [theme?.theme, user]);

  return (
    <MetaData title="Dashboard">
      <AuthLayout user={user!}>
        <DashboardPage user={user} />
      </AuthLayout>
    </MetaData>
  );
};

export default Dashboard;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user, orgHasOnboarded },
    userData: { user, orgHasOnboarded },
    supabaseClient,
  } = options;

  if (!orgHasOnboarded) {
    return {
      redirect: {
        destination: "/welcome",
        permanent: false,
      },
    };
  }

  if (!orgHasOnboarded) {
    return {
      redirect: {
        destination: "/welcome",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
});
