import {
  BookOpenIcon,
  ChartBarIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  MultiSelect,
  MultiSelectItem,
  Select,
  SelectItem,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  TextInput,
} from "@tremor/react";
import { useEffect, useState } from "react";
import {
  usePrompt,
  usePromptRequestsOverTime,
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";

import { BeakerIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/router";
import { useExperiments } from "../../../../services/hooks/prompts/experiments";
import { useInputs } from "../../../../services/hooks/prompts/inputs";
import { SimpleTable } from "../../../shared/table/simpleTable";
import { getUSDateFromString } from "../../../shared/utils/utils";
import HcBadge from "../../../ui/hcBadge";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import HcButton from "../../../ui/hcButton";
import { Chat } from "../../requests/chatComponent/chat";
import ModelPill from "../../requestsV2/modelPill";
import StatusBadge from "../../requestsV2/statusBadge";
import TableFooter from "../../requestsV2/tableFooter";
import PromptPropertyCard from "./promptPropertyCard";
import { useGetDataSets } from "../../../../services/hooks/prompts/datasets";
import { MODEL_LIST } from "../../playground/new/modelList";
import LoadingAnimation from "../../../shared/loadingAnimation";
import { BackendMetricsCall } from "../../../../services/hooks/useBackendFunction";
import ThemedTimeFilter from "../../../shared/themed/themedTimeFilter";
import StyledAreaChart from "../../dashboard/styledAreaChart";
import { getTimeMap } from "../../../../lib/timeCalculations/constants";
import {
  TimeInterval,
  getTimeInterval,
  getTimeIntervalAgo,
} from "../../../../lib/timeCalculations/time";
import { useSearchParams } from "next/navigation";
import { TimeFilter } from "../../dashboard/dashboardPage";
import { getTimeAgo } from "../../../../lib/sql/timeHelpers";
import {
  FilterBranch,
  FilterLeaf,
} from "../../../../services/lib/filters/filterDefs";
import PromptPlayground from "./promptPlayground";

interface PromptIdPageProps {
  id: string;
  currentPage: number;
  pageSize: number;
}

export const RenderImageWithPrettyInputKeys = (props: {
  text: string;
  selectedProperties: Record<string, string> | undefined;
}) => {
  const { text, selectedProperties } = props;

  // Function to replace matched patterns with JSX components
  const replaceInputKeysWithComponents = (inputText: string) => {
    if (typeof inputText !== "string") {
      // don't throw, stringify the input and return it
      return JSON.stringify(inputText);
    }

    // Regular expression to match the pattern
    const regex = /<helicone-prompt-input key="([^"]+)"\s*\/>/g;
    const parts = [];
    let lastIndex = 0;
    // Use the regular expression to find and replace all occurrences
    inputText.replace(regex, (match: any, keyName: string, offset: number) => {
      // Push preceding text if any
      if (offset > lastIndex) {
        parts.push(inputText.substring(lastIndex, offset));
      }

      const getRenderText = () => {
        if (selectedProperties) {
          return selectedProperties[keyName] || "{{undefined}}";
        } else {
          return keyName;
        }
      };
      const renderText = getRenderText();

      // eslint-disable-next-line @next/next/no-img-element
      parts.push(<img src={renderText} alt={keyName} className="max-h-24" />);

      // Update lastIndex to the end of the current match
      lastIndex = offset + match.length;

      // This return is not used but is necessary for the replace function
      return match;
    });

    // Add any remaining text after the last match
    if (lastIndex < inputText.length) {
      parts.push(inputText.substring(lastIndex));
    }
    return parts;
  };

  return (
    <div className="text-md leading-8 text-black dark:text-white">
      {replaceInputKeysWithComponents(text)}
    </div>
  );
};

type NotNullOrUndefined<T> = T extends null | undefined ? never : T;

type Input = {
  id: string;
  inputs: { [key: string]: string };
  source_request: string;
  prompt_version: string;
  created_at: string;
  response_body: string;
  auto_prompt_inputs: Record<string, string> | unknown[];
};

