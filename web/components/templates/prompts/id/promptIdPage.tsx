import { useEffect, useMemo, useRef, useState } from "react";
import {
  usePrompt,
  usePromptRequestsOverTime,
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";
import { Input as PromptInput } from "@/components/templates/prompts/id/MessageInput";
import { TimeFilter } from "@/types/timeFilter";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import {
  TimeInterval,
  getTimeInterval,
  getTimeIntervalAgo,
} from "../../../../lib/timeCalculations/time";
import { useGetDataSets } from "../../../../services/hooks/prompts/datasets";
import { useExperiments } from "../../../../services/hooks/prompts/experiments";
import { useInputs } from "../../../../services/hooks/prompts/inputs";
import { BackendMetricsCall } from "../../../../services/hooks/useBackendFunction";
import {
  FilterBranch,
  FilterLeaf,
} from "../../../../services/lib/filters/filterDefs";
import useNotification from "../../../shared/notification/useNotification";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import { MODEL_LIST } from "../../playground/new/modelList";
import { PromptMessage } from "../../requests/builder/components/chatComponent/types";
import PromptPlayground from "./promptPlayground";

import { useOrg } from "@/components/layout/org/organizationContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AreaChart, MultiSelect, MultiSelectItem } from "@tremor/react";
import { getTimeMap } from "../../../../lib/timeCalculations/constants";
import LoadingAnimation from "../../../shared/loadingAnimation";
import { SimpleTable } from "../../../shared/table/simpleTable";
import ThemedTimeFilter from "../../../shared/themed/themedTimeFilter";
import { getUSDateFromString } from "../../../shared/utils/utils";
import { Button } from "../../../ui/button";
import StyledAreaChart from "../../dashboard/styledAreaChart";
import ModelPill from "../../requests/modelPill";
import StatusBadge from "../../requests/statusBadge";
import TableFooter from "../../requests/tableFooter";
import PromptInputItem from "./promptInputItem";

interface PromptIdPageProps {
  id: string;
  currentPage: number;
  pageSize: number;
}

const PromptIdPage = (props: PromptIdPageProps) => {
  const { id, currentPage, pageSize } = props;
  const { prompt, isLoading, refetch: refetchPrompt } = usePrompt(id);
  const jawn = useJawnClient();
  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const searchParams = useSearchParams();
  const notification = useNotification();
  const { prompts, refetch: refetchPromptVersions } = usePromptVersions(id);

  const router = useRouter();

  const getTimeFilter = () => {
    const currentTimeFilter = searchParams?.get("t");
    let range: TimeFilter;

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
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(getTimeFilter());
  const getInterval = () => {
    const currentTimeFilter = searchParams?.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };
  const [interval, setInterval] = useState<TimeInterval>(
    getInterval() as TimeInterval
  );
  const timeIncrement = getTimeInterval(timeFilter);
  const promptIdFilterLeaf: FilterLeaf = {
    request_response_rmt: {
      properties: {
        "Helicone-Prompt-Id": {
          equals: prompt?.user_defined_id,
        },
      },
    },
  };
  const params: BackendMetricsCall<any>["params"] = {
    timeFilter: timeFilter,
    userFilters: {
      left: promptIdFilterLeaf,
      operator: "and",
      right: "all",
    } as FilterBranch,
    dbIncrement: timeIncrement,
    timeZoneDifference: new Date().getTimezoneOffset(),
  };
  const {
    data,
    isLoading: isPromptRequestsLoading,
    refetch,
    total,
  } = usePromptRequestsOverTime(
    params,
    "promptRequests" + prompt?.user_defined_id
  );
  const { experiments, isLoading: isExperimentsLoading } = useExperiments(
    {
      page,
      pageSize: currentPageSize,
    },
    props.id
  );
  const {
    datasets: datasets,
    isLoading: isDataSetsLoading,
    refetch: refetchDataSets,
  } = useGetDataSets();
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const filteredExperiments = experiments.filter(experiment => {
    if (
      selectedDatasets.length &&
      !selectedDatasets.includes(experiment.datasetId)
    ) {
      return false;
    }

    if (
      selectedModels.length &&
      experiment.model &&
      !selectedModels.includes(experiment.model)
    ) {
      return false;
    }

    return true;
  });

  const onTimeSelectHandler = (key: TimeInterval, value: string) => {
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
  };

  const startExperiment = async (
    promptVersionId: string,
    promptData: string
  ) => {
    const promptVersion = prompts?.find(p => p.id === promptVersionId);

    if (!promptVersion) {
      notification.setNotification("Prompt version not found", "error");
      return;
    }

    const experimentTableResult = await jawn.POST("/v2/experiment/new", {
      body: {
        name: `${prompt?.user_defined_id}_V${promptVersion?.major_version}.${promptVersion?.minor_version}`,
        originalPromptVersion: promptVersionId,
      },
    });

    if (experimentTableResult.error || !experimentTableResult.data) {
      notification.setNotification("Failed to create experiment", "error");
      return;
    }

    router.push(
      `/experiments/${experimentTableResult.data.data?.experimentId}`
    );
  };

  const org = useOrg();

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isOverMaxWidth, setIsOverMaxWidth] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  useEffect(() => {
    const handleResize = () => {
      if (window && window.innerWidth > 1808) {
        setIsOverMaxWidth(true);
      } else {
        setIsOverMaxWidth(false);
      }
    };

    handleResize();

    // also check on resize
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <main className="min-h-screen px-8">
      <Tabs defaultValue="editor">
        {/* Header */}
        <div className="flex flex-row items-center justify-between py-4">
          <HcBreadcrumb
            pages={[
              { href: "/prompts", name: "Prompts" },
              {
                href: `/prompts/${id}`,
                name: prompt?.user_defined_id || "Loading...",
              },
            ]}
          />
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <Button variant="action" size="default">
            Run & Save
          </Button>
        </div>

        {/* Prompt Editor */}
        <TabsContent value="editor">
          <ResizablePanels
            leftPanel={<div className="h-full">Left</div>}
            rightPanel={<div className="h-full">Right</div>}
          />
        </TabsContent>

        {/* Metrics */}
        <TabsContent value="metrics">
          <div className="flex flex-col space-y-16 py-4 px-4">
            <div className="w-full h-full flex flex-col space-y-4">
              <div className="flex items-center justify-between w-full">
                <ThemedTimeFilter
                  timeFilterOptions={[
                    { key: "24h", value: "24H" },
                    { key: "7d", value: "7D" },
                    { key: "1m", value: "1M" },
                    { key: "3m", value: "3M" },
                    // { key: "all", value: "All" },
                  ]}
                  custom={true}
                  onSelect={function (key: string, value: string): void {
                    onTimeSelectHandler(key as TimeInterval, value);
                  }}
                  isFetching={isPromptRequestsLoading}
                  defaultValue={interval}
                  currentTimeFilter={timeFilter}
                />
              </div>

              <div>
                <StyledAreaChart
                  title={"Total Requests"}
                  value={total}
                  isDataOverTimeLoading={isPromptRequestsLoading}
                  withAnimation={true}
                >
                  <AreaChart
                    className="h-[14rem]"
                    data={
                      data?.data?.map(r => ({
                        date: getTimeMap(timeIncrement)(r.time),
                        count: r.count,
                      })) ?? []
                    }
                    index="date"
                    categories={["count"]}
                    colors={["cyan"]}
                    showYAxis={false}
                    curveType="monotone"
                    valueFormatter={(number: number | bigint) => {
                      return `${new Intl.NumberFormat("us").format(
                        Number(number)
                      )}`;
                    }}
                  />
                </StyledAreaChart>
              </div>
            </div>
            <div className="flex flex-col space-y-4 h-full w-full">
              <h2 className="text-2xl font-semibold text-black dark:text-white">
                Experiment Logs
              </h2>
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-wrap items-center space-x-2 w-full">
                  <div className="w-full max-w-[16rem]">
                    <MultiSelect
                      placeholder="Dataset"
                      value={selectedDatasets}
                      onValueChange={value => {
                        setSelectedDatasets(value);
                      }}
                    >
                      {datasets.map(dataset => (
                        <MultiSelectItem value={dataset.id} key={dataset.id}>
                          {dataset.name}
                        </MultiSelectItem>
                      ))}
                    </MultiSelect>
                  </div>
                  <div className="w-full max-w-[16rem]">
                    <MultiSelect
                      placeholder="Model"
                      value={selectedModels}
                      onValueChange={value => {
                        setSelectedModels(value);
                      }}
                    >
                      {MODEL_LIST.map(model => (
                        <MultiSelectItem value={model.value} key={model.value}>
                          {model.label}
                        </MultiSelectItem>
                      ))}
                    </MultiSelect>
                  </div>
                  <div className="pl-2">
                    <Button
                      variant={"ghost"}
                      size={"sm"}
                      onClick={() => {
                        setSelectedDatasets([]);
                        setSelectedModels([]);
                      }}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
              {isExperimentsLoading ? (
                <div className="h-48 flex justify-center items-center">
                  <LoadingAnimation title="Loading Experiments..." />
                </div>
              ) : (
                <SimpleTable
                  data={filteredExperiments}
                  columns={[
                    {
                      key: "id",
                      header: "ID",
                      render: item => (
                        <span className="underline text-black dark:text-white">
                          {item.id}
                        </span>
                      ),
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: item => (
                        <StatusBadge statusType={item.status || "unknown"} />
                      ),
                    },
                    {
                      key: "createdAt",
                      header: "Created At",
                      render: item => (
                        <span>{getUSDateFromString(item.createdAt)}</span>
                      ),
                    },
                    {
                      key: "datasetName",
                      header: "Dataset",
                      render: item => item.datasetName,
                    },
                    {
                      key: "model",
                      header: "Model",
                      render: item => (
                        <ModelPill model={item.model || "unknown"} />
                      ),
                    },
                    {
                      key: "runCount",
                      header: "Run Count",
                      render: item => item.runCount || 0,
                    },
                  ]}
                  onSelect={item => {
                    router.push(`/prompts/${id}/experiments/${item.id}`);
                  }}
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default PromptIdPage;
