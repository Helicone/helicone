import { Dispatch, SetStateAction } from "react";
import { timeGraphConfig } from "../../../lib/timeCalculations/constants";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

interface TimeLength {
  label: string;
  mobile: string;
  value: TimeInterval;
}

export const TimeActions = (props: {
  setFilter: Dispatch<SetStateAction<FilterNode>>;
  interval: TimeInterval;
  onIntervalChange: (interval: TimeInterval) => void;
}) => {
  const { setFilter, interval, onIntervalChange } = props;
  const timeLength: TimeLength[] = [
    { label: "3 Months", mobile: "3mo", value: "3m" },
    { label: "1 Month", mobile: "1mo", value: "1m" },
    { label: "7 Days", mobile: "7d", value: "7d" },
    { label: "24 Hours", mobile: "24hr", value: "24h" },
    { label: "1 Hour", mobile: "1hr", value: "1h" },
  ];

  return (
    <>
      {timeLength.map((time) => {
        return (
          <button
            key={time.value}
            type="button"
            className={`inline-flex items-center rounded-md border ${
              interval === time.value
                ? "border-transparent bg-black"
                : "border-black bg-white hover:bg-gray-200"
            } px-4 py-2 text-sm font-medium ${
              interval === time.value ? "text-white" : "text-black"
            } shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`}
            onClick={() => {
              onIntervalChange(time.value);
            }}
          >
            <span className="hidden sm:inline">{time.label}</span>
            <span className="inline sm:hidden">{time.mobile}</span>
          </button>
        );
      })}
    </>
  );
};
