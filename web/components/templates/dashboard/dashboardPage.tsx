import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { SetStateAction, useEffect, useState } from "react";
import { FilterLeaf, FilterNode } from "../../../lib/api/metrics/filters";
import { Metrics } from "../../../lib/api/metrics/metrics";
import { Result } from "../../../lib/result";
import { timeGraphConfig } from "../../../lib/timeCalculations/constants";
import {
  TimeData,
  TimeIncrement,
} from "../../../lib/timeCalculations/fetchTimeData";
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
export async function fetchGraphData(
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

export const getTimeInterval = (filter: FilterNode): TimeIncrement => {
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

export type Loading<T> = T | "loading";

async function getDashboardData(
  filter: FilterNode,
  setMetrics: (m: Loading<Result<Metrics, string>>) => void,
  setData: (d: Loading<Result<TimeData[], string>>) => void
) {
  if (validTimeWindow(filter)) {
    setMetrics("loading");
    setData("loading");
    fetchGraphData(filter, getTimeInterval(filter)).then(({ data, error }) => {
      if (error !== null) {
        console.error(error);
        setData({ error, data: null });
      } else {
        setData({
          data: data.map((d) => ({ count: +d.count, time: new Date(d.time) })),
          error: null,
        });
      }
    });
    fetch("/api/metrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filter),
    })
      .then((res) => res.json() as Promise<Result<Metrics, string>>)
      .then(({ data, error }) => {
        if (error !== null) {
          console.error(error);
          setMetrics({ error, data: null });
        } else {
          setMetrics({
            data: {
              ...data,
              last_request: new Date(data.last_request),
              first_request: new Date(data.first_request),
            },
            error: null,
          });
        }
      });
  }
}

const DashboardPage = (props: DashboardPageProps) => {
  const { user, keys } = props;
  const client = useSupabaseClient();
  const [timeData, setTimeData] =
    useState<Loading<Result<TimeData[], string>>>("loading");

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
