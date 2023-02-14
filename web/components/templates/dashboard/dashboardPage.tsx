import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { FilterLeaf, FilterNode } from "../../../lib/api/metrics/filters";
import { Result } from "../../../lib/result";
import {
  TimeData,
  TimeIncrement,
} from "../../../lib/timeCalculations/fetchTimeData";
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
async function fetchGraphData(
  client: SupabaseClient,
  filter: FilterNode,
  dbIncrement: TimeIncrement
) {
  return await fetch("/api/metrics/requestsGraph", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter,
      dbIncrement,
    }),
  }).then((res) => res.json() as Promise<Result<TimeData[], string>>);
}

const validTimeWindow = (filter: FilterNode): boolean => {
  const start = (filter as FilterLeaf).request?.created_at?.gte;
  const end = (filter as FilterLeaf).request?.created_at?.lte;
  return start !== undefined && end !== undefined;
};

const getTimeInterval = (filter: FilterNode): TimeIncrement => {
  const start = (filter as FilterLeaf).request?.created_at?.gte;
  const end = (filter as FilterLeaf).request?.created_at?.lte;
  if (!validTimeWindow(filter)) {
    throw new Error("Invalid filter");
  }
  const startD = new Date(start!);
  const endD = new Date(end!);
  const diff = endD.getTime() - startD.getTime();
  if (diff < 1000 * 60 * 60 * 2) {
    return "min";
  } else if (diff < 1000 * 60 * 60 * 24 * 7) {
    return "hour";
  } else {
    return "day";
  }
};

const DashboardPage = (props: DashboardPageProps) => {
  const { user, keys } = props;
  const client = useSupabaseClient();
  const [data, setData] = useState<TimeData[]>([]);
  const [filter, setFilter] = useState<FilterNode>("all");
  useEffect(() => {
    if (validTimeWindow(filter)) {
      console.log("fetching data");
      fetchGraphData(client, filter, getTimeInterval(filter)).then(
        ({ data, error }) => {
          if (error !== null) {
            console.error(error);
          } else {
            console.log("data", data);
            setData(
              data.map((d) => ({ count: +d.count, time: new Date(d.time) }))
            );
          }
        }
      );
    }
  }, [client, filter, setFilter]);
  console.log(data);

  return (
    <AuthLayout user={user}>
      <AuthHeader
        title={"Dashboard"}
        actions={<Filters keys={keys} filter={filter} setFilter={setFilter} />}
      />

      <div className="space-y-16">
        <MetricsPanel filters={filter} />
        <TimeGraphWHeader data={data} setFilter={setFilter} />
      </div>
    </AuthLayout>
  );
};

export default DashboardPage;
