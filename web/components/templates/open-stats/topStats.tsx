import { useQuery } from "@tanstack/react-query";
import { BarChart } from "@tremor/react";
import { getJawnClient } from "../../../lib/clients/jawn";
import { Card, Grid } from "../../layout/common";
import { clsx } from "../../shared/clsx";
import { colors, humanReadableNumber } from "./OpenStatsPage";
const transformAllProviderData = (
  data: { date: string; provider: string; tokens: number }[]
) => {
  const result: { [key: string]: any }[] = [];
  const providers = new Set<string>();

  data.forEach((item) => {
    providers.add(item.provider);
    let dateEntry = result.find((entry) => entry.date === item.date);
    if (!dateEntry) {
      dateEntry = { date: item.date };
      result.push(dateEntry);
    }
    dateEntry[item.provider] = (dateEntry[item.provider] || 0) + item.tokens;
  });

  return { transformedData: result, providers: Array.from(providers) };
};

const transformAllModelData = (
  data: { date: string; model: string; tokens: number }[]
) => {
  const result: { [key: string]: any }[] = [];
  const models = new Set<string>();
  data.forEach((item) => {
    models.add(item.model);
    let dateEntry = result.find((entry) => entry.date === item.date);
    if (!dateEntry) {
      dateEntry = { date: item.date };
      result.push(dateEntry);
    }
    dateEntry[item.model] = (dateEntry[item.model] || 0) + item.tokens;
  });
  return { transformedData: result, models: Array.from(models) };
};
export function TopStats() {
  const { isLoading: isLoadingModels, data: modelData } = useQuery({
    queryKey: ["modelUsageOverTime"],
    queryFn: async () => {
      const jawn = getJawnClient("none");
      const response = await jawn.POST(
        "/v1/public/dataisbeautiful/model/usage/overtime"
      );
      return response.data?.data ?? [];
    },
  });

  const { isLoading: isLoadingProviders, data: providerData } = useQuery({
    queryKey: ["providerUsageOverTime"],
    queryFn: async () => {
      const jawn = getJawnClient("none");
      const response = await jawn.POST(
        "/v1/public/dataisbeautiful/provider/usage/overtime"
      );
      return response.data?.data ?? [];
    },
  });

  const { isLoading: isLoadingTotalValues, data: totalValuesData } = useQuery({
    queryKey: ["totalValues"],
    queryFn: async () => {
      const jawn = getJawnClient("none");
      const response = await jawn.POST(
        "/v1/public/dataisbeautiful/total-values"
      );
      return response.data?.data;
    },
  });

  return (
    <>
      <Grid
        className={clsx(
          "grid-cols-3 lg:grid-cols-9 w-full gap-[24px] ",
          isLoadingTotalValues ? "animate-pulse" : ""
        )}
      >
        <Card className="col-span-3 bg-[#0B173980] bg-opacity-50 border-[#63758933] border-opacity-20">
          <h2 className="whitespace-nowrap text-[18px] font-bold text-[#DFE4EB]">
            Total Requests
          </h2>
          <div className="w-full text-[36px] font-bold text-[#00C2FF]">
            {humanReadableNumber(totalValuesData?.total_requests ?? 0)}
          </div>
        </Card>
        <Card className="col-span-3 bg-[#0B173980] bg-opacity-50 border-[#63758933] border-opacity-20">
          <h2 className="whitespace-nowrap text-[18px] font-bold text-[#DFE4EB]">
            Total Tokens
          </h2>
          <div className="w-full text-[36px] font-bold text-[#00C2FF]">
            {humanReadableNumber(totalValuesData?.total_tokens ?? 0)}
          </div>
        </Card>
        <Card className="col-span-3 bg-[#0B173980] bg-opacity-50 border-[#63758933] border-opacity-20">
          <>
            <h2 className="whitespace-nowrap text-[18px] font-bold text-[#DFE4EB]">
              Total Spent
            </h2>
            <div className="w-full text-[36px] font-bold text-[#00C2FF]">
              $ {humanReadableNumber(totalValuesData?.total_cost ?? 0)}
            </div>
          </>
        </Card>
      </Grid>
      <div className="w-full border col-span-1 md:col-span-6 flex flex-col items-center gap-5 py-3 rounded-lg px-10  bg-[#0B173980] bg-opacity-50 border-[#63758933] border-opacity-20">
        <h2>
          Tokens / Provider
          <i className="text-gray-400">
            {"("}last month{")"}
          </i>
        </h2>
        <BarChart
          className="text-white"
          data={transformAllProviderData(providerData ?? []).transformedData}
          index="date"
          categories={transformAllProviderData(providerData ?? []).providers}
          valueFormatter={(v) => humanReadableNumber(v)}
          colors={colors}
          stack
        />
      </div>
      <div className="w-full border col-span-1 md:col-span-6 flex flex-col items-center gap-5 py-3 rounded-lg px-10  bg-[#0B173980] bg-opacity-50 border-[#63758933] border-opacity-20">
        <h2>
          Tokens / Model{" "}
          <i className="text-gray-400">
            {"("}last month{")"}
          </i>
        </h2>
        <BarChart
          data={transformAllModelData(modelData ?? []).transformedData}
          index="date"
          categories={transformAllModelData(modelData ?? []).models}
          valueFormatter={(v) => humanReadableNumber(v)}
          colors={colors}
          stack
        />
      </div>
    </>
  );
}
