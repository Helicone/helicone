import { Dispatch, SetStateAction } from "react";
import { Loading } from "../components/templates/dashboard/dashboardPage";
import { CostOverTime } from "../pages/api/metrics/costOverTime";
import { ErrorOverTime } from "../pages/api/metrics/errorOverTime";
import {
  FilterLeaf,
  FilterNode,
  filterListToTree,
} from "../services/lib/filters/filterDefs";
import { Metrics } from "./api/metrics/metrics";
import { OverTimeRequestQueryParams } from "./api/metrics/timeDataHandlerWrapper";
import { Result } from "./result";
import {
  RequestsOverTime,
  TimeIncrement,
} from "./timeCalculations/fetchTimeData";

import { getTimeInterval } from "./timeCalculations/time";

export const initialGraphDataState: GraphDataState = {
  requestsOverTime: "loading",
  costOverTime: "loading",
};

export interface GraphDataState {
  requestsOverTime: Loading<Result<RequestsOverTime[], string>>;
  costOverTime: Loading<Result<CostOverTime[], string>>;
}

/**
 * Fetches data over a specified time period.
 *
 * @template T - The type of data to fetch.
 * @param {Object} timeFilter - The time filter object containing start and end dates.
 * @param {Date} timeFilter.start - The start date of the time period.
 * @param {Date} timeFilter.end - The end date of the time period.
 * @param {FilterLeaf[]} userFilters - The user filters to apply.
 * @param {TimeIncrement} dbIncrement - The time increment for the database.
 * @param {string} path - The path for the API endpoint.
 * @returns {Promise<Result<T[], string>>} - A promise that resolves to the fetched data or an error message.
 */
async function fetchDataOverTime<T>(
  timeFilter: {
    start: Date;
    end: Date;
  },
  userFilters: FilterLeaf[],
  dbIncrement: TimeIncrement,
  path: string
) {
  const body: OverTimeRequestQueryParams = {
    timeFilter: {
      start: timeFilter.start.toISOString(),
      end: timeFilter.end.toISOString(),
    },
    userFilters,
    dbIncrement,
    timeZoneDifference: new Date().getTimezoneOffset(),
  };
  return await fetch(`/api/metrics/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).then((res) => res.json() as Promise<Result<T[], string>>);
}

/**
 * Retrieves dashboard data based on the specified time filter and user filters.
 * @param timeFilter - The time filter object containing the start and end dates.
 * @param userFilters - An array of filter leaf objects.
 * @param setMetrics - A function to set the metrics state.
 * @param setGraphData - A function to set the graph data state.
 */
export async function getDashboardData(
  timeFilter: {
    start: Date;
    end: Date;
  },
  userFilters: FilterLeaf[],
  setMetrics: (m: Loading<Result<Metrics, string>>) => void,
  setGraphData: Dispatch<SetStateAction<GraphDataState>>
) {
  setMetrics("loading");
  setGraphData(initialGraphDataState);
  const timeInterval = getTimeInterval(timeFilter);
  fetchDataOverTime<RequestsOverTime>(
    timeFilter,
    userFilters,
    timeInterval,
    "requestOverTime"
  ).then(({ data, error }) => {
    if (error !== null) {
      console.error(error);
      setGraphData((prev) => ({
        ...prev,
        requestsOverTime: { error, data: null },
      }));
    } else {
      setGraphData((prev) => ({
        ...prev,
        requestsOverTime: {
          data: data.map((d) => ({
            count: +d.count,
            time: new Date(d.time),
          })),
          error,
        },
      }));
    }
  });

  fetchDataOverTime<CostOverTime>(
    timeFilter,
    userFilters,
    timeInterval,
    "costOverTime"
  ).then(({ data, error }) => {
    if (error !== null) {
      console.error(error);
      setGraphData((prev) => ({
        ...prev,
        costOverTime: { error, data: null },
      }));
    } else {
      setGraphData((prev) => ({
        ...prev,
        costOverTime: {
          data: data.map((d) => ({
            cost: +d.cost,
            time: new Date(d.time),
          })),
          error,
        },
      }));
    }
  });

  fetchDataOverTime<ErrorOverTime>(
    timeFilter,
    userFilters,
    timeInterval,
    "errorOverTime"
  ).then(({ data, error }) => {
    if (error !== null) {
      console.error(error);
      setGraphData((prev) => ({
        ...prev,
        costOverTime: { error, data: null },
      }));
    } else {
      setGraphData((prev) => ({
        ...prev,
        errorOverTime: {
          data: data.map((d) => ({
            count: +d.count,
            time: new Date(d.time),
          })),
          error,
        },
      }));
    }
  });

  const filter: FilterNode = {
    right: {
      left: {
        response_copy_v3: {
          request_created_at: {
            gte: timeFilter.start,
          },
        },
      },
      operator: "and",
      right: {
        response_copy_v3: {
          request_created_at: {
            lte: timeFilter.end,
          },
        },
      },
    },
    operator: "and",
    left: filterListToTree(userFilters, "and"),
  };

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
