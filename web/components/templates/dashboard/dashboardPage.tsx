import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import AuthLayout from "../../shared/layout/authLayout";
import { Filters } from "./filters";

import { MetricsPanel } from "./metricsPanel";
import TimeGraphWHeader from "./timeGraphWHeader";

interface DashboardPageProps {
  user: User;
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

export interface FilterLeaf {
  key: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike";
  value: string;
}

export interface FilterBranch {
  left: FilterNode;
  operator: "and"; // Can add more later
  right: FilterNode;
}

export type FilterNode = FilterLeaf | FilterBranch | "all";

const DashboardPage = (props: DashboardPageProps) => {
  const { user, keys } = props;
  const client = useSupabaseClient();

  const [filter, setFilter] = useState<FilterNode>("all");

  return (
    <AuthLayout user={user}>
      <div className="sm:flex sm:items-center border-b border-gray-200 pb-4">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          {/* <p className="mt-2 text-sm text-gray-700">
              Showing the latest 100 requests
            </p> */}
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Filters keys={keys} filter={filter} setFilter={setFilter} />
        </div>
      </div>
      <div className="space-y-16 mt-4">
        <MetricsPanel filter={filter} />
        <TimeGraphWHeader client={client} filter={filter} />
      </div>
    </AuthLayout>
  );
};

export default DashboardPage;