const PromptIdPage = (props: PromptIdPageProps) => {
  const { id, currentPage, pageSize } = props;
  const { prompt, isLoading } = usePrompt(id);
  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [inputView, setInputView] = useState<"list" | "grid">("list");
  const [selectedInput, setSelectedInput] = useState<Input | undefined>();

  const [searchRequestId, setSearchRequestId] = useState<string>("");
  const searchParams = useSearchParams();

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

  const { prompts } = usePromptVersions(id);

  const sortedPrompts = prompts?.sort((a, b) => {
    if (a.major_version === b.major_version) {
      return b.minor_version - a.minor_version;
    }
    return b.major_version - a.major_version;
  });

  const [selectedVersion, setSelectedVersion] = useState<string>(
    `${sortedPrompts?.at(0)?.major_version}.${
      sortedPrompts?.at(0)?.minor_version
    }`
  );

  useEffect(() => {
    if (sortedPrompts?.length) {
      setSelectedVersion(
        `${sortedPrompts[0].major_version}.${sortedPrompts[0].minor_version}`
      );
    }
  }, [sortedPrompts]);

  const selectedPrompt = prompts?.find(
    (p) =>
      p.major_version === parseInt(selectedVersion.split(".")[0]) &&
      p.minor_version === parseInt(selectedVersion.split(".")[1])
  );

  const { inputs } = useInputs(selectedPrompt?.id);

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

  const handleInputSelect = (input: Input | undefined) => {
    setSelectedInput(input);
  };

  return (
    <>
      <div className="w-full h-full flex flex-col space-y-8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col items-start space-y-4 w-full">
            <HcBreadcrumb
              pages={[
                {
                  href: "/prompts",
                  name: "Prompts",
                },
                {
                  href: `/prompts/${id}`,
                  name: prompt?.user_defined_id || "Loading...",
                },
              ]}
            />
            <div className="flex justify-between w-full">
              <div className="flex gap-4 items-end">
                <h1 className="font-semibold text-4xl text-black dark:text-white">
                  {prompt?.user_defined_id}
                </h1>
                <HcBadge
                  title={`${(prompt?.major_version ?? 0) + 1} version${
                    (prompt?.major_version ?? 0) + 1 > 1 ? "s" : ""
                  }`}
                  size={"sm"}
                />
              </div>
              <div className="flex gap-2">
                <HcButton
                  onClick={() => {
                    router.push(`/prompts/${id}/new-experiment`);
                  }}
                  variant={"primary"}
                  size={"sm"}
                  title="Start Experiment"
                  icon={BeakerIcon}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <p className="">
                last used{" "}
                {prompt?.last_used && getTimeAgo(new Date(prompt?.last_used))}
              </p>
              <div className="rounded-full h-1 w-1 bg-slate-400" />
              <p className="">
                created on{" "}
                {prompt?.created_at &&
                  new Date(prompt?.created_at).toDateString()}
              </p>
            </div>
          </div>
        </div>
        <TabGroup>
          <TabList variant="line" defaultValue="1">
            <Tab value="1" icon={ChartBarIcon}>
              Overview
            </Tab>
            <Tab value="2" icon={BookOpenIcon}>
              Prompt & Inputs
            </Tab>
            <Tab value="3" icon={PencilIcon}>
              Prompt
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <div className="flex flex-col space-y-16 py-4">
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
                          onValueChange={(value) => {
                            setSelectedDatasets(value);
                          }}
                        >
                          {datasets.map((dataset) => (
                            <MultiSelectItem
                              value={dataset.id}
                              key={dataset.id}
                            >
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
                            <MultiSelectItem
                              value={model.value}
                              key={model.value}
                            >
                              {model.label}
                            </MultiSelectItem>
                          ))}
                        </MultiSelect>
                      </div>
                      <div className="pl-2">
                        <HcButton
                          variant={"light"}
                          size={"sm"}
                          title={"Clear All"}
                          onClick={() => {
                            setSelectedDatasets([]);
                            setSelectedModels([]);
                          }}
                        />
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
                          render: (item) => (
                            <span className="underline text-black dark:text-white">
                              {item.id}
                            </span>
                          ),
                        },
                        {
                          key: "status",
                          header: "Status",
                          render: (item) => (
                            <StatusBadge
                              statusType={item.status || "unknown"}
                            />
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
                          render: (item) => (
                            <ModelPill model={item.model || "unknown"} />
                          ),
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

                  <TableFooter
                    currentPage={currentPage}
                    pageSize={100}
                    count={experiments.length}
                    isCountLoading={false}
                    onPageChange={function (newPageNumber: number): void {
                      // throw new Error("Function not implemented.");
                    }}
                    onPageSizeChange={function (newPageSize: number): void {
                      // throw new Error("Function not implemented.");
                    }}
                    pageSizeOptions={[25, 50, 100]}
                  />
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <div className="flex items-start relative h-[75vh]">
                <div className="min-w-[25rem] w-1/3 py-4 pr-4 flex flex-col space-y-4 h-full">
                  <div className="flex flex-col w-full space-y-2">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-lg text-black dark:text-white">
                        Inputs
                      </p>
                    </div>
                    <TextInput
                      placeholder="Search by request id..."
                      value={searchRequestId}
                      onValueChange={(value) => setSearchRequestId(value)}
                    />
                  </div>
                  <ul className="flex flex-col space-y-4 overflow-auto h-full">
                    {inputs
                      ?.filter((input) =>
                        input.source_request.includes(searchRequestId)
                      )
                      .map((input) => (
                        <li key={input.id}>
                          <PromptPropertyCard
                            isSelected={selectedInput?.id === input.id}
                            onSelect={function (): void {
                              if (selectedInput?.id === input.id) {
                                setSelectedInput(undefined);
                              } else {
                                setSelectedInput(input);
                              }
                            }}
                            requestId={input.source_request}
                            createdAt={input.created_at}
                            properties={input.inputs}
                            autoInputs={input.auto_prompt_inputs}
                            view={inputView}
                          />
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="p-4 flex flex-col space-y-4 w-full h-full">
                  <div className="w-full flex justify-between items-center flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-lg text-black dark:text-white">
                        Prompt
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 w-full max-w-xs">
                      <label className="text-sm text-gray-500">Version:</label>
                      <Select
                        value={selectedVersion}
                        onValueChange={(value) => setSelectedVersion(value)}
                      >
                        {sortedPrompts
                          ?.sort(
                            (a, b) =>
                              b.major_version - a.major_version ||
                              a.minor_version - b.minor_version
                          )
                          .map((prompt) => (
                            <SelectItem
                              value={`${prompt.major_version}.${prompt.minor_version}`}
                              key={prompt.id}
                            >
                              {prompt.major_version}.{prompt.minor_version}
                            </SelectItem>
                          ))}
                      </Select>
                    </div>
                  </div>
                  <PromptPlayground
                    prompt={selectedPrompt?.helicone_template || ""}
                    selectedInput={selectedInput}
                    onSubmit={(history) => {
                      // Handle submission if needed
                      console.log("Submitted history:", history);
                    }}
                    submitText="Submit"
                  />
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <div className="py-4"></div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </>
  );
};

export default PromptIdPage;
