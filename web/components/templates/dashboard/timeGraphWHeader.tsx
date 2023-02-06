import { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import DateMetrics from "./timeGraph";

interface TimeGraphWHeaderProps {
  client: SupabaseClient;
}

interface TimeLength {
  label: string;
  value: TimeInterval;
}

export type TimeInterval = "1m" | "7d" | "24h" | "1h";

const TimeGraphWHeader = (props: TimeGraphWHeaderProps) => {
  const { client } = props;
  const [interval, setInterval] = useState<TimeInterval>("1m");

  const timeLength: TimeLength[] = [
    { label: "1 Month", value: "1m" },
    { label: "7 Days", value: "7d" },
    { label: "24 Hours", value: "24h" },
    { label: "1 Hour", value: "1h" },
  ];

  const actions = () => {
    return timeLength.map((time) => {
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
          onClick={() => setInterval(time.value)}
        >
          {time.label}
        </button>
      );
    });
  };

  return (
    <div className="h-full w-full">
      <div className="border-b border-gray-200 pb-4 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Requests over time
        </h3>
        <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-row gap-4">
          {actions()}
        </div>
      </div>
      <div className="w-full h-72 mt-8">
        <DateMetrics client={client} timeLength={interval} />
      </div>
    </div>
  );
};

export default TimeGraphWHeader;
