import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { FilterNode } from "../../../lib/api/metrics/filters";
import { Database } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
import AuthLayout from "../../shared/layout/authLayout";
import { Filters } from "./filters";

import { MetricsPanel } from "./metricsPanel";
import TimeGraphWHeader from "./timeGraphWHeader";

interface DashboardPageProps {
  user: User;
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

const DashboardPage = (props: DashboardPageProps) => {
  const { user, keys } = props;
  const client = useSupabaseClient();
  const [filter, setFilter] = useState<FilterNode>("all");

  return (
    <AuthLayout user={user}>
      <AuthHeader
        title={"Dashboard"}
        actions={<Filters keys={keys} filter={filter} setFilter={setFilter} />}
      />

      <div className="space-y-16">
        <MetricsPanel filters={filter} />
        <TimeGraphWHeader
          client={client}
          filter={filter}
          setFilter={setFilter}
        />
      </div>
    </AuthLayout>
  );
};

export default DashboardPage;
