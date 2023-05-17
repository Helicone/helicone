import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { clsx } from "../../shared/clsx";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
];

export function MultilineRenderLineChart<T>({
  data,
  timeMap,
  valueFormatter,
  className,
}: {
  data: {
    [key in keyof T]: any;
  } & {
    time: Date;
  }[];
  timeMap: (date: Date) => string;
  valueFormatter?: (value: ValueType) => string | string[];
  className?: string;
}) {
  const chartData = data.map((d) => ({
    ...d,
    time: timeMap(d.time),
  }));

  const getErrorCodes = () => {
    const errorCodes = new Set<string>();
    chartData.forEach((d) => {
      Object.keys(d).forEach((key) => {
        if (key !== "time") {
          errorCodes.add(key);
        }
      });
    });
    return Array.from(errorCodes);
  };

  const errorCodes = getErrorCodes();

  return (
    <div className={clsx("w-full h-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          width={500}
          height={300}
          data={chartData}
          margin={{
            right: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          {errorCodes.map((code, i) => (
            <Bar
              key={i}
              dataKey={code}
              stackId="a"
              fill={COLORS[i % COLORS.length]}
            />
          ))}
          {/* <Bar dataKey="400" fill="#0ea4e9" stackId="a" />
          <Bar dataKey="429" fill="#0ea4e9" stackId="a" /> */}
        </BarChart>
      </ResponsiveContainer>
      {/* <ResponsiveContainer width="100%" height="100%">
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="pv" stackId="a" fill="#8884d8" />
          <Bar dataKey="uv" stackId="a" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer> */}
      {/* <ResponsiveContainer className={"w-full h-full"}>
        <LineChart data={chartData}>
          <CartesianGrid vertical={false} opacity={50} strokeOpacity={0.5} />
          {chartData &&
            chartData.length > 0 &&
            Object.keys(chartData[0])
              .filter((key) => key !== "time")
              .map((key, i) => (
                <Line
                  type="monotone"
                  dot={false}
                  dataKey={key}
                  stroke={`hsl(${
                    (i * 360) / (Object.keys(chartData[0]).length - 1)
                  }, 100%, 50%)`}
                  strokeWidth={1.5}
                  animationDuration={0}
                  key={`line-${i}`}
                />
              ))}

          <XAxis
            dataKey="time"
            style={{
              fontSize: "0.85rem",
            }}
          />
          <YAxis
            style={{
              fontSize: "0.85rem",
            }}
          />
          <Tooltip
            formatter={(value) =>
              valueFormatter ? valueFormatter(value) : value
            }
          />
        </LineChart>
      </ResponsiveContainer> */}
    </div>
  );
}
