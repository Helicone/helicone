import { ChartBarIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Card,
  LineChart,
  MultiSelect,
  MultiSelectItem,
} from "@tremor/react";
import Link from "next/link";
import { useState } from "react";
import { getJawnClient } from "../../../lib/clients/jawn";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  UIFilterRowTree,
  getRootFilterNode,
} from "../../../services/lib/filters/uiFilterRowTree";
import { Col, Row } from "../../layout/common";
import { useOrg } from "../../layout/organizationContext";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import ThemedTableHeader from "../../shared/themed/themedHeader";
import useSearchParams from "../../shared/utils/useSearchParams";
import { TimeFilter } from "../dashboard/dashboardPage";
import { useUIFilterConvert } from "../dashboard/useDashboardPage";

const EvalsPage = () => {
  const org = useOrg();

  const searchParams = useSearchParams();

  const getInterval = () => {
    const currentTimeFilter = searchParams.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };

  const getTimeFilter = () => {
    const currentTimeFilter = searchParams.get("t");
    let range;

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const start = currentTimeFilter.split("_")[1]
        ? new Date(currentTimeFilter.split("_")[1])
        : getTimeIntervalAgo("24h");
      const end = new Date(currentTimeFilter.split("_")[2] || new Date());
      range = {
        start,
        end,
      };
    } else {
      range = {
        start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || "24h"),
        end: new Date(),
      };
    }
    return range;
  };

  const [interval, setInterval] = useState<TimeInterval>(
    getInterval() as TimeInterval
  );
  const [timeFilter, setTimeFilter] = useState(getTimeFilter());

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRowTree>(
    getRootFilterNode()
  );

  const debouncedAdvancedFilter = useDebounce(advancedFilters, 500);

  const {
    userFilters,
    filterMap,
    properties: { searchPropertyFilters },
  } = useUIFilterConvert(advancedFilters, timeFilter);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["evals", org?.currentOrg?.id, timeFilter, userFilters],
    queryFn: async (query) => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      const timeFilter = query.queryKey[2] as TimeFilter;
      const filter = query.queryKey[3] as FilterNode;
      return jawn.POST("/v1/evals/query", {
        body: {
          filter: filter as any,
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
        },
      });
    },
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const { data: scoreDistributions } = useQuery({
    queryKey: [
      "scoreDistributions",
      org?.currentOrg?.id,
      timeFilter,
      userFilters,
    ],
    queryFn: async (query) => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      const timeFilter = query.queryKey[2] as TimeFilter;
      const filter = query.queryKey[3] as FilterNode;
      return jawn.POST("/v1/evals/score-distributions/query", {
        body: {
          filter: filter as any,
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
        },
      });
    },
  });

  const { data: evalScores } = useQuery({
    queryKey: ["evalScores", org?.currentOrg?.id],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      return jawn.GET("/v1/evals/scores");
    },
  });

  const evals = data?.data?.data || [];

  const [evalsToShow, setEvalsToShow] = useState<string[]>([]);
  const allEvalScores = evalScores?.data?.data || [];

  const handleSelectAll = () => {
    setEvalsToShow(allEvalScores);
  };

  const handleDeselectAll = () => {
    setEvalsToShow([]);
  };

  return (
    <>
      <AuthHeader
        title="Evals"
        actions={[
          <>
            <div className="flex items-center space-x-2">
              <MultiSelect
                value={evalsToShow}
                onValueChange={(value) => {
                  setEvalsToShow(value);
                }}
                className="max-w-[300px]"
              >
                {allEvalScores.map((evalScore) => (
                  <MultiSelectItem key={evalScore} value={evalScore}>
                    {evalScore}
                  </MultiSelectItem>
                ))}
              </MultiSelect>
              <button
                className="text-blue-600 hover:underline whitespace-nowrap"
                onClick={
                  evalsToShow.length > 0 ? handleDeselectAll : handleSelectAll
                }
              >
                {evalsToShow.length > 0 ? "Deselect All" : "Select All"}
              </button>
            </div>
          </>,
        ]}
      />
      <Col className="space-y-4">
        <ThemedTableHeader
          isFetching={isLoading}
          timeFilter={{
            currentTimeFilter: timeFilter,
            customTimeFilter: true,
            timeFilterOptions: [
              { key: "24h", value: "24H" },
              { key: "7d", value: "7D" },
              { key: "1m", value: "1M" },
              { key: "3m", value: "3M" },
            ],
            defaultTimeFilter: interval,
            onTimeSelectHandler: (key: TimeInterval, value: string) => {
              if ((key as string) === "custom") {
                value = value.replace("custom:", "");
                const start = new Date(value.split("_")[0]);
                const end = new Date(value.split("_")[1]);
                setInterval(key);
                setTimeFilter({
                  start,
                  end,
                });
              } else {
                setInterval(key);
                setTimeFilter({
                  start: getTimeIntervalAgo(key),
                  end: new Date(),
                });
              }
            },
          }}
          advancedFilter={{
            filterMap,
            onAdvancedFilter: setAdvancedFilters,
            filters: advancedFilters,
            searchPropertyFilters: searchPropertyFilters,
          }}
        />
        {isLoading && <LoadingAnimation />}
        {!isLoading && evals.length === 0 && (
          <div className="flex flex-col w-full mt-12 justify-center items-center">
            <div className="flex flex-col items-center max-w-3xl">
              <ChartBarIcon className="h-12 w-12 text-black dark:text-white" />
              <p className="text-xl text-black dark:text-white font-semibold mt-6">
                No Evals
              </p>
              <p className="text-sm text-gray-500 max-w-sm mt-2 text-center">
                Start adding evals to your requests to see them here.
              </p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="https://docs.helicone.ai/features/advanced-usage/evals"
                  className="w-fit items-center rounded-md bg-black px-3 py-2 gap-2 text-sm flex font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  View Docs
                </Link>
                <Link
                  href="/requests"
                  className="w-fit items-center rounded-md bg-blue-600 px-3 py-2 gap-2 text-sm flex font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Evals
                </Link>
              </div>
            </div>
          </div>
        )}
        {evals.length > 0 && (
          <div className="space-y-4">
            {evals
              .sort((a, b) => b.count - a.count)
              .map((evalRow, index) => {
                return (
                  <Card key={evalRow.name + index} className="w-full ">
                    <Row className="flex gap-10 justify-between">
                      <Col className="space-y-2">
                        <h2 className="text-xl font-semibold">
                          {evalRow.name}
                        </h2>
                        <p>{evalRow.count} traces</p>
                        <button className="text-blue-600 hover:underline">
                          View Traces
                        </button>
                      </Col>
                      <Col className="w-[300px]">
                        <span className="text-sm font-semibold">
                          Score Distribution
                        </span>
                        <Card>
                          <BarChart
                            data={
                              scoreDistributions?.data?.data
                                ?.find((s) => s.name === evalRow.name)
                                ?.distribution.map((d) => ({
                                  range: `${d.lower} - ${d.upper}`,
                                  count: d.value,
                                })) ?? []
                            }
                            index="range"
                            categories={["count"]}
                            colors={["blue"]}
                            yAxisWidth={48}
                          />
                        </Card>
                      </Col>
                      <Col className="w-[600px]">
                        <span className="text-sm font-semibold">Traces</span>
                        <Card>
                          <LineChart
                            data={evalRow.overTime.map((o) => ({
                              date: new Date(o.date).toLocaleDateString(),
                              count: o.count,
                            }))}
                            index="date"
                            categories={["count"]}
                            colors={["blue"]}
                            className="min-h-max"
                            yAxisWidth={40}
                            animationDuration={1000}
                            showAnimation={true}
                          />
                        </Card>
                      </Col>
                      <Col className="w-[600px]">
                        <span className="text-sm font-semibold">
                          Average Score
                        </span>
                        <Card>
                          <LineChart
                            data={evalRow.averageOverTime.map((o) => ({
                              date: new Date(o.date).toLocaleDateString(),
                              value: o.value,
                            }))}
                            index="date"
                            categories={["value"]}
                            colors={["blue"]}
                            className="min-h-max"
                            yAxisWidth={40}
                            animationDuration={1000}
                            showAnimation={true}
                          />
                        </Card>
                      </Col>
                      <Col className="space-y-2  flex flex-col justify-center min-h-max">
                        <Card className="text-sm">Max: {evalRow.maxScore}</Card>
                        <Card className="text-sm">Min: {evalRow.minScore}</Card>
                        <Card className="text-sm">
                          Average: {evalRow.averageScore}
                        </Card>
                      </Col>
                    </Row>
                  </Card>
                );
              })}
          </div>
        )}
      </Col>
    </>
  );
};

export default EvalsPage;
