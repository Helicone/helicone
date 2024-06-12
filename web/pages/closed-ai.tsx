import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  BarChart,
  DonutChart,
  Legend,
  MultiSelect,
  MultiSelectItem,
} from "@tremor/react";
import { useState } from "react";
import BasePageV2 from "../components/layout/basePageV2";
import MetaData from "../components/layout/public/authMetaData";
import ThemedDropdown from "../components/shared/themed/themedDropdown";
import { ThemedScatterPlot } from "../components/shared/themed/themedScatterPlot";
import { getJawnClient } from "../lib/clients/jawn";

export const modelNames = [
  {
    model: "gpt-3.5",
    provider: "OPENAI",
    variations: [
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-0301",
      "gpt-3.5-turbo-16k-0613",
    ],
  },
  {
    model: "gpt-4o",
    provider: "OPENAI",
    variations: ["gpt-4o", "gpt-4o-2024-05-13"],
  },
  {
    model: "gpt-4",
    provider: "OPENAI",
    variations: [
      "gpt-4",
      "gpt-4-0314",
      "gpt-4-0613",
      "gpt-4-32k",
      "gpt-4-32k-0314",
      "gpt-4-32k-0613",
    ],
  },
  {
    model: "gpt-4-turbo",
    provider: "OPENAI",
    variations: [
      "gpt-4-turbo",
      "gpt-4-turbo-preview",
      "gpt-4-turbo-0125-preview",
    ],
  },
  {
    model: "claude-3-opus-20240229",
    provider: "ANTHROPIC",
    variations: ["claude-3-opus-20240229"],
  },
  {
    model: "claude-3-sonnet-20240229",
    provider: "ANTHROPIC",
    variations: ["claude-3-sonnet-20240229"],
  },
  {
    model: "claude-3-haiku-20240307",
    provider: "ANTHROPIC",
    variations: ["claude-3-haiku-20240307"],
  },
  { model: "claude-2", provider: "ANTHROPIC", variations: ["claude-2"] },
  { model: "open-mixtral", provider: "MISTRAL", variations: ["open-mixtral"] },
  { model: "Llama", provider: "META", variations: ["Llama"] },
  { model: "dall-e", provider: "OPENAI", variations: ["dall-e"] },
  {
    model: "text-moderation",
    provider: "OPENAI",
    variations: ["text-moderation"],
  },
  {
    model: "text-embedding",
    provider: "OPENAI",
    variations: [
      "text-embedding",
      "text-embedding-ada",
      "text-embedding-ada-002",
    ],
  },
] as const;

const MODELS = Array.from(new Set(modelNames.map((m) => m.model)));
const providersNames = Array.from(new Set(modelNames.map((m) => m.provider)));

interface PieChartData {
  name: string;
  value: number;
}

interface HomeProps {}

function transformData(
  data: { date: string; matched_model: string; percent: number }[]
) {
  const result: { [key: string]: any }[] = [];
  const models = new Set<string>();

  data.forEach((item) => {
    models.add(item.matched_model);
    let dateEntry = result.find((entry) => entry.date === item.date);
    if (!dateEntry) {
      dateEntry = { date: item.date };
      result.push(dateEntry);
    }
    dateEntry[item.matched_model] = item.percent;
  });

  return { transformedData: result, models: Array.from(models) };
}

function addOther<T>(
  data: T[],
  key: keyof T,
  limit: number,
  other: (accumulatedValue: number) => T
) {
  const sorted = [...data].sort((a, b) => (b[key] as any) + (a[key] as any));
  console.log(sorted);
  // return sorted;
  const selectedData = sorted.slice(0, limit);
  console.log(selectedData);
  const accumulatedValue = selectedData.reduce(
    (acc, d) => acc + (d[key] as number),
    0
  );
  console.log(accumulatedValue, other(accumulatedValue));
  return [...sorted.slice(0, limit), other(accumulatedValue)];
  // return sorted;
}

