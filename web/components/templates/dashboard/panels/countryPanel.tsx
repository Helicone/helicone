import { BarList } from "@tremor/react";
import StyledAreaChart from "../styledAreaChart";
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";
import { useCountries } from "../../../../services/hooks/country";
import { TimeFilter } from "@/types/timeFilter";
import { COUTNRY_CODE_DIRECTORY } from "../../requests/countryCodeDirectory";
import { CountryData } from "../../../../services/lib/country";
import ThemedModal from "../../../shared/themed/themedModal";
import { useEffect, useMemo, useRef, useState } from "react";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { useOrg } from "@/components/layout/org/organizationContext";
import { getMockCountries } from "../mockDashboardData";
import StatsCard from "./StatsCard";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

interface CountryPanelProps {
  timeFilter: TimeFilter;
  userFilters: FilterNode;
}

const CountryPanel = (props: CountryPanelProps) => {
  const { timeFilter, userFilters } = props;
  const org = useOrg();
  const shouldShowMockData = org?.currentOrg?.has_onboarded === false;

  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(5);

  const { isLoading: isCountriesLoading, countries: realCountries } =
    useCountries(timeFilter, limit, userFilters);

  // Get mock data when user hasn't onboarded
  const mockCountries = shouldShowMockData ? getMockCountries() : null;

  // Use either mock or real data
  const countries = shouldShowMockData ? mockCountries : realCountries;

  const chartConfig = useMemo(() => {
    if (!countries?.data || countries.data.length === 0) return {};
    const config = Object.fromEntries([
      ...countries.data.map((country, i) => {
        const countryInfo = COUTNRY_CODE_DIRECTORY.find(
          (c) => c.isoCode === country.country
        );
        return [
          `country-${country.country.toLowerCase().replaceAll(" ", "-")}`,
          {
            label:
              `${countryInfo?.emojiFlag} ${countryInfo?.country} (${countryInfo?.isoCode})` ||
              "n/a",
            color: `oklch(var(--chart-${(i % 10) + 1}))`,
          },
        ];
      }),
      ["label", { color: "hsl(var(--foreground))" }],
    ]) satisfies ChartConfig;
    return config;
  }, [countries]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartContainerWidth, setChartContainerWidth] = useState(0);

  // listen to resize of the chart container
  useEffect(() => {
    if (chartContainerRef.current) {
      setChartContainerWidth(chartContainerRef.current?.clientWidth ?? 0);
      const resizeObserver = new ResizeObserver((entries) => {
        setChartContainerWidth(entries[0].contentRect.width);
      });
      resizeObserver.observe(chartContainerRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [chartContainerRef]);

  return (
    <>
      <StatsCard
        title="Top Countries"
        isLoading={isCountriesLoading && !shouldShowMockData}
      >
        <ChartContainer
          ref={chartContainerRef}
          config={chartConfig}
          className="h-full w-full"
        >
          <BarChart
            layout="vertical"
            margin={{ right: 20 }}
            accessibilityLayer
            data={countries?.data?.map((country, i) => ({
              country: `country-${country.country
                .toLowerCase()
                .replaceAll(" ", "-")}`,
              value: +country.total_requests,
              fill: `oklch(var(--chart-${(i % 10) + 1}))`,
            }))}
          >
            {/* <CartesianGrid vertical={false} /> */}
            <YAxis
              dataKey="country"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return (
                  chartConfig[value as keyof typeof chartConfig]?.label ?? value
                );
              }}
              hide
            />
            <XAxis dataKey="value" type="number" hide />
            <Bar dataKey="value" layout="vertical" radius={4} maxBarSize={30}>
              <LabelList
                formatter={(value: string) => {
                  return (
                    chartConfig[value as keyof typeof chartConfig]?.label ??
                    value.replace("error-", "").replace(/-/g, " ")
                  );
                }}
                dataKey="country"
                position="insideLeft"
                offset={8}
                className="fill-[--color-label]"
                fontSize={12}
              />
              <LabelList
                dataKey="value"
                position={{
                  x:
                    chartContainerWidth ||
                    chartContainerRef.current?.clientWidth,
                  y: 18,
                }}
                offset={8}
                className="fill-[--color-label]"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </StatsCard>
      {/* <StyledAreaChart
        title={`Top Countries`}
        value={undefined}
        isDataOverTimeLoading={isCountriesLoading && !shouldShowMockData}
      >
        <div className="flex flex-row justify-between items-center pb-2">
          <p className="text-xs font-semibold text-gray-700">Country</p>
          <p className="text-xs font-semibold text-gray-700">Requests</p>
        </div>
        <BarList
          showAnimation={true}
          data={
            countries?.data
              ?.map((country, index) => countryMapper(country, index))
              .sort((a, b) => b.value - a.value - (b.name === "n/a" ? 1 : 0))
              .slice(0, 5) ?? []
          }
          className="overflow-auto h-full"
        />
        <div className="-mt-6 w-full flex justify-center">
          <button
            onClick={() => {
              setLimit(100);
              setOpen(true);
            }}
            className="z-20 flex items-center text-xs text-black dark:text-white bg-white hover:bg-gray-100 dark:hover:bg-gray-900 dark:bg-black rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5"
          >
            <ArrowsPointingOutIcon className="h-4 w-4 text-gray-500 mr-1" />
            Show All
          </button>
        </div>
      </StyledAreaChart>
      <ThemedModal
        open={open}
        setOpen={(open) => {
          if (open === false) {
            setLimit(5);
          }
          setOpen(open);
        }}
      >
        <div className="flex flex-col w-[450px] divide-y divide-gray-300 dark:divide-gray-700">
          <div className="flex flex-row justify-between items-end pb-4">
            <h3 className="font-semibold text-xl text-black dark:text-white">
              Countries
            </h3>
            <p className="text-gray-500 text-sm">Requests</p>
          </div>
          <div className="py-4 max-h-96 h-96 overflow-auto">
            <BarList
              showAnimation={true}
              data={
                countries?.data
                  ?.map((country, index) => countryMapper(country, index))
                  .sort(
                    (a, b) => b.value - a.value - (b.name === "n/a" ? 1 : 0)
                  ) ?? []
              }
            />
          </div>
          <div className="pt-4 flex justify-center items-center">
            {" "}
            <button
              onClick={() => {
                setLimit(5);
                setOpen(false);
              }}
              className="z-20 flex w-[200px] justify-center items-center text-xs text-black dark:text-white bg-white hover:bg-gray-100 dark:hover:bg-gray-900 dark:bg-black rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5"
            >
              <ArrowsPointingInIcon className="h-4 w-4 text-gray-500 mr-1" />
              Close
            </button>
          </div>
        </div>
      </ThemedModal> */}
    </>
  );
};

export default CountryPanel;
