import {
  ArrowTopRightOnSquareIcon,
  ExclamationCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { SupabaseClient, User } from "@supabase/supabase-js";
import Link from "next/link";
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
      timeZoneDifference: new Date().getTimezoneOffset(),
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
      {keys.length === 0 ? (
        <div className="space-y-16">
          <div className="text-center mt-24">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-xl font-medium text-gray-900">
              No OpenAI API Keys found
            </h3>
            <p className="mt-1 text-lg text-gray-500">
              Go to the keys page to add a key and get started.
            </p>
            <div className="mt-6">
              <Link
                href="/keys"
                className="inline-flex items-center rounded-md bg-gradient-to-r from-sky-600 to-indigo-500 bg-origin-border px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <ArrowTopRightOnSquareIcon
                  className="-ml-1 mr-2 h-5 w-5"
                  aria-hidden="true"
                />
                Key Page
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-16">
          <MetricsPanel filters={filter} metrics={metrics} />
          <TimeGraphWHeader
            data={timeData}
            setFilter={setFilter}
            interval={interval}
            setInterval={setInterval}
          />
        </div>
      )}
    </AuthLayout>
  );
};

export default DashboardPage;
