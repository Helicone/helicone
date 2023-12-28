import { useRouter } from "next/router";
import FilterBadge from "../../../ui/filters/filterBadge";
import { clsx } from "../../../shared/clsx";
import { useEffect, useState } from "react";
import { TimeFilter } from "../../dashboard/dashboardPage";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../../lib/timeCalculations/time";
import useNotification from "../../../shared/notification/useNotification";

interface TimeFilterBadgeProps {}

function formatDateToInputString(date: Date): string {
  if (!date) {
    return "";
  }
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-11 in JavaScript
  const DD = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const MI = String(date.getMinutes()).padStart(2, "0");

  return `${YYYY}-${MM}-${DD}T${HH}:${MI}`;
}

const TimeFilterBadge = (props: TimeFilterBadgeProps) => {
  const {} = props;

  const router = useRouter();
  const { setNotification } = useNotification();

  const getTimeRange = () => {
    // get t from query params
    const currentTimeFilter = router.query.t as string;

    let range: TimeFilter;

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const start = currentTimeFilter.split("_")[1]
        ? new Date(currentTimeFilter.split("_")[1])
        : getTimeIntervalAgo("24h");
      const end = new Date(currentTimeFilter.split("_")[2] || new Date());
      range = {
        start,
        end,
      };
    } else {
      range = {
        start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || "24h"),
        end: new Date(),
      };
    }
    return range;
  };

  const [startDate, setStartDate] = useState<string | undefined>(
    formatDateToInputString(
      getTimeRange().start || getTimeIntervalAgo("24h")
    ) || undefined
  );
  const [endDate, setEndDate] = useState<string | undefined>(
    formatDateToInputString(getTimeRange().end || getTimeIntervalAgo("24h")) ||
      undefined
  );

  const timeOptions = [
    { key: "24h", value: "24H" },
    { key: "7d", value: "7D" },
    { key: "1m", value: "1M" },
    { key: "3m", value: "3M" },
    { key: "all", value: "All" },
  ];

  const timeQuery = router.query.t as string;

  const [timeLabel, setTimeLabel] = useState<string>();

  useEffect(() => {
    if (timeQuery === undefined) {
      return;
    } else {
      if (timeQuery.split("_")[0] === "custom") {
        setTimeLabel("Custom");
      } else {
        setTimeLabel(timeQuery);
      }
    }
  }, [timeQuery]);

  return (
    <FilterBadge
      title="Created At"
      label={timeLabel || undefined}
      clearFilter={() => {
        // remove t from query params
        const query = { ...router.query };
        delete query.t;
        router.push({ pathname: router.pathname, query }, undefined, {
          shallow: false,
        });
      }}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex flex-row divide-x divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg">
          {timeOptions.map((option, idx) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                router.push({
                  pathname: router.pathname,
                  query: { ...router.query, t: option.key },
                });

                const range = getTimeIntervalAgo(option.key as TimeInterval);
                setStartDate(formatDateToInputString(range));
                setEndDate(formatDateToInputString(new Date()));
              }}
              className={clsx(
                idx === timeOptions.length - 1 ? "rounded-r-lg" : "",
                idx === 0 ? "rounded-l-lg" : "",
                router.query.t === option.key
                  ? "bg-sky-200 border-sky-300 dark:bg-sky-800 dark:border-sky-700"
                  : "bg-white hover:bg-sky-50 border-gray-300 dark:bg-black dark:hover:bg-sky-900 dark:border-gray-700",
                " text-black w-full flex justify-center p-2 text-xs font-semibold"
              )}
            >
              {option.value}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Start Date
            </label>
            <div className="mt-1">
              <input
                type="datetime-local"
                name="startDate"
                id="startDate"
                onChange={(e) => {
                  setStartDate(e.target.value);
                }}
                value={startDate}
                className="bg-gray-50 dark:bg-gray-900 text-black dark:text-white block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              End Date
            </label>
            <div className="mt-1">
              <input
                type="datetime-local"
                name="endDate"
                id="endDate"
                onChange={(e) => {
                  setEndDate(e.target.value);
                }}
                value={endDate}
                className="bg-gray-50 dark:bg-gray-900 text-black dark:text-white block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        <div className="py-1 w-full flex flex-row gap-3 items-center justify-end">
          <button
            onClick={() => close()}
            className="items-center rounded-md bg-white dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm flex font-semibold text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!startDate || !endDate) {
                setNotification("Please select a start and end date", "error");
                return;
              }
              if (endDate && startDate > endDate) {
                setNotification("Start date must be before end date", "error");
                return;
              }
              if (startDate && startDate < startDate) {
                setNotification("End date must be after start date", "error");
                return;
              }
              const start = new Date(startDate as string);
              const end = new Date(endDate as string);
              router.push({
                pathname: router.pathname,
                query: {
                  ...router.query,
                  t: `custom_${start.toISOString()}_${end.toISOString()}`,
                },
              });
              close();
            }}
            className="items-center rounded-md bg-black dark:bg-white px-3 py-1.5 text-sm flex font-semibold text-white dark:text-black dark:hover:bg-gray-200 shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Save
          </button>
        </div>
      </div>
    </FilterBadge>
  );
};

export default TimeFilterBadge;
