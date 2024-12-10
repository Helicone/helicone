import { useQuery } from "@tanstack/react-query";
import { AreaChart, BarChart, DonutChart, Legend } from "@tremor/react";
import { useEffect } from "react";
import ThemedDropdown from "../../../components/shared/themed/themedDropdown";
import { ThemedScatterPlot } from "../../../components/shared/themed/themedScatterPlot";
import { getJawnClient } from "../../../lib/clients/jawn";
import { Card, Col, Grid, Row } from "../../layout/common";
import CheckBox from "../../layout/common/checkBox";
import { clsx } from "../../shared/clsx";
import { humanReadableNumber } from "./humanReadableNumber";
import { colors } from "./colors";
import { useQueryParams } from "./useQueryParams";
const timeSpans = ["7d", "1m", "3m"] as const;
export const allProviders = [
  "OPENAI",
  "ANTHROPIC",
  "AZURE",
  "GOOGLE",
  "OPENROUTER",
  "TOGETHER",
  "CLOUDFLARE",
  "CUSTOM",
  "DEEPINFRA",
  "FIREWORKS",
  "GROQ",
  "META",
  "MISTRAL",
  "OTHER",
] as const;

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
    model: "gpt-4o-mini",
    provider: "OPENAI",
    variations: ["gpt-4o-mini", "gpt-4o-mini-2024-07-18"],
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
    model: "claude-3-opus",
    provider: "ANTHROPIC",
    variations: ["claude-3-opus-20240229"],
  },
  {
    model: "claude-3-sonnet",
    provider: "ANTHROPIC",
    variations: ["claude-3-sonnet-20240229", "claude-3-5-sonnet-20240620"],
  },
  {
    model: "claude-3-haiku",
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
  const selectedData = sorted.slice(0, limit);

  const accumulatedValue = selectedData.reduce(
    (acc, d) => acc + (d[key] as number),
    0
  );

  return [...sorted.slice(0, limit), other(accumulatedValue)];
  // return sorted;
}

const fetchModelUsageOverTime = async (body: any) => {
  const jawn = getJawnClient("none");
  const response = await jawn.POST(
    "/v1/public/dataisbeautiful/model/percentage/overtime",
    { body }
  );
  return response.data?.data ?? [];
};

const fetchModelPercentage = async (body: any) => {
  const jawn = getJawnClient("none");
  const response = await jawn.POST(
    "/v1/public/dataisbeautiful/model/percentage",
    { body }
  );
  return addOther(
    response.data?.data ?? [],
    "percent",
    4,
    (accumulatedValue) => ({
      matched_model: "other",
      percent: 100 - accumulatedValue,
    })
  );
};

const fetchProviderPercentage = async (body: any) => {
  const jawn = getJawnClient("none");
  const response = await jawn.POST(
    "/v1/public/dataisbeautiful/provider/percentage",
    { body }
  );
  return addOther(
    response.data?.data ?? [],
    "percent",
    4,
    (accumulatedValue) => ({
      provider: "other",
      percent: 100 - accumulatedValue,
    })
  );
};

const fetchModelCost = async (body: any) => {
  const jawn = getJawnClient("none");
  const response = await jawn.POST("/v1/public/dataisbeautiful/model/cost", {
    body,
  });
  return response.data?.data ?? [];
};

const fetchTtftVsPromptLength = async (body: any) => {
  const jawn = getJawnClient("none");
  const response = await jawn.POST(
    "/v1/public/dataisbeautiful/ttft-vs-prompt-length",
    { body }
  );
  return response.data?.data ?? [];
};

const fetchTotalCount = async (body: any) => {
  const jawn = getJawnClient("none");
  const response = await jawn.POST(
    "/v1/public/dataisbeautiful/total-requests",
    { body }
  );
  return response.data;
};

