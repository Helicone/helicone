import { useQuery } from "@tanstack/react-query";
import { AreaChart, BarChart, DonutChart, Legend } from "@tremor/react";
import { useState } from "react";
import { FaXTwitter } from "react-icons/fa6";
import ThemedDropdown from "../../../components/shared/themed/themedDropdown";
import { ThemedScatterPlot } from "../../../components/shared/themed/themedScatterPlot";
import { getJawnClient } from "../../../lib/clients/jawn";
import { Card, Col, Grid, Row } from "../../layout/common";
import CheckBox from "../../layout/common/checkBox";
import LoadingAnimation from "../../shared/loadingAnimation";
import { Logo } from "./logo";

const modelNames = [
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
    model: "claude-3-5-sonnet-20240620",
    provider: "ANTHROPIC",
    variations: ["claude-3-5-sonnet-20240620"],
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

export const OpenStatsPage = () => {
  const [models, setModels] = useState<string[]>(MODELS);
  const [provider, setProvider] = useState<string>("all");

  const [timeSpan, setTimeSpan] = useState("1m");
  const { isLoading, data } = useQuery({
    queryKey: ["issues", timeSpan, models, provider],
    queryFn: async (query) => {
      const jawn = getJawnClient("none");

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
    <Col className="w-full justify-center items-center gap-y-[40px] max-w-5xl mx-auto">
      <Col className="mb-[8px] mt-[80px] justify-center items-center gap-[24px]">
        <Logo />
        <h1 className="text-[48px] font-bold text-center ">
          Helicone{"'"}s Open Stats
        </h1>
        <Row className="gap-[24px] items-center">
          <button
            className="text-[18px] flex items-center gap-[8px] font-semibold py-[8px] px-[24px] rounded-lg border-2"
            onClick={() => {
              const tweetText = `Check out Helicone's Open Stats: ${window.location.href}`;
              const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                tweetText
              )}`;
              window.open(tweetUrl, "_blank");
            }}
          >
            <FaXTwitter />
            <div>Share</div>
          </button>
          <div className="text-[#6B7280] font-semibold text-[14px]">
            Updated: July 12, 2024
          </div>
        </Row>
      </Col>
      <Grid className="grid-cols-12 w-full gap-[24px]">
        <Card className="col-span-3">
          <Col className="justify-between items-center gap-[16px] h-full">
            <div>
              <Row className="gap-[16px] bg-[#F3F4F6] p-[4px] font-bold rounded-lg">
                <button
                  className={`py-[8px] px-[16px] rounded-lg ${
                    timeSpan === "1m" ? "bg-white text-[#0CA5E9] shadow-lg" : ""
                  }`}
                  onClick={() => setTimeSpan("1m")}
                >
                  1M
                </button>
                <button
                  className={`py-[8px] px-[16px] rounded-lg ${
                    timeSpan === "3m" ? "bg-white text-[#0CA5E9] shadow-lg" : ""
                  }`}
                  onClick={() => setTimeSpan("3m")}
                >
                  3M
                </button>
                <button
                  className={`py-[8px] px-[16px] rounded-lg ${
                    timeSpan === "1yr"
                      ? "bg-white text-[#0CA5E9] shadow-lg"
                      : ""
                  }`}
                  onClick={() => setTimeSpan("1yr")}
                >
                  1Y
                </button>
              </Row>
            </div>
            <Col className="w-full gap-3">
              <div className="text-[14px] font-semibold text-[#5D6673]">
                Provider
              </div>
              <ThemedDropdown
                className="w-full"
                options={["all"].concat(providersNames).map((provider) => ({
                  value: provider as string,
                  label: provider,
                }))}
                selectedValue={provider}
                onSelect={(v) => setProvider(v)}
              />
            </Col>
          </Col>
        </Card>
        <Card className="col-span-9">
          <Col className="justify-between items-center gap-[18px]">
            <Row className="justify-between items-center gap-[16px] w-full">
              <div>Top 10 Models</div>
              <Row className="gap-[16px]">
                <button className="underline" onClick={() => setModels([])}>
                  Clear all
                </button>
                <button className="underline" onClick={() => setModels(MODELS)}>
                  Select all
                </button>
              </Row>
            </Row>
            <div className="flex flex-wrap gap-[12px]">
              {[...MODELS].map((item) => (
                <Row
                  key={item}
                  className="items-center border p-[12px] rounded-lg gap-[10px] hover:cursor-pointer"
                  onClick={() => {
                    if (models.includes(item)) {
                      setModels(models.filter((model) => model !== item));
                    } else {
                      setModels([...models, item]);
                    }
                  }}
                >
                  <CheckBox
                    value={models.includes(item)}
                    id={item}
                    onChange={() => {}}
                  />
                  <div>{item}</div>
                </Row>
              ))}
            </div>
          </Col>
        </Card>
      </Grid>
      {isLoading ? (
        <LoadingAnimation />
      ) : (
        <Grid className="grid-cols-12 w-full gap-[24px]">
          <Col className="p-10 border w-full col-span-1 md:col-span-3 flex justify-between flex-col items-center gap-5 py-3 rounded-lg">
            <h2 className="whitespace-nowrap text-[18px] font-bold text-[#5D6673]">
              Total requests Logged
            </h2>
            <div className="w-full text-[36px] font-bold text-[#5D6673]">
              1,000,000
            </div>
          </Col>
          {pieCharts.map((chart, i) => (
            <div
              className="p-10 border w-full col-span-1 md:col-span-3 flex justify-between flex-col items-center gap-5 py-3 rounded-lg"
              key={`${chart.name}-${i}`}
            >
              <h2 className="whitespace-nowrap text-[18px] font-bold text-[#5D6673]">
                {chart.name}
              </h2>
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
          <div className="w-full border col-span-1 md:col-span-6 flex flex-col items-center gap-5 py-3 rounded-lg px-10">
            <h2>Top Models Over time</h2>
            <AreaChart
              data={
                transformData(data?.modelUsageOverTime ?? []).transformedData
              }
              index="date"
              categories={transformData(data?.modelUsageOverTime ?? []).models}
              valueFormatter={(v) => `${v === 0 ? "0" : v.toFixed(2)}%`}
            />
          </div>

          {scatterCharts.map((chart, i) => (
            <ThemedScatterPlot chart={chart} key={`${chart.name}-${i}`} />
          ))}
          <div className="w-full border col-span-1 md:col-span-6 flex flex-col items-center gap-5 p-3 rounded-lg">
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
        </Grid>
      )}
    </Col>
  );
};
