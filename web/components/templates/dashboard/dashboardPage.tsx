import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { User } from "@supabase/supabase-js";
import { SetStateAction, useEffect, useState } from "react";
import { FilterNode } from "../../../lib/api/metrics/filters";
import { Metrics } from "../../../lib/api/metrics/metrics";
import {
  getDashboardData,
  GraphDataState,
  initialGraphDataState,
} from "../../../lib/dashboardGraphs";
import { Result } from "../../../lib/result";
import { timeGraphConfig } from "../../../lib/timeCalculations/constants";
import { TimeInterval } from "../../../lib/timeCalculations/time";
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

export type Loading<T> = T | "loading";

const DashboardPage = (props: DashboardPageProps) => {
  const { user, keys } = props;
  const client = useSupabaseClient();
  const [timeData, setTimeData] = useState<GraphDataState>(
    initialGraphDataState
  );

  const [metrics, setMetrics] =
    useState<Loading<Result<Metrics, string>>>("loading");
  const [interval, setInterval] = useState<TimeInterval>("1m");
  const [filter, _setFilter] = useState<FilterNode>({
    request: {
      created_at: {
        gte: timeGraphConfig["1m"].start.toISOString(),
        lte: timeGraphConfig["1m"].end.toISOString(),
      },
    },
  });
  const setFilter = (f: SetStateAction<FilterNode>) => {
    if (typeof f === "function") {
      f = f(filter);
    }
    _setFilter(f);
    getDashboardData(f, setMetrics, setTimeData);
  };

  useEffect(() => {
    getDashboardData(filter, setMetrics, setTimeData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthLayout user={user}>
      <AuthHeader
        title={"Dashboard"}
        actions={<Filters keys={keys} filter={filter} setFilter={setFilter} />}
      />

      <div className="space-y-16">
        <MetricsPanel filters={filter} metrics={metrics} />
        <TimeGraphWHeader
          data={timeData}
          setFilter={setFilter}
          interval={interval}
          setInterval={setInterval}
        />
      </div>
    </AuthLayout>
  );
};

export default DashboardPage;
