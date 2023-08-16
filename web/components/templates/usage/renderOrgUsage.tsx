import { useQuery } from "@tanstack/react-query";
import { endOfMonth, formatISO } from "date-fns";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { TimeIncrement } from "../../../lib/timeCalculations/fetchTimeData";
import { getTimeInterval } from "../../../lib/timeCalculations/time";
import { Result, resultMap } from "../../../lib/result";
import { filterListToTree } from "../../../services/lib/filters/filterDefs";
import MainGraph from "../dashboard/graphs/mainGraph";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import { useEffect, useState } from "react";
import { RenderBarChart } from "../../shared/metrics/barChart";

interface RenderOrgUsageProps {
  currentMonth: Date;
  requestCount: number;
}

function formatNumberString(
  numString: string,
  minimumFractionDigits?: boolean
) {
  const num = parseFloat(numString);
  if (minimumFractionDigits) {
    return num.toLocaleString("en-US", { minimumFractionDigits: 2 });
  } else {
    return num.toLocaleString("en-US");
  }
}

const RenderOrgUsage = (props: RenderOrgUsageProps) => {
  const { currentMonth, requestCount } = props;

  const startOfMonthFormatted = formatISO(currentMonth, {
    representation: "date",
  });

  const endOfMonthFormatted = formatISO(endOfMonth(currentMonth), {
    representation: "date",
  });

  const timeFilter: {
    start: Date;
    end: Date;
  } = {
    start: new Date(startOfMonthFormatted),
    end: new Date(endOfMonthFormatted),
  };

  const { data, isLoading, refetch } = useRequestsOverTime({
    timeFilter,
  });

  //   refetch if the current month changes
  useEffect(() => {
    refetch();
  }, [currentMonth]);

  const chartData = data?.data.map((d: any) => ({
    value: +d.count,
    time: new Date(d.time),
  }));

  return (
    <MainGraph
      isLoading={isLoading}
      dataOverTime={chartData}
      timeMap={getTimeMap("day")}
      title={"Requests"}
      value={formatNumberString(requestCount.toString())}
      valueLabel={"requests"}
      type="bar"
    />
  );
};

const useRequestsOverTime = (props: {
  timeFilter: {
    start: Date;
    end: Date;
  };
}) => {
  const { timeFilter } = props;
  const timeIncrement = getTimeInterval(timeFilter);
  const params = {
    timeFilter: {
      start: timeFilter.start.toISOString(),
      end: timeFilter.end.toISOString(),
    },
    filter: filterListToTree([], "and"),
    dbIncrement: timeIncrement,
    timeZoneDifference: new Date().getTimezoneOffset(),
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["requestOverTime"],
    queryFn: async () => {
      const data = await fetch("/api/metrics/requestOverTime", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(params),
      }).then((res) => res.json());

      return data;
    },
  });
  return {
    data,
    isLoading,
    refetch,
  };
};

export default RenderOrgUsage;
