import { useState } from "react";
import { useOrgPlanPage } from "../organization/plan/useOrgPlanPage";
import {
  addMonths,
  endOfMonth,
  formatISO,
  isAfter,
  startOfMonth,
  subMonths,
} from "date-fns";
import StyledAreaChart from "../dashboard/styledAreaChart";
import { BarChart } from "@tremor/react";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import useNotification from "../../shared/notification/useNotification";

interface RateLimitPageProps {}

const RateLimitPage = (props: RateLimitPageProps) => {
  const {} = props;

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const timeIncrement = "day";

  const startOfMonthFormatted = formatISO(currentMonth, {
    representation: "date",
  });
  const endOfMonthFormatted = formatISO(endOfMonth(currentMonth), {
    representation: "date",
  });

  const {
    overTimeData,
    metrics,
    refetch: refetchData,
    isLoading,
  } = useOrgPlanPage({
    timeFilter: {
      start: currentMonth,
      end: endOfMonth(currentMonth),
    },
    timeZoneDifference: 0,
    dbIncrement: timeIncrement,
  });

  const nextMonth = () => {
    setCurrentMonth((prevMonth) => startOfMonth(addMonths(prevMonth, 1)));
  };

  const prevMonth = () => {
    setCurrentMonth((prevMonth) => startOfMonth(subMonths(prevMonth, 1)));
  };

  const getMonthName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("default", { month: "long" });
  };

  const isNextMonthDisabled = isAfter(addMonths(currentMonth, 1), new Date());
  const { setNotification } = useNotification();

  return (
    <div className="mt-8 flex flex-col text-gray-900 max-w-2xl space-y-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-row space-x-4 items-center">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <h1 className="text-4xl font-semibold tracking-wide text-black dark:text-white">
            {getMonthName(startOfMonthFormatted + 1)}
          </h1>
          {!isNextMonthDisabled && (
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="text-md text-gray-900 dark:text-gray-100">
          Below is a summary of how many times your organization has been
          rate-limited in the last month. Please contact us at{" "}
          <button
            onClick={() => {
              // copy the email to the clipboard
              navigator.clipboard.writeText("sales@helicone.ai");
              setNotification("Email copied to clipboard", "success");
            }}
            className="text-blue-500 underline"
          >
            sales@helicone.ai
          </button>{" "}
          to increase your rate-limit.
        </p>
      </div>
      {!isLoading && metrics.totalRateLimits.data && (
        <div key="rate-limit">
          <StyledAreaChart
            title={"Rate-Limits this month"}
            value={metrics.totalRateLimits.data.data?.toString() ?? ""}
            isDataOverTimeLoading={false}
          >
            <BarChart
              className="h-[14rem]"
              data={
                overTimeData.rateLimits.data?.data?.map((r) => ({
                  date: getTimeMap(timeIncrement)(r.time),
                  "rate-limits": r.count,
                })) ?? []
              }
              index="date"
              categories={["rate-limits"]}
              colors={["cyan"]}
              showYAxis={false}
            />
          </StyledAreaChart>
        </div>
      )}
    </div>
  );
};

export default RateLimitPage;
