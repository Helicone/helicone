import { useQuery } from "@tanstack/react-query";
import { endOfMonth, formatISO } from "date-fns";
import { useEffect } from "react";
import { getTimeInterval } from "../../../../lib/timeCalculations/time";
import { filterListToTree } from "@helicone-package/filters/helpers";
import StyledAreaChart from "../../dashboard/styledAreaChart";
import { AreaChart } from "@tremor/react";

interface RenderOrgPlanProps {
  currentMonth: Date;
  requestCount: number;
}

function formatNumberString(
  numString: string,
  minimumFractionDigits?: boolean,
) {
  const num = parseFloat(numString);
  if (minimumFractionDigits) {
    return num.toLocaleString("en-US", { minimumFractionDigits: 2 });
  } else {
    return num.toLocaleString("en-US");
  }
}

const RenderOrgPlan = (props: RenderOrgPlanProps) => {
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
  }, [currentMonth, refetch]);

  const chartData = data?.data.map((d: any) => {
    // if the date is in the future, return null
    if (new Date(d.time) > new Date()) {
      return {
        requests: null,
        date: new Date(d.time).toLocaleDateString(),
      };
    } else {
      return {
        requests: +d.count,
        date: new Date(d.time).toLocaleDateString(),
      };
    }
  });

  return (
    <StyledAreaChart
      title={"Requests"}
      value={formatNumberString(requestCount.toString())}
      isDataOverTimeLoading={isLoading}
    >
      <AreaChart
        className="-ml-4 h-[14rem]"
        data={chartData}
        index="date"
        categories={["requests"]}
        colors={["green"]}
        curveType="monotone"
      />
    </StyledAreaChart>
  );
};

export const useRequestsOverTime = (props: {
  timeFilter: {
    start: Date;
    end: Date;
  };
  organizationId?: string;
}) => {
  const { timeFilter } = props;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["requestOverTime", props.organizationId, timeFilter],
    queryFn: async (query) => {
      const orgId = query.queryKey[1];
      const timeFilter = query.queryKey[2] as {
        start: Date;
        end: Date;
      };

      const timeIncrement = getTimeInterval(timeFilter);
      const params = {
        timeFilter: {
          start: timeFilter.start.toISOString(),
          end: timeFilter.end.toISOString(),
        },
        filter: filterListToTree([], "and"),
        dbIncrement: timeIncrement,
        timeZoneDifference: new Date().getTimezoneOffset(),
        organizationId: orgId,
      };

      const data = await fetch("/api/metrics/requestOverTime", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(params),
      }).then((res) => res.json());

      return data;
    },
    refetchOnWindowFocus: false,
    // 1 minute refetch interval
    refetchInterval: 60_000,
  });

  return {
    data,
    isLoading,
    refetch,
  };
};

export default RenderOrgPlan;
