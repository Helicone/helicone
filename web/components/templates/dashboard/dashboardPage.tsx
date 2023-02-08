import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { User } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import AuthLayout from "../../shared/layout/authLayout";

import { MetricsPanel } from "./metricsPanel";
import TimeGraphWHeader from "./timeGraphWHeader";

interface DashboardPageProps {
  user: User;
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

const DashboardPage = (props: DashboardPageProps) => {
  const { user, keys } = props;
  const client = useSupabaseClient();

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
          <div className="flex flex-row items-center gap-2">
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              Key Name:
            </label>
            <select
              id="location"
              name="location"
              className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-6 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              defaultValue={25}
              onChange={(e) => {
                // TODO: add key change handler
                console.log(e.target.value);
              }}
            >
              {keys.map((key) => (
                <option key={key.api_key_hash} value={key.api_key_hash}>
                  {key.key_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="space-y-16 mt-4">
        <MetricsPanel />
        <TimeGraphWHeader client={client} />
      </div>
    </AuthLayout>
  );
};

export default DashboardPage;
