import { useQuery } from "@tanstack/react-query";
import BasePageV2 from "../components/layout/basePageV2";
import MetaData from "../components/layout/public/authMetaData";
import { BarChart, DonutChart } from "@tremor/react";
import { Result } from "../lib/result";
import { HeliconeStats } from "./api/stats";
import { getTimeMap } from "../lib/timeCalculations/constants";
import { ThemedMultiSelect } from "../components/shared/themed/themedMultiSelect";
import ThemedDropdown from "../components/shared/themed/themedDropdown";
import { BsPieChart } from "react-icons/bs";
import StyledAreaChart from "../components/templates/dashboard/styledAreaChart";
import { providersNames } from "../packages/cost/providers/mappings";
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

  return (
    <MetaData title="Home">
      <BasePageV2>
        <div className="w-full flex flex-col justify-center items-center">
          <div className="w-full flex flex-col justify-center items-center max-w-5xl border shadow-sm p-10 m-10">
            <h1>We are opening up some of our data 🚀</h1>

            <div className="flex gap-5 w-full">
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

            <div className="grid grid-cols-1 md:grid-cols-10 gap-4 w-full">
              <div className="w-full bg-blue-500 col-span-5">
                <DonutChart
                  data={[
                    { label: "A", value: 10 },
                    { label: "B", value: 20 },
                    { label: "C", value: 30 },
                    { label: "D", value: 40 },
                  ]}
                />
              </div>
              <div className="w-full bg-blue-500 col-span-5">
                <DonutChart
                  data={[
                    { label: "A", value: 10 },
                    { label: "B", value: 20 },
                    { label: "C", value: 30 },
                    { label: "D", value: 40 },
                  ]}
                />
              </div>
              <div className="w-full bg-blue-500 h-20 col-span-5"></div>
              <div className="w-full bg-blue-500 h-20 col-span-1"></div>
              <div className="w-full bg-blue-500 h-20 col-span-1"></div>
              <div className="w-full bg-blue-500 h-20 col-span-1"></div>
              <div className="w-full bg-blue-500 h-20 col-span-1"></div>
              <div className="w-full bg-blue-500 h-20 col-span-1"></div>
              <div className="w-full bg-blue-500 h-20 col-span-1"></div>
              <div className="w-full bg-blue-500 h-20 col-span-1"></div>
            </div>
          </div>
        </div>
      </BasePageV2>
    </MetaData>
  );
};

export default Home;
