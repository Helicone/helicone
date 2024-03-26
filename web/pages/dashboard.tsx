import { User } from "@supabase/auth-helpers-react";
import { ReactElement, useEffect, useState } from "react";

import AuthLayout from "../components/layout/authLayout";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { useTheme } from "../components/shared/theme/themeContext";
import { useLocalStorage } from "../services/hooks/localStorage";
import {
  OrganizationFilter,
  OrganizationLayout,
} from "../services/lib/organization_layout/organization_layout";
import LoadingAnimation from "../components/shared/loadingAnimation";
import { Result } from "../lib/result";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { supabaseServer } from "../lib/supabaseServer";

interface DashboardProps {
  user: User;
  currentFilter: OrganizationFilter;
}

const Dashboard = (props: DashboardProps) => {
  const { user, currentFilter } = props;
  const theme = useTheme();

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

  return <DashboardPage user={user} currentFilter={currentFilter} />;
};

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user, orgHasOnboarded, orgId },
  } = options;
  const { context } = options;

  if (!orgHasOnboarded) {
    return {
      redirect: {
        destination: "/welcome",
        permanent: false,
      },
    };
  }

  const { data: orgLayout, error: organizationLayoutError } =
    await supabaseServer
      .from("organization_layout")
      .select("*")
      .eq("organization_id", orgId)
      .eq("type", "dashboard")
      .single();

  if (!orgLayout || organizationLayoutError) {
    return {
      props: {
        user,
        currentFilter: null,
      },
    };
  }

  const filterId = context.query.filter as string;

  const filters: OrganizationFilter[] = JSON.parse(orgLayout.filters as string);

  const currentFilter = filters.find((x) => x.id === filterId);

  return {
    props: {
      user,
      currentFilter: currentFilter ?? null,
    },
  };
});
