import { SupabaseClient } from "@supabase/supabase-js";
import { SetStateAction, useEffect, useState, Dispatch } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FilterLeaf, FilterNode } from "../../../lib/api/metrics/filters";
import {
  TimeData,
  TimeIncrement,
} from "../../../lib/timeCalculations/fetchTimeData";

export const RenderLineChart = ({
  data,
  timeMap,
}: {
  data: TimeData[];
  timeMap: (date: Date) => string;
}) => {
  console.log(data);
  const chartData = data.map((d) => ({
    time: timeMap(d.time),
    count: d.count,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid vertical={false} opacity={50} strokeOpacity={0.5} />
        <Line
          type="monotone"
          dot={false}
          dataKey="count"
          stroke="#8884d8"
          strokeWidth={1.5}
          animationDuration={0}
        />
        <XAxis dataKey="time" />
        <Tooltip />
        <YAxis />
      </LineChart>
    </ResponsiveContainer>
  );
};
