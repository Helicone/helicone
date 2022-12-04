import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchLastXTimeData,
  TimeData,
  TimeIncrement,
} from "../lib/fetchTimeData";
import {
  getXDaysAgoFloored,
  getXHoursAgoFloored,
  getXMinuteasAgoFloored,
} from "../lib/getXHoursAgo";
import { classNames } from "../lib/tsxHelpers";

const RenderLineChart = ({
  data,
  timeMap,
}: {
  data: TimeData[];
  timeMap: (date: Date) => string;
}) => {
  const chartData = data.map((d) => ({
    time: timeMap(d.time),
    count: d.count,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="count" stroke="#8884d8" />
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="time" />
        <YAxis />
      </LineChart>
    </ResponsiveContainer>
  );
};
interface TimeGraphConfig {
  timeMap: (date: Date) => string;
  increment: (date: Date) => Date;
  dbIncrement: TimeIncrement;
  start: Date;
  end: Date;
}

type TimeLength = "1m" | "7d" | "24h" | "1h";
const timeGraphConfig: Record<TimeLength, TimeGraphConfig> = {
  "1h": {
    timeMap: (date) => date.toLocaleTimeString(),
    increment: (date) => new Date(date.getTime() + 120 * 1000), // every 2 minutes
    dbIncrement: "min",
    start: getXMinuteasAgoFloored(60),
    end: getXMinuteasAgoFloored(0),
  },
  "24h": {
    timeMap: (date) => date.toLocaleTimeString(),
    increment: (date) => new Date(date.getTime() + 60 * 60 * 1000), // every 2 hours
    dbIncrement: "hour",
    start: getXHoursAgoFloored(24),
    end: getXHoursAgoFloored(0),
  },
  "7d": {
    timeMap: (date) => date.toLocaleDateString(),
    increment: (date) => new Date(date.getTime() + 24 * 60 * 60 * 1000), // every day
    dbIncrement: "day",
    start: getXDaysAgoFloored(7),
    end: getXDaysAgoFloored(0),
  },
  "1m": {
    timeMap: (date) => date.toLocaleDateString(),
    increment: (date) => new Date(date.getTime() + 24 * 60 * 60 * 1000), // every day
    dbIncrement: "day",
    start: getXDaysAgoFloored(30),
    end: getXHoursAgoFloored(0),
  },
};

export function DateMetrics({ client }: { client: SupabaseClient }) {
  const allTimeLengths: TimeLength[] = ["1m", "7d", "24h", "1h"];
  const [timeLength, setTimeLength] = useState<TimeLength>("1m");
  const [data, setData] = useState<TimeData[]>([]);
  const pillStyle = "px-2 py-1 rounded-full text-xs cursor-pointer";

  const selectedPillStyle =
    "bg-slate-600 text-slate-200 dark:bg-slate-700 dark:text-slate-100 hover:bg-slate-600 hover:text-slate-100";
  const unselectedPillStyle = "dark:text-slate-300  border-slate-700 border";

  const getStyle = (tL: TimeLength) =>
    classNames(
      pillStyle,
      timeLength === tL ? selectedPillStyle : unselectedPillStyle
    );
  useEffect(() => {
    fetchLastXTimeData(
      client,
      timeGraphConfig[timeLength].dbIncrement,
      timeGraphConfig[timeLength].increment,
      timeGraphConfig[timeLength].start,
      timeGraphConfig[timeLength].end
    ).then(({ data, error }) => {
      if (error !== null) {
        console.error(error);
      } else {
        setData(data);
      }
    });
  }, [client, timeLength]);

  return (
    <div className="h-full w-full flex flex-col items-center">
      <RenderLineChart
        data={data}
        timeMap={timeGraphConfig[timeLength].timeMap}
      />
      <div className="flex flex-row gap-10">
        {allTimeLengths.map((tL) => (
          <div
            className={getStyle(tL)}
            onClick={() => {
              setTimeLength(tL);
            }}
            key={tL}
          >
            {tL}
          </div>
        ))}
      </div>
    </div>
  );
}
