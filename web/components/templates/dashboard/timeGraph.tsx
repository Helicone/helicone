import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchLastXTimeData,
  TimeData,
  TimeIncrement,
} from "../../../lib/fetchTimeData";
import {
  getXDaysAgoFloored,
  getXHoursAgoFloored,
  getXMinuteasAgoFloored,
} from "../../../lib/getXHoursAgo";
import { TimeInterval } from "./timeGraphWHeader";

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
        <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#8884d8"
          animationDuration={0}
        />
        <XAxis dataKey="time" />
        <Tooltip />
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

const timeGraphConfig: Record<TimeInterval, TimeGraphConfig> = {
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

interface DataMetricsProps {
  client: SupabaseClient;
  timeLength: TimeInterval;
}

const DateMetrics = (props: DataMetricsProps) => {
  const { client, timeLength } = props;
  const [data, setData] = useState<TimeData[]>([]);

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
    <RenderLineChart
      data={data}
      timeMap={timeGraphConfig[timeLength].timeMap}
    />
  );
};

export default DateMetrics;
