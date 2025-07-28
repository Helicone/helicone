import { TimeFilter } from "@/types/timeFilter";
import { AreaChart, MultiSelect, MultiSelectItem } from "@tremor/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useState } from "react";
import { getTimeMap } from "../../../../lib/timeCalculations/constants";
import {
  TimeInterval,
  getTimeInterval,
  getTimeIntervalAgo,
} from "../../../../lib/timeCalculations/time";
import { useGetDataSets } from "../../../../services/hooks/prompts/datasets";
import { useExperiments } from "../../../../services/hooks/prompts/experiments";
import { usePromptRequestsOverTime } from "../../../../services/hooks/prompts/prompts";
import { BackendMetricsCall } from "../../../../services/hooks/useBackendFunction";
import { FilterBranch, FilterLeaf } from "@helicone-package/filters/filterDefs";
import LoadingAnimation from "../../../shared/loadingAnimation";
import { SimpleTable } from "../../../shared/table/simpleTable";
import ThemedTimeFilter from "../../../shared/themed/themedTimeFilter";
import { getUSDateFromString } from "../../../shared/utils/utils";
import { Button } from "../../../ui/button";
import StyledAreaChart from "../../dashboard/styledAreaChart";
import { MODEL_LIST } from "../../playground/new/modelList";
import ModelPill from "../../requests/modelPill";
import StatusBadge from "../../requests/statusBadge";

interface PromptMetricsTabProps {
  id: string;
  promptUserDefinedId: string;
}

const PromptMetricsTab = ({
  id,
  promptUserDefinedId,
}: PromptMetricsTabProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

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
    getInterval() as TimeInterval,
  );
  const timeIncrement = getTimeInterval(timeFilter);

  const promptIdFilterLeaf: FilterLeaf = {
    request_response_rmt: {
      properties: {
        "Helicone-Prompt-Id": {
          equals: promptUserDefinedId,
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
    total,
  } = usePromptRequestsOverTime(params, "promptRequests" + promptUserDefinedId);

  const { experiments, isLoading: isExperimentsLoading } = useExperiments(
    {
      page: 1,
      pageSize: 10,
    },
    id,
  );

  const { datasets } = useGetDataSets();
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const filteredExperiments = experiments.filter((experiment) => {
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

  return (
    <div className="flex flex-col space-y-16 px-4 py-4">
      <div className="flex h-full w-full flex-col space-y-4">
        <h2 className="text-2xl font-semibold text-secondary">Usage Metrics</h2>
        <div className="flex w-full items-center justify-between">
          <ThemedTimeFilter
            timeFilterOptions={[
              { key: "24h", value: "24H" },
              { key: "7d", value: "7D" },
              { key: "1m", value: "1M" },
              { key: "3m", value: "3M" },
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
                data?.data?.map((r) => ({
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
                return `${new Intl.NumberFormat("us").format(Number(number))}`;
              }}
            />
          </StyledAreaChart>
        </div>
      </div>
      <div className="flex h-full w-full flex-col space-y-4">
        <h2 className="text-2xl font-semibold text-secondary">
          Experiment Logs
        </h2>
        <div className="flex w-full items-center justify-between">
          <div className="flex w-full flex-wrap items-center space-x-2">
            <div className="w-full max-w-[16rem]">
              <MultiSelect
                placeholder="Dataset"
                value={selectedDatasets}
                onValueChange={(value) => {
                  setSelectedDatasets(value);
                }}
              >
                {datasets.map((dataset) => (
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
                onValueChange={(value) => {
                  setSelectedModels(value);
                }}
              >
                {MODEL_LIST.map((model) => (
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
          <div className="flex h-48 items-center justify-center">
            <LoadingAnimation title="Loading Experiments..." />
          </div>
        ) : (
          <SimpleTable
            data={filteredExperiments}
            columns={[
              {
                key: "id",
                header: "ID",
                render: (item) => (
                  <span className="text-black underline dark:text-white">
                    {item.id}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (item) => (
                  <StatusBadge statusType={item.status || "unknown"} />
                ),
              },
              {
                key: "createdAt",
                header: "Created At",
                render: (item) => (
                  <span>{getUSDateFromString(item.createdAt)}</span>
                ),
              },
              {
                key: "datasetName",
                header: "Dataset",
                render: (item) => item.datasetName,
              },
              {
                key: "model",
                header: "Model",
                render: (item) => <ModelPill model={item.model || "unknown"} />,
              },
              {
                key: "runCount",
                header: "Run Count",
                render: (item) => item.runCount || 0,
              },
            ]}
            onSelect={(item) => {
              router.push(`/prompts/${id}/experiments/${item.id}`);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PromptMetricsTab;
