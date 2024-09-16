import { useEffect, useState, useMemo } from "react";
import {
  usePrompt,
  usePromptRequestsOverTime,
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";

import {
  BeakerIcon,
  BookOpenIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useExperiments } from "../../../../services/hooks/prompts/experiments";
import { useInputs } from "../../../../services/hooks/prompts/inputs";
import HcBadge from "../../../ui/hcBadge";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import HcButton from "../../../ui/hcButton";
import { useGetDataSets } from "../../../../services/hooks/prompts/datasets";
import { MODEL_LIST } from "../../playground/new/modelList";
import { BackendMetricsCall } from "../../../../services/hooks/useBackendFunction";
import {
  TimeInterval,
  getTimeInterval,
  getTimeIntervalAgo,
} from "../../../../lib/timeCalculations/time";
import { useSearchParams } from "next/navigation";
import { TimeFilter } from "../../dashboard/dashboardPage";
import {
  FilterBranch,
  FilterLeaf,
} from "../../../../services/lib/filters/filterDefs";
import PromptPlayground from "./promptPlayground";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import useNotification from "../../../shared/notification/useNotification";
import { Message } from "../../requests/chatComponent/types";

import { Badge } from "../../../ui/badge";
import { ScrollArea } from "../../../ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/solid";
import {
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  MultiSelect,
  MultiSelectItem,
  AreaChart,
  TextInput,
} from "@tremor/react";
import { getTimeMap } from "../../../../lib/timeCalculations/constants";
import LoadingAnimation from "../../../shared/loadingAnimation";
import { SimpleTable } from "../../../shared/table/simpleTable";
import ThemedTimeFilter from "../../../shared/themed/themedTimeFilter";
import { getUSDateFromString } from "../../../shared/utils/utils";
import StyledAreaChart from "../../dashboard/styledAreaChart";
import ModelPill from "../../requestsV2/modelPill";
import StatusBadge from "../../requestsV2/statusBadge";
import PromptPropertyCard from "./promptPropertyCard";
import TableFooter from "../../requestsV2/tableFooter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../ui/tooltip";
import { Button } from "../../../ui/button";
import ExperimentPanel from "./experimentPanel";
import { useUser } from "@supabase/auth-helpers-react";

interface PromptIdPageProps {
  id: string;
  currentPage: number;
  pageSize: number;
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const secondsPast = (now.getTime() - date.getTime()) / 1000;

  if (secondsPast < 60) {
    return "just now";
  }
  if (secondsPast < 3600) {
    return `${Math.floor(secondsPast / 60)} minutes ago`;
  }
  if (secondsPast <= 86400) {
    return `${Math.floor(secondsPast / 3600)} hours ago`;
  }
  if (secondsPast <= 2592000) {
    return `${Math.floor(secondsPast / 86400)} days ago`;
  }
  if (secondsPast <= 31536000) {
    return `${Math.floor(secondsPast / 2592000)} months ago`;
  }
  return `${Math.floor(secondsPast / 31536000)} years ago`;
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

// Update the Input type definition
type Input = {
  id: string;
  inputs: { [key: string]: string };
  source_request: string;
  prompt_version: string;
  created_at: string;
  response_body?: string; // Make response_body optional
  auto_prompt_inputs: Record<string, string> | unknown[];
};

const PromptIdPage = (props: PromptIdPageProps) => {
  const { id, currentPage, pageSize } = props;
  const { prompt, isLoading, refetch: refetchPrompt } = usePrompt(id);
  const jawn = useJawnClient();
  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [inputView, setInputView] = useState<"list" | "grid">("list");
  const [selectedInput, setSelectedInput] = useState<Input | undefined>();
  const [searchRequestId, setSearchRequestId] = useState<string>("");
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

  const createSubversion = async (history: Message[], model: string) => {
    if (prompt?.metadata?.createdFromUi === false) {
      notification.setNotification(
        "Prompt was not created from the UI, please change the prompt in your codebase to use the new version",
        "error"
      );
      return;
    }
    const promptData = {
      model: model,
      messages: history.map((msg) => ({
        role: msg.role,
        content: [
          {
            text: msg.content,
            type: "text",
          },
        ],
      })),
    };

    const result = await jawn.POST(
      "/v1/prompt/version/{promptVersionId}/subversion",
      {
        params: {
          path: {
            promptVersionId: prompt?.latest_version_id || "",
          },
        },
        body: {
          newHeliconeTemplate: JSON.stringify(promptData),
          isMajorVersion: true,
          metadata: {
            createdFromUi: true,
          },
        },
      }
    );

    if (result.error || !result.data.data) {
      notification.setNotification("Failed to create subversion", "error");
      return;
    }
    notification.setNotification("New version created successfully", "success");
    refetchPromptVersions();
    refetchPrompt();
  };

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

  const sortedPrompts = prompts?.sort((a, b) => {
    if (a.major_version === b.major_version) {
      return b.minor_version - a.minor_version;
    }
    return b.major_version - a.major_version;
  });

  const [selectedVersion, setSelectedVersion] = useState<string>("");

  useEffect(() => {
    if (sortedPrompts?.length) {
      setSelectedVersion(
        `${sortedPrompts[0].major_version}.${sortedPrompts[0].minor_version}`
      );
    }
  }, [sortedPrompts]);

  const selectedPrompt = useMemo(() => {
    return prompts?.find(
      (p) =>
        p.major_version === parseInt(selectedVersion.split(".")[0]) &&
        p.minor_version === parseInt(selectedVersion.split(".")[1])
    );
  }, [prompts, selectedVersion]);

  const model = useMemo(() => {
    try {
      return (
        (selectedPrompt?.helicone_template as any).model || MODEL_LIST[0].value
      );
    } catch (error) {
      console.error("Error parsing helicone_template:", error);
      return MODEL_LIST[0].value;
    }
  }, [selectedPrompt]);

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

  const setSelectedInputAndVersion = (version: string) => {
    setSelectedVersion(version);
    setSelectedInput(undefined);
  };

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

  const promoteToProduction = async (promptVersionId: string) => {
    if (prompt?.metadata?.createdFromUi === false) {
      notification.setNotification(
        "Prompt was not created from the UI, please change the prompt in your codebase to use the new version",
        "error"
      );
      return;
    }
    const getPreviousProductionId = () => {
      const productionPrompt = prompts?.find(
        (p) => p.metadata?.isProduction === true
      );
      if (productionPrompt) return productionPrompt.id;

      // If no production prompt, find the one with the highest major version
      const latestPrompt = prompts?.reduce((latest, current) => {
        if (!latest || current.major_version > latest.major_version) {
          return current;
        }
        return latest;
      }, null as (typeof prompts extends (infer T)[] ? T : never) | null);

      return latestPrompt?.id || "";
    };

    const result = await jawn.POST(
      "/v1/prompt/version/{promptVersionId}/promote",
      {
        params: {
          path: {
            promptVersionId: promptVersionId,
          },
        },
        body: {
          previousProductionVersionId: getPreviousProductionId(),
        },
      }
    );

    if (result.error || !result.data) {
      notification.setNotification(
        "Failed to promote version to production",
        "error"
      );
      return;
    }
    notification.setNotification(
      "Version promoted to production successfully",
      "success"
    );
    refetchPromptVersions();
    refetchPrompt();
  };

  const startExperiment = async (promptVersionId: string) => {
    const dataset = await jawn.POST("/v1/helicone-dataset", {
      body: {
        datasetName: "Dataset for Experiment",
        requestIds: [],
      },
    });
    if (!dataset.data?.data?.datasetId) {
      notification.setNotification("Failed to create dataset", "error");
      return;
    }
    const experiment = await jawn.POST("/v1/experiment/new-empty", {
      body: {
        metadata: {
          prompt_id: id,
          prompt_version: prompt?.id || "",
        },
        datasetId: dataset.data?.data?.datasetId,
      },
    });
    if (!experiment.data?.data?.experimentId) {
      notification.setNotification("Failed to create experiment", "error");
      return;
    }
    router.push(
      `/prompts/${id}/subversion/${prompt?.id}/experiment/${experiment.data?.data?.experimentId}`
    );
  };

  const deletePromptVersion = async (promptVersionId: string) => {
    if (prompt?.metadata?.createdFromUi === false) {
      notification.setNotification(
        "Prompt was not created from the UI, please change the prompt in your codebase to use the new version",
        "error"
      );
      return;
    }
    const version = prompts?.find((p) => p.id === promptVersionId);
    if (version?.metadata?.isProduction) {
      notification.setNotification("Cannot delete production version", "error");
      return;
    }
    const result = await jawn.DELETE("/v1/prompt/version/{promptVersionId}", {
      params: {
        path: {
          promptVersionId: promptVersionId,
        },
      },
    });
    if (result.error || !result.data) {
      notification.setNotification("Failed to delete version", "error");
      return;
    }
    notification.setNotification("Version deleted successfully", "success");
    refetchPromptVersions();
    refetchPrompt();
  };
  const user = useUser();

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      <div className="flex flex-row items-center justify-between">
        <HcBreadcrumb
          pages={[
            { href: "/prompts", name: "Prompts" },
            {
              href: `/prompts/${id}`,
              name: prompt?.user_defined_id || "Loading...",
            },
          ]}
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="font-semibold text-4xl text-black dark:text-white">
            {prompt?.user_defined_id}
          </h1>
          <HcBadge title={`${prompt?.versions.length} versions`} size={"sm"} />
          <TooltipProvider>
            {prompt?.metadata?.createdFromUi === true ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={"sm"}
                    className="h-6 bg-[#F1F5F9] border border-[#CBD5E1]"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit / View
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[15rem]" align="center">
                  <p>
                    This prompt was created{" "}
                    <span className="font-semibold">in the UI</span>. You can
                    edit / delete them, or promote to prod.
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={"sm"}
                    className="h-6 bg-[#F1F5F9] border border-[#CBD5E1]"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View only
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[15rem]" align="center">
                  <p>
                    This prompt was created{" "}
                    <span className="font-semibold">in code</span>. You
                    won&apos;t be able to edit this from the UI.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
        <HcButton
          onClick={() => router.push(`/prompts/${id}/new-experiment`)}
          variant="primary"
          size="sm"
          title="Start Experiment"
          icon={BeakerIcon}
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <p className="">
          last used{" "}
          {prompt?.last_used && getTimeAgo(new Date(prompt?.last_used))}
        </p>
        <div className="rounded-full h-1 w-1 bg-slate-400" />
        <p className="">
          created on{" "}
          {prompt?.created_at && new Date(prompt?.created_at).toDateString()}
        </p>
      </div>
      <TabGroup>
        <TabList variant="line" defaultValue="1">
          <Tab value="1" icon={BookOpenIcon}>
            Prompt & Inputs
          </Tab>
          {user?.email?.includes("helicone.ai") ? (
            <Tab value="2" icon={BeakerIcon}>
              Experiments
            </Tab>
          ) : (
            <></>
          )}
          <Tab value="3" icon={ChartBarIcon}>
            Overview
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div className="flex items-start relative h-[75vh]">
              <div className="py-4 flex flex-col space-y-4 w-full h-full">
                <div className="flex space-x-4">
                  <div className="w-2/3">
                    <PromptPlayground
                      prompt={selectedPrompt?.helicone_template || ""}
                      selectedInput={selectedInput}
                      onSubmit={async (history, model) => {
                        await createSubversion(history, model);
                      }}
                      submitText="Test"
                      initialModel={model}
                      isPromptCreatedFromUi={
                        prompt?.metadata?.createdFromUi as boolean | undefined
                      }
                    />
                  </div>
                  <div className="w-1/3 flex flex-col space-y-4">
                    <div className="border border-gray-300 dark:border-gray-700 rounded-lg bg-[#F9FAFB]">
                      <div className="flex flex-row items-center justify-between px-4 h-12 ">
                        <h2 className="text-lg font-medium ">Versions</h2>
                      </div>

                      <ScrollArea className="h-[25vh] rounded-b-lg">
                        <div>
                          {sortedPrompts?.map((promptVersion) => (
                            <div
                              key={promptVersion.id}
                              className={`px-4 py-2 cursor-pointer border-t border-gray-200 dark:border-gray-700 ${
                                selectedVersion ===
                                `${promptVersion.major_version}.${promptVersion.minor_version}`
                                  ? "bg-sky-100 border-sky-500 dark:bg-sky-950 border-b"
                                  : "bg-gray-50 dark:bg-gray-900"
                              }`}
                              onClick={() =>
                                setSelectedInputAndVersion(
                                  `${promptVersion.major_version}.${promptVersion.minor_version}`
                                )
                              }
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <div className="border rounded-full border-gray-500 bg-white dark:bg-black h-6 w-6 flex items-center justify-center">
                                    {selectedVersion ===
                                      `${promptVersion.major_version}.${promptVersion.minor_version}` && (
                                      <div className="bg-sky-500 rounded-full h-4 w-4" />
                                    )}
                                  </div>
                                  <span className="font-medium text-lg">
                                    V{promptVersion.major_version}.
                                    {promptVersion.minor_version}
                                  </span>
                                  <span>
                                    {promptVersion.metadata?.isProduction ===
                                    true ? (
                                      <Badge
                                        variant={"default"}
                                        className="bg-[#F1F5F9] border border-[#CBD5E1] text-[#14532D] text-sm font-medium rounded-lg px-4 hover:bg-[#F1F5F9] hover:text-[#14532D]"
                                      >
                                        Prod
                                      </Badge>
                                    ) : (
                                      <></>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {prompt?.metadata?.createdFromUi === true && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                                          <EllipsisHorizontalIcon className="h-6 w-6 text-gray-500" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        {promptVersion.metadata
                                          ?.isProduction !== true && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              promoteToProduction(
                                                promptVersion.id
                                              )
                                            }
                                          >
                                            <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                                            Promote to prod
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                          onClick={() =>
                                            startExperiment(promptVersion.id)
                                          }
                                        >
                                          <BeakerIcon className="h-4 w-4 mr-2" />
                                          Experiment
                                        </DropdownMenuItem>
                                        {}
                                        {promptVersion.metadata
                                          ?.isProduction !== true && (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              deletePromptVersion(
                                                promptVersion.id
                                              )
                                            }
                                          >
                                            <TrashIcon className="h-4 w-4 mr-2 text-red-500" />
                                            <p className="text-red-500">
                                              Delete
                                            </p>
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-500">
                                  {getTimeAgo(
                                    new Date(promptVersion.created_at)
                                  )}
                                </span>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {promptVersion.model}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="border border-gray-300 dark:border-gray-700 rounded-lg bg-[#F9FAFB]">
                      <div className="flex flex-row items-center justify-between mx-4 h-12">
                        <h2 className="text-lg font-medium ">Inputs</h2>
                        <div className="pl-4 w-full">
                          <TextInput
                            placeholder="Search by request id..."
                            value={searchRequestId}
                            onValueChange={(value) => setSearchRequestId(value)}
                          />
                        </div>
                      </div>

                      <ScrollArea className="h-[30vh] rounded-b-lg">
                        <ul className="flex flex-col ">
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
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
          {user?.email?.includes("helicone.ai") && (
            <TabPanel>
              <ExperimentPanel promptId={id} />
            </TabPanel>
          )}

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
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default PromptIdPage;
