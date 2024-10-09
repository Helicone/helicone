import { Menu } from "@headlessui/react";
import { useEffect, useState } from "react";
import { clsx } from "../clsx";
import useNotification from "../notification/useNotification";
import useSearchParams from "../utils/useSearchParams";
import { TimeFilter } from "../../templates/dashboard/dashboardPage";
import { ProFeatureWrapper } from "../ProBlockerComponents/ProFeatureWrapper";
import { ThemedTimeFilterShadCN } from "./themedTimeFilterShadCN";

interface ThemedTimeFilterProps {
  timeFilterOptions: { key: string; value: string }[];
  onSelect: (key: string, value: string) => void;
  isFetching: boolean;
  defaultValue: string;
  currentTimeFilter: TimeFilter;
  custom?: boolean;
}

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

const ThemedTimeFilter = (props: ThemedTimeFilterProps) => {
  const {
    timeFilterOptions,
    onSelect,
    defaultValue,
    isFetching,
    currentTimeFilter,
    custom = false,
  } = props;
  const { setNotification } = useNotification();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<string>(defaultValue);

  const [startDate, setStartDate] = useState<string | undefined>(
    formatDateToInputString(currentTimeFilter?.start) || undefined
  );
  const [endDate, setEndDate] = useState<string | undefined>(
    formatDateToInputString(currentTimeFilter?.end) || undefined
  );

  const isActive = (key: string) => {
    return active === key;
  };

  const [relative, setRelative] = useState<
    "minute" | "hour" | "day" | "week" | "month"
  >("day");
  const [relativeValue, setRelativeValue] = useState<number>(1);

  useEffect(() => {
    if (relative && relativeValue) {
      let startDate = new Date().getTime();

      if (relative === "minute") {
        startDate -= relativeValue * 60 * 1000;
      } else if (relative === "hour") {
        startDate -= relativeValue * 60 * 60 * 1000;
      } else if (relative === "day") {
        startDate -= relativeValue * 24 * 60 * 60 * 1000;
      } else if (relative === "week") {
        startDate -= relativeValue * 7 * 24 * 60 * 60 * 1000;
      } else if (relative === "month") {
        startDate -= relativeValue * 30 * 24 * 60 * 60 * 1000;
      }

      setStartDate(formatDateToInputString(new Date(startDate)));
      setEndDate(
        formatDateToInputString(new Date(new Date().getTime() + 1000))
      );
    }
  }, [relative, relativeValue]);

  return (
    <Menu
      as="div"
      className="relative inline-flex text-left z-10 shadow-sm h-fit w-fit isolate rounded-lg"
    >
      {custom && (
        <ThemedTimeFilterShadCN
          className="rounded-l-lg"
          onDateChange={(newDate) => {
            if (newDate?.from && newDate?.to) {
              const start = new Date(newDate.from);
              const end = new Date(newDate.to);
              searchParams.set(
                "t",
                `custom_${start.toISOString()}_${end.toISOString()}`
              );
              setActive("custom");
              onSelect("custom", `${start.toISOString()}_${end.toISOString()}`);
            }
          }}
          initialDateRange={{
            from: currentTimeFilter?.start,
            to: currentTimeFilter?.end,
          }}
        />
      )}

      {timeFilterOptions.map((option, idx) =>
        ["3M", "All"].includes(option.value) ? (
          <ProFeatureWrapper featureName="time_filter" key={option.key}>
            <button
              key={option.key}
              type="button"
              disabled={isFetching}
              onClick={() => {
                searchParams.set("t", option.key);
                setActive(option.key);
                onSelect(option.key, option.value);
              }}
              className={clsx(
                "text-gray-900 dark:text-gray-100",
                isActive(option.key)
                  ? "bg-sky-200 border-sky-300 border dark:bg-sky-800 dark:border-sky-700"
                  : "bg-white hover:bg-sky-50 border-gray-300 dark:bg-black dark:hover:bg-sky-900 dark:border-gray-700",
                idx === timeFilterOptions.length - 1 ? "rounded-r-lg" : "",
                !custom && idx === 0
                  ? "relative inline-flex items-center rounded-l-lg border px-3 py-1.5 text-sm font-medium focus:z-10 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                  : "relative -ml-px inline-flex items-center border px-3 py-1.5 text-sm font-medium focus:z-10 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              )}
            >
              {option.value}
            </button>
          </ProFeatureWrapper>
        ) : (
          <button
            key={option.key}
            type="button"
            disabled={isFetching}
            onClick={() => {
              searchParams.set("t", option.key);
              setActive(option.key);
              onSelect(option.key, option.value);
            }}
            className={clsx(
              "text-gray-900 dark:text-gray-100",
              isActive(option.key)
                ? "bg-sky-200 border-sky-300 border dark:bg-sky-800 dark:border-sky-700"
                : "bg-white hover:bg-sky-50 border-gray-300 dark:bg-black dark:hover:bg-sky-900 dark:border-gray-700",
              idx === timeFilterOptions.length - 1 ? "rounded-r-lg" : "",
              !custom && idx === 0
                ? "relative inline-flex items-center rounded-l-lg border px-3 py-1.5 text-sm font-medium focus:z-10 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                : "relative -ml-px inline-flex items-center border px-3 py-1.5 text-sm font-medium focus:z-10 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            )}
          >
            {option.value}
          </button>
        )
      )}
    </Menu>
  );
};

export default ThemedTimeFilter;