function useStats(
  queryParams: ReturnType<typeof useQueryParams>["queryParams"]
) {
  const { timeSpan, models, provider } = queryParams;
  const body = {
    timespan: timeSpan,
    models: models === "none" ? [] : models.map((model) => model).sort(),
    provider: provider === "all" ? undefined : provider,
  };

  const modelUsageOverTimeQuery = useQuery(["modelUsageOverTime", body], () =>
    fetchModelUsageOverTime(body)
  );
  const modelPercentageQuery = useQuery(["modelPercentage", body], () =>
    fetchModelPercentage(body)
  );
  const providerPercentageQuery = useQuery(["providerPercentage", body], () =>
    fetchProviderPercentage(body)
  );
  const modelCostQuery = useQuery(["modelCost", body], () =>
    fetchModelCost(body)
  );
  const ttftVsPromptLengthQuery = useQuery(["ttftVsPromptLength", body], () =>
    fetchTtftVsPromptLength(body)
  );
  const totalCountQuery = useQuery(["totalCount", body], () =>
    fetchTotalCount(body)
  );

  return {
    modelUsageOverTimeQuery,
    modelPercentageQuery,
    providerPercentageQuery,
    modelCostQuery,
    ttftVsPromptLengthQuery,
    totalCountQuery,
  };
}