const Home = (props: HomeProps) => {
  const {} = props;

  const [models, setModels] = useState<string[]>(MODELS);
  const [provider, setProvider] = useState<string>("all");

  const [timeSpan, setTimeSpan] = useState("1m");
  const { isLoading, data } = useQuery({
    queryKey: ["issues", timeSpan, models, provider],
    queryFn: async (query) => {
      const jawn = getJawnClient();

      const [timeSpan, models, provider] = [
        query.queryKey[1],
        query.queryKey[2],
        query.queryKey[3],
      ] as [any, any, any];
      const body = {
        timespan: timeSpan,
        models: models,
        provider: provider === "all" ? undefined : provider,
      };

      const [
        modelUsageOverTime,
        modelPercentage,
        providerPercentage,
        modelCost,
        ttftVsPromptLength,
      ] = await Promise.all([
        jawn.POST("/v1/public/dataisbeautiful/model/percentage/overtime", {
          body,
        }),
        jawn.POST("/v1/public/dataisbeautiful/model/percentage", {
          body,
        }),
        jawn.POST("/v1/public/dataisbeautiful/provider/percentage", {
          body,
        }),
        jawn.POST("/v1/public/dataisbeautiful/model/cost", {
          body,
        }),
        jawn.POST("/v1/public/dataisbeautiful/ttft-vs-prompt-length", {
          body,
        }),
      ]);

      const modelPercentageRows = addOther(
        modelPercentage.data?.data ?? [],
        "percent",
        4,
        (accumulatedValue) => ({
          matched_model: "other",
          percent: 100 - accumulatedValue,
        })
      );

      const providerPercentageRows = addOther(
        providerPercentage.data?.data ?? [],
        "percent",
        4,
        (accumulatedValue) => ({
          provider: "other",
          percent: 100 - accumulatedValue,
        })
      );

      return {
        modelPercentage: modelPercentageRows,
        providerPercentage: providerPercentageRows,
        modelUsageOverTime: modelUsageOverTime.data?.data ?? [],
        modelCost: modelCost.data?.data ?? [],
        ttftVsPromptLength: ttftVsPromptLength.data?.data ?? [],
      };
    },
  });

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
    {
      data:
        data?.modelPercentage?.map((d) => {
          return {
            name: d.matched_model,
            value: d.percent,
          };
        }) ?? [],
      name: "Top Models",
    },
    {
      data:
        data?.modelCost?.map((d) => {
          return {
            name: d.matched_model,
            value: d.percent,
          };
        }) ?? [],
      name: "Top Models by Cost",
    },
    {
      data:
        data?.providerPercentage?.map((d) => {
          return {
            name: d.provider,
            value: d.percent,
          };
        }) ?? [],
      name: "Top Providers",
    },
  ];

  const scatterData2: {
    grain: string;
    x: number;
    y: number;
    default?: boolean;
  }[] = [];
  data?.ttftVsPromptLength?.forEach((d) => {
    scatterData2.push(
      {
        grain: "TTFT p99",
        x: d.prompt_length,
        y: d.ttft_p99,
      },
      {
        grain: "TTFT / Completion p99",
        x: d.prompt_length,
        y: d.ttft_normalized_p99,
      },
      {
        grain: "TTFT p75",
        x: d.prompt_length,
        y: d.ttft_p75,
      },
      {
        grain: "TTFT / Completion p75",
        x: d.prompt_length,
        y: d.ttft_normalized_p75,
      },
      {
        grain: "TTFT",
        x: d.prompt_length,
        y: d.ttft,
        default: true,
      },
      {
        grain: "TTFT / Completion",
        x: d.prompt_length,
        y: d.ttft_normalized,
        default: true,
      }
    );
  });

  const scatterCharts = [
    {
      data: scatterData2,
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
      data: [],
      name: "Latency vs Prompt Token (soon)",
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
          <div className="w-full flex flex-col gap-10 justify-center items-center max-w-5xl border shadow-sm p-10 m-10">
            <div className="flex w-full justify-between">
              <h1 className="text-4xl font-bold text-center ">
                Helicone{"'"}s global dashboard 🚀
              </h1>
              {/* <h2>
                Log in to see you data 👉{" "}
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
                  Sign in
                </button>
              </h2>
              <h2>
                <ToggleButton
                  label="My data"
                  onChange={(v) => console.log(v)}
                />
              </h2> */}
            </div>

            <div className="flex gap-5 flex-col sm:flex-row w-full">
              <ThemedDropdown
                label=""
                options={[
                  { label: "1 Month", value: "1m" },
                  { label: "3 Month", value: "3m" },
                  { label: "1 Year", value: "1y" },
                ]}
                onSelect={(value) => {
                  setTimeSpan(value);
                }}
                selectedValue={timeSpan}
              />

              <ThemedDropdown
                label=""
                options={[
                  { label: "All", value: "all" },
                  ...providersNames.map((provider) => ({
                    label: provider,
                    value: provider,
                  })),
                ]}
                onSelect={(value) => {
                  setProvider(value);
                }}
                selectedValue={provider}
              />

              <MultiSelect
                className="max-w-[20em]"
                onValueChange={(v) => {
                  setModels(v);
                }}
                value={models}
              >
                {[...MODELS].map((item) => (
                  <MultiSelectItem
                    key={item}
                    value={item}
                    defaultChecked={true}
                  />
                ))}
              </MultiSelect>
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
                    valueFormatter={(v) => `${v === 0 ? "0" : v.toFixed(2)}%`}
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
                  data={
                    transformData(data?.modelUsageOverTime ?? [])
                      .transformedData
                  }
                  index="date"
                  categories={
                    transformData(data?.modelUsageOverTime ?? []).models
                  }
                  valueFormatter={(v) => `${v === 0 ? "0" : v.toFixed(2)}%`}
                />
              </div>

              {scatterCharts.map((chart, i) => (
                <ThemedScatterPlot chart={chart} key={`${chart.name}-${i}`} />
              ))}
              <div className="w-full border col-span-1 md:col-span-6 flex flex-col items-center gap-5 p-3">
                <h2>TTFT Per model (soon)</h2>
                <BarChart
                  data={
                    [
                      // {
                      //   x: "gpt-4o (oai)",
                      //   unnormalized: 10,
                      //   normalized: 5,
                      //   p75: 15,
                      //   p99: 20,
                      // },
                      // {
                      //   x: "gpt-4o (azure)",
                      //   unnormalized: 20,
                      //   normalized: 10,
                      //   p75: 25,
                      //   p99: 30,
                      // },
                      // {
                      //   x: "gpt-3.5 (oai)",
                      //   unnormalized: 2,
                      //   normalized: 1,
                      //   p75: 3,
                      //   p99: 4,
                      // },
                    ]
                  }
                  index="x"
                  categories={["unnormalized", "normalized", "p75", "p99"]}
                  yAxisLabel="Latency"
                  valueFormatter={(v) => `${v}ms`}
                  enableLegendSlider
                />
              </div>
            </div>
          </div>
        </div>
      </BasePageV2>
    </MetaData>
  );
};

export default Home;
