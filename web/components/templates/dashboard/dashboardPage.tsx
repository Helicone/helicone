import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/router";
import AuthLayout from "../../shared/layout/authLayout";

import { MetricsPanel } from "./metricsPanel";
import TimeGraphWHeader from "./timeGraphWHeader";

interface DashboardPageProps {
  user: User;
}

const DashboardPage = (props: DashboardPageProps) => {
  const {} = props;
  const user = useUser();
  const client = useSupabaseClient();
  const router = useRouter();

  const stats = [
    { name: "Total Subscribers", stat: "71,897" },
    { name: "Avg. Open Rate", stat: "58.16%" },
    { name: "Avg. Click Rate", stat: "24.57%" },
    { name: "Avg. Open Rate", stat: "58.16%" },
    { name: "Avg. Click Rate", stat: "24.57%" },
  ];

  return (
    <AuthLayout>
      <div className="space-y-16">
        <MetricsPanel />
        {/* <div className="h-20 bg-yellow-500">
        <Logs />
      </div> */}

        <TimeGraphWHeader client={client} />
      </div>
    </AuthLayout>
  );
};

export default DashboardPage;
