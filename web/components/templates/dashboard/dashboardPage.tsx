import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { User } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
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
      <AuthHeader
        title={"Dashboard"}
        actions={
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
              className="flex w-full max-w-sm rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
        }
      />
      <div className="space-y-16">
        <MetricsPanel />
        <TimeGraphWHeader client={client} />
      </div>
    </AuthLayout>
  );
};

export default DashboardPage;
