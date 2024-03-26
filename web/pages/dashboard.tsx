import { User } from "@supabase/auth-helpers-react";
import { ReactElement, useEffect, useState } from "react";

import AuthLayout from "../components/layout/authLayout";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { useTheme } from "../components/shared/theme/themeContext";
import { useLocalStorage } from "../services/hooks/localStorage";
import { OrganizationFilter } from "../services/lib/organization_layout/organization_layout";
import LoadingAnimation from "../components/shared/loadingAnimation";

interface DashboardProps {
  user: User;
}

const Dashboard = (props: DashboardProps) => {
  const { user } = props;
  const theme = useTheme();
  const [currentFilter, setCurrentFilter] = useLocalStorage<
    OrganizationFilter | undefined
  >("dashboard-filter", undefined);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   if (!process.env.NEXT_PUBLIC_COMMAND_BAR_HELPHUB_0) return;
  //   if (typeof window !== "undefined") {
  //     init(process.env.NEXT_PUBLIC_COMMAND_BAR_HELPHUB_0 ?? "");
  //     window.CommandBar.boot(user.id);
  //     theme?.theme === "dark"
  //       ? window.CommandBar.setTheme("dark")
  //       : window.CommandBar.setTheme("light");
  //   }

  //   return () => {
  //     window.CommandBar.shutdown();
  //   };
  // }, [theme?.theme, user]);

  useEffect(() => {
    setIsLoading(false);
  }, [currentFilter]);

  return isLoading ? (
    <LoadingAnimation />
  ) : (
    <DashboardPage
      user={user}
      currentFilter={currentFilter}
      onChangeCurrentFilter={setCurrentFilter}
    />
  );
};

Dashboard.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Dashboard;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user, orgHasOnboarded },
  } = options;

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
