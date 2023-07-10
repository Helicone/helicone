import { User, useUser } from "@supabase/auth-helpers-react";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import DashboardPage from "../components/templates/dashboard/dashboardPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { checkOnboardedAndUpdate } from "./api/user/checkOnboarded";
import { init } from "commandbar";

import { useEffect, useState } from "react";
import { useOrg } from "../components/shared/layout/organizationContext";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Result } from "../lib/result";
import { useUserSettings } from "../services/hooks/userSettings";
import { useGetAuthorized } from "../services/hooks/dashboard";
import UpgradeProModal from "../components/shared/upgradeProModal";

interface DashboardProps {
  user: User;
}

const Dashboard = (props: DashboardProps) => {
  const { user } = props;

  const { authorized } = useGetAuthorized(user.id);
  const [open, setOpen] = useState(false);

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

  if (authorized) {
    return (
      <>
        <MetaData title="Dashboard">
          <AuthLayout user={user!}>
            <div className="flex flex-col items-center justify-center h-[90vh]">
              <p className="text-2xl font-semibold text-gray-900">
                You have reached your monthly limit of 100,000 requests.
              </p>
              <p className="mt-4 text-lg font-semibold text-gray-700">
                Upgrade to a paid plan to view your dashboard.
              </p>
              <button
                onClick={() => {
                  setOpen(true);
                }}
                className="mt-8 items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Upgrade to Pro
              </button>
            </div>
          </AuthLayout>
        </MetaData>
        <UpgradeProModal open={open} setOpen={setOpen} />
      </>
    );
  }

  return (
    <MetaData title="Dashboard">
      <AuthLayout user={user!}>
        <DashboardPage />
      </AuthLayout>
    </MetaData>
  );
};

export default Dashboard;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user },
    supabaseClient,
  } = options;

  return {
    props: {
      user,
    },
  };
});
