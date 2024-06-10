import { useQuery } from "@tanstack/react-query";
import BasePageV2 from "../components/layout/basePageV2";
import MetaData from "../components/layout/public/authMetaData";
import {
  AreaChart,
  BarChart,
  DonutChart,
  Legend,
  ScatterChart,
} from "@tremor/react";
import { Result } from "../lib/result";
import { HeliconeStats } from "./api/stats";
import { getTimeMap } from "../lib/timeCalculations/constants";
import { ThemedMultiSelect } from "../components/shared/themed/themedMultiSelect";
import ThemedDropdown from "../components/shared/themed/themedDropdown";
import { BsPieChart } from "react-icons/bs";
import StyledAreaChart from "../components/templates/dashboard/styledAreaChart";
import { providersNames } from "../packages/cost/providers/mappings";

interface PieChartData {
  name: string;
  value: number;
}

interface HomeProps {}

const Home = (props: HomeProps) => {
  const {} = props;
  const { isLoading, data } = useQuery({
    queryKey: ["issues"],
    queryFn: async () => {
      const response = await fetch("/api/stats", {
        next: { revalidate: 1000 },
      });
      return (await response.json()) as Result<HeliconeStats, string>;
    },
  });

  const exampleTopModels: PieChartData[] = [
    { name: "gpt-3", value: 10 },
    { name: "gpt-4", value: 20 },
    { name: "gpt-5", value: 30 },
    { name: "gpt-6", value: 40 },
  ];

  const colors = [
    "blue",
    "cyan",
    "indigo",
    "violet",
    "fuchsia",
    "rose",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
  ];

  const pieCharts = [
    { data: exampleTopModels, name: "Top Models" },
    { data: exampleTopModels, name: "Top Models by Cost" },
    { data: exampleTopModels, name: "Top Providers" },
  ];

  const scatterData = [
    {
      grain: "Normalized To Completion Length",
      x: 100,
      y: 200,
    },
    {
      grain: "Unnormalized",
      x: 120,
      y: 100,
    },
    {
      grain: "p75",
      x: 170,
      y: 300,
    },
    {
      grain: "p99",
      x: 140,
      y: 250,
    },
    {
      grain: "p99",
      x: 150,
      y: 400,
      z: 500,
    },
    {
      grain: "p99",
      x: 110,
      y: 280,
      z: 200,
    },
    {
      grain: "p99",
      x: 200,
      y: 260,
      z: 240,
    },
    {
      grain: "p99",
      x: 220,
      y: 290,
      z: 120,
    },
    {
      grain: "p99",
      x: 0,
      y: 190,
      z: 250,
    },
    {
      grain: "p99",
      x: 70,
      y: 0,
      z: 950,
    },
  ];

  const scatterCharts = [
    {
      data: scatterData,
      name: "TTFT vs Prompt Token",
      x: {
        label: "Prompt Token",
        formatter: (v: any) => `${v} tokens`,
      },
      y: {
        label: "Time to first token",
        formatter: (v: any) => `${v}ms`,
      },
    },
    {
      data: scatterData,
      name: "Latency vs Prompt Token",
      x: {
        label: "Prompt Token",
        formatter: (v: any) => `${v} tokens`,
      },
      y: {
        label: "Latency",
        formatter: (v: any) => `${v}ms`,
      },
    },
    {
      data: scatterData,
      name: "Latency vs Completion Token",
      x: {
        label: "Prompt Token",
        formatter: (v: any) => `${v} tokens`,
      },
      y: {
        label: "Latency",
        formatter: (v: any) => `${v}ms`,
      },
    },
  ];

  return (
    <MetaData title="Home">
      <BasePageV2>
        <div className="w-full flex flex-col justify-center items-center">
          <div className="w-full flex flex-col justify-center items-center max-w-5xl border shadow-sm p-10 m-10">
            <h1>We are opening up some of our data 🚀</h1>

            <div className="flex gap-5 w-full flex-col sm:flex-row">
              <ThemedDropdown
                label=""
                options={[
                  { label: "1 Year", value: "1y" },
                  { label: "3 Month", value: "1m" },
                  { label: "1 Month", value: "3m" },
                ]}
                onSelect={(value) => {
                  console.log(value);
                }}
                selectedValue={"1y"}
              />

              <ThemedDropdown
                label=""
                options={[
                  { label: "1 Year", value: "1y" },
                  { label: "3 Month", value: "1m" },
                  { label: "1 Month", value: "3m" },
                ]}
                onSelect={(value) => {
                  console.log(value);
                }}
                selectedValue={"1y"}
              />
              <ThemedDropdown
                label=""
                options={providersNames.map((provider) => ({
                  label: provider,
                  value: provider,
                }))}
                onSelect={(value) => {
                  console.log(value);
                }}
                selectedValue={"1y"}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
              {pieCharts.map((chart, i) => (
                <div
                  className="p-10 border w-full col-span-1 md:col-span-4 flex justify-between flex-col items-center gap-5 py-3"
                  key={`${chart.name}-${i}`}
                >
                  <h2 className="whitespace-nowrap text-2xl">{chart.name}</h2>
                  <DonutChart
                    data={chart.data}
                    category="value"
                    index="name"
                    colors={colors}
                    onValueChange={(v) => console.log(v)}
                    className="min-w-[10em] min-h-[10em] "
                    valueFormatter={(v) => `${v}%`}
                  />

                  <Legend
                    categories={chart.data.map((d) => d.name)}
                    colors={colors}
                    className=""
                  />
                </div>
              ))}

              <div className="w-full border col-span-1 md:col-span-6 flex flex-col items-center gap-5 py-3">
                <h2>Top Models Over time</h2>
                <AreaChart
                  data={[
                    { x: "2024-06-10", "gpt-4": 10, "gpt-3.5": 1 },
                    { x: "2024-06-11", "gpt-4": 20, "gpt-3.5": 2 },
                    { x: "2024-06-12", "gpt-4": 30, "gpt-3.5": 3 },
                    { x: "2024-06-13", "gpt-4": 40, "gpt-3.5": 4 },
                  ]}
                  index="x"
                  categories={["y", "gpt-4", "gpt-3.5"]}
                />
              </div>
              <div className="w-full border col-span-1 md:col-span-6 flex flex-col items-center gap-5 p-3">
                <h2>TTFT Per model </h2>
                <BarChart
                  data={[
                    {
                      x: "gpt-4o (oai)",
                      unnormalized: 10,
                      normalized: 5,
                      p75: 15,
                      p99: 20,
                    },
                    {
                      x: "gpt-4o (azure)",
                      unnormalized: 20,
                      normalized: 10,
                      p75: 25,
                      p99: 30,
                    },
                    {
                      x: "gpt-3.5 (oai)",
                      unnormalized: 2,
                      normalized: 1,
                      p75: 3,
                      p99: 4,
                    },
                  ]}
                  index="x"
                  categories={["unnormalized", "normalized", "p75", "p99"]}
                  yAxisLabel="Latency"
                  valueFormatter={(v) => `${v}ms`}
                  enableLegendSlider
                />
              </div>
              {scatterCharts.map((chart, i) => (
                <div
                  key={`${chart.name}-${i}`}
                  className=" border w-full  col-span-1 md:col-span-6  flex flex-col items-center gap-5 p-3"
                >
                  <h2>{chart.name}</h2>

                  <ScatterChart
                    className=""
                    yAxisWidth={50}
                    data={chart.data}
                    category="grain"
                    x="x"
                    y="y"
                    valueFormatter={{
                      x: chart.x.formatter,
                      y: chart.y.formatter,
                    }}
                    showLegend={true}
                    xAxisLabel={chart.x.label}
                    yAxisLabel={chart.y.label}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </BasePageV2>
    </MetaData>
  );
};

export default Home;