export function OtherStats({
  queryParamsState,
}: {
  queryParamsState: ReturnType<typeof useQueryParams>;
}) {
  const { queryParams, setQueryParams } = queryParamsState;

  const models = queryParams.models || MODELS;
  const provider = queryParams.provider || "all";
  const timeSpan = (queryParams.timeSpan as any) || "1m";
  useEffect(() => {
    if (
      !queryParams.models ||
      (queryParams.models !== "none" && queryParams.models.length === 0)
    ) {
      setQueryParams({ ...queryParams, models: MODELS });
    }
    if (!queryParams.provider) {
      setQueryParams({ ...queryParams, provider: "all" });
    }
    if (!queryParams.timeSpan) {
      setQueryParams({ ...queryParams, timeSpan: "1m" });
    }
  }, [
    queryParams,
    queryParams.models,
    queryParams.provider,
    queryParams.timeSpan,
    setQueryParams,
  ]);

  const {
    modelUsageOverTimeQuery,
    modelPercentageQuery,
    providerPercentageQuery,
    modelCostQuery,
    ttftVsPromptLengthQuery,
    totalCountQuery,
  } = useStats(queryParams);

  const isLoading =
    modelUsageOverTimeQuery.isLoading ||
    modelPercentageQuery.isLoading ||
    providerPercentageQuery.isLoading ||
    modelCostQuery.isLoading ||
    ttftVsPromptLengthQuery.isLoading ||
    totalCountQuery.isLoading;

  const data = {
    modelUsageOverTime: modelUsageOverTimeQuery.data,
    modelPercentage: modelPercentageQuery.data,
    providerPercentage: providerPercentageQuery.data,
    modelCost: modelCostQuery.data,
    ttftVsPromptLength: ttftVsPromptLengthQuery.data,
    totalCount: totalCountQuery.data,
  };

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
    <>
      <Grid className="grid-cols-3 lg:grid-cols-12 w-full gap-[24px]">
        <Card className="col-span-3 bg-[#0B173980] bg-opacity-50 border-[#63758933] border-opacity-20">
          <Col className="justify-between items-center gap-[16px] h-full">
            <div>
              <Row className="gap-[16px] bg-black p-[4px] font-bold rounded-lg">
                {timeSpans.map((x, i) => (
                  <button
                    className={`py-[8px] px-[16px] rounded-lg ${
                      timeSpan === x ? "bg-sky-800 shadow-lg" : " bg-black"
                    }`}
                    key={`${x}-${i}`}
                    onClick={() =>
                      setQueryParams({ ...queryParams, timeSpan: x })
                    }
                  >
                    {x.toUpperCase()}
                  </button>
                ))}
              </Row>
            </div>
            <Col className="w-full gap-3 ">
              <div className="text-[14px] font-semibold text-white">
                Provider
              </div>
              <ThemedDropdown
                className="w-full"
                options={["all"].concat(allProviders).map((provider) => ({
                  value: provider as string,
                  label: provider,
                }))}
                selectedValue={provider}
                onSelect={(v) =>
                  setQueryParams({ ...queryParams, provider: v })
                }
              />
            </Col>
          </Col>
        </Card>
        <Card className="col-span-3 lg:col-span-9 bg-[#0B173980] bg-opacity-50 border-[#63758933] border-opacity-20">
          <Col className="justify-between items-center gap-[18px]">
            <Row className="justify-between items-center gap-[16px] w-full">
              <div>Top Models</div>
              <Row className="gap-[16px] text-gray-500">
                <button
                  className="underline"
                  onClick={() =>
                    setQueryParams({ ...queryParams, models: "none" })
                  }
                >
                  Clear all
                </button>
                <button
                  className="underline"
                  onClick={() =>
                    setQueryParams({ ...queryParams, models: MODELS })
                  }
                >
                  Select all
                </button>
              </Row>
            </Row>
            <div className="flex flex-wrap gap-[12px]">
              {[...MODELS].map((item) => (
                <Row
                  key={item}
                  className={`items-center border border-[#63758933] border-opacity-20 p-[12px] rounded-lg gap-[10px] hover:cursor-pointer ${
                    models.includes(item) ? "bg-[#00C2FF] bg-opacity-10" : ""
                  }`}
                  onClick={() => {
                    if (models.includes(item)) {
                      setQueryParams({
                        ...queryParams,
                        models:
                          models === "none"
                            ? "none"
                            : models.filter((model) => model !== item),
                      });
                    } else {
                      setQueryParams({
                        ...queryParams,
                        models: models === "none" ? [item] : [...models, item],
                      });
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

      <Grid
        className={clsx(
          "grid-cols-1 lg:grid-cols-12 w-full gap-[24px]",
          isLoading && "animate-pulse"
        )}
      >
        <Col className="p-10 border w-full col-span-1 md:col-span-3 flex justify-between flex-col items-center gap-5 py-3 rounded-lg bg-[#0B173980] bg-opacity-50 border-[#63758933] border-opacity-20">
          <h2 className="whitespace-nowrap text-[18px] font-bold text-white">
            Total Requests
          </h2>
          <div className="w-full text-[36px] font-bold text-[#00C2FF]">
            {humanReadableNumber(data?.totalCount?.data ?? 0)}
          </div>
        </Col>
        {pieCharts.map((chart, i) => (
          <div
            className="p-10 border w-full col-span-1 md:col-span-3 flex justify-between flex-col items-center gap-5 py-3 rounded-lg bg-[#0B173980] bg-opacity-50 border-[#63758933] border-opacity-20"
            key={`${chart.name}-${i}`}
          >
            <h2 className="whitespace-nowrap text-[18px] font-bold text-white">
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
        <div className="w-full border col-span-1 md:col-span-6 flex flex-col items-center gap-5 py-3 rounded-lg px-10 bg-[#0B173980] bg-opacity-50 border-[#63758933] border-opacity-20">
          <h2>Model market share %</h2>
          <AreaChart
            data={transformData(data?.modelUsageOverTime ?? []).transformedData}
            index="date"
            categories={transformData(data?.modelUsageOverTime ?? []).models}
            valueFormatter={(v) => `${v === 0 ? "0" : v.toFixed(2)}%`}
          />
        </div>

        {scatterCharts.map((chart, i) => (
          <ThemedScatterPlot chart={chart} key={`${chart.name}-${i}`} />
        ))}
        <div className="w-full border col-span-1 md:col-span-6 flex flex-col items-center gap-5 p-3 rounded-lg bg-[#0B173980] bg-opacity-50 border-[#63758933] border-opacity-20">
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
    </>
  );
}
