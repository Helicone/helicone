import { useEffect, useState, useMemo } from "react";
import {
  usePrompt,
  usePromptRequestsOverTime,
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";

import {
  BeakerIcon,
  ArrowTrendingUpIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useExperiments } from "../../../../services/hooks/prompts/experiments";
import { useInputs } from "../../../../services/hooks/prompts/inputs";
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
import TableFooter from "../../requestsV2/tableFooter";
import { Button } from "../../../ui/button";
import { useUser } from "@supabase/auth-helpers-react";
import { IslandContainer } from "../../../ui/islandContainer";
import { useFeatureFlags } from "@/services/hooks/featureFlags";
import { useOrg } from "@/components/layout/organizationContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";

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
  auto_prompt_inputs: Record<string, any>[] | unknown[];
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
    setSelectedInput((prevInput) => {
      if (prevInput?.id === input?.id) {
        return undefined; // Deselect if the same input is clicked again
      }
      return input;
    });
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

  const startExperiment = async (
    promptVersionId: string,
    promptData: string
  ) => {
    if (!(experimentFlags?.hasFlag || user?.email?.includes("helicone.ai"))) {
      notification.setNotification(
        "Experiment feature is not enabled - sign up for the waitlist to use it",
        "error"
      );
      return;
    }
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
    const promptVersion = prompts?.find((p) => p.id === promptVersionId);
    const experiment = await jawn.POST("/v1/experiment/new-empty", {
      body: {
        metadata: {
          prompt_id: id,
          prompt_version: promptVersionId || "",
          experiment_name:
            `${prompt?.user_defined_id}_V${promptVersion?.major_version}.${promptVersion?.minor_version}` ||
            "",
        },
        datasetId: dataset.data?.data?.datasetId,
      },
    });
    if (!experiment.data?.data?.experimentId) {
      notification.setNotification("Failed to create experiment", "error");
      return;
    }
    const result = await jawn.POST(
      "/v1/prompt/version/{promptVersionId}/subversion",
      {
        params: {
          path: {
            promptVersionId: promptVersionId,
          },
        },
        body: {
          newHeliconeTemplate: JSON.stringify(promptData),
          isMajorVersion: false,
          metadata: {
            experimentAssigned: true,
          },
        },
      }
    );

    if (result.error || !result.data) {
      notification.setNotification("Failed to create subversion", "error");
      return;
    }

    // const randomInputData = await jawn.POST(
    //   "/v1/prompt/version/{promptVersionId}/inputs/query",
    //   {
    //     params: {
    //       path: {
    //         promptVersionId: promptVersionId,
    //       },
    //     },
    //     body: {
    //       limit: 10,
    //       random: true,
    //     },
    //   }
    // );

    // if (
    //   randomInputData.error ||
    //   !randomInputData.data ||
    //   !randomInputData.data.data
    // ) {
    //   notification.setNotification("Failed to get random inputs", "error");
    //   return;
    // }

    // await Promise.all(
    //   randomInputData?.data?.data?.map((request) => {
    //     return jawn.POST(
    //       "/v1/experiment/dataset/{datasetId}/version/{promptVersionId}/row",
    //       {
    //         body: {
    //           inputs: request.inputs,
    //           sourceRequest: request.source_request,
    //         },
    //         params: {
    //           path: {
    //             promptVersionId: promptVersionId,
    //             datasetId: dataset.data?.data?.datasetId ?? "",
    //           },
    //         },
    //       }
    //     );
    //   })
    // );

    // const hypothesis = await jawn.POST("/v1/experiment/hypothesis", {
    //   body: {
    //     experimentId: experiment.data?.data?.experimentId,
    //     model: model,
    //     promptVersion: promptVersionId,
    //     providerKeyId: "NOKEY",
    //     status: "RUNNING",
    //   },
    // });

    // const runResult = await jawn.POST("/v1/experiment/run", {
    //   body: {
    //     experimentId: experiment.data?.data?.experimentId,
    //     hypothesisId: hypothesis.data?.data?.hypothesisId || "",
    //     datasetRowIds: [],
    //   },
    // });
    // if (runResult.error || !runResult.data) {
    //   notification.setNotification("Failed to run experiment", "error");
    //   return;
    // }

    router.push(
      `/prompts/${id}/subversion/${promptVersionId}/experiment/${experiment.data?.data?.experimentId}`
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
  const org = useOrg();

  const experimentFlags = useFeatureFlags(
    "experiment",
    org?.currentOrg?.id ?? ""
  );

  const [isVersionsExpanded, setIsVersionsExpanded] = useState(true);
  const [isInputsExpanded, setIsInputsExpanded] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  return (
    <div>
      <div className="w-full h-full flex flex-col space-y-4 pt-4">
        <Tabs defaultValue="prompt">
          <IslandContainer>
            <div className="flex flex-row items-center justify-between">
              <div className="flex items-center space-x-4">
                <HcBreadcrumb
                  pages={[
                    { href: "/prompts", name: "Prompts" },
                    {
                      href: `/prompts/${id}`,
                      name: prompt?.user_defined_id || "Loading...",
                    },
                  ]}
                />
                <Popover>
                  {prompt?.metadata?.createdFromUi === true ? (
                    <>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size={"sm"}
                          className="h-6 bg-[#F1F5F9] border border-[#CBD5E1]"
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Editable
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="max-w-[15rem]" align="center">
                        <p className="text-sm">
                          This prompt was created{" "}
                          <span className="font-semibold">in the UI</span>. You
                          can edit / delete them, or promote to prod.
                        </p>
                      </PopoverContent>
                    </>
                  ) : (
                    <>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size={"sm"}
                          className="h-6 bg-[#F1F5F9] border border-[#CBD5E1]"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View only
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="max-w-[15rem]" align="center">
                        <p className="text-sm">
                          This prompt was created{" "}
                          <span className="font-semibold">in code</span>. You
                          won&apos;t be able to edit this from the UI.
                        </p>
                      </PopoverContent>
                    </>
                  )}
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <InformationCircleIcon className="h-6 w-6 text-slate-500 cursor-pointer" />
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4" align="start">
                    <div className="space-y-2">
                      <div className="border-b border-slate-200 dark:border-slate-600 py-2 p-4">
                        <h3 className="text-sm font-semibold text-slate-700 ">
                          Prompt Name
                        </h3>
                        <p className="text-xs font-medium text-slate-500">
                          {prompt?.user_defined_id}
                        </p>
                      </div>
                      <div className="border-b border-slate-200 dark:border-slate-600 py-2 px-4">
                        <h3 className="text-sm font-semibold text-slate-700">
                          Versions
                        </h3>
                        <p className="text-xs font-medium text-slate-500">
                          {sortedPrompts?.length}
                        </p>
                      </div>
                      <div className="py-2 px-4">
                        <h3 className="text-sm font-semibold text-slate-700">
                          Last used
                        </h3>
                        <p className="text-xs font-medium text-slate-500">
                          {prompt?.last_used
                            ? getTimeAgo(new Date(prompt?.last_used))
                            : "Never"}
                        </p>
                      </div>
                      <div className="py-2 px-4">
                        <h3 className="text-sm font-semibold text-slate-700">
                          Created on
                        </h3>
                        <p className="text-xs font-medium text-slate-500">
                          {prompt?.created_at &&
                            new Date(prompt?.created_at).toDateString()}
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center space-x-4">
                <TabsList className="grid w-64 h-11 grid-cols-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 ">
                  <TabsTrigger
                    value="prompt"
                    className="rounded-md transition-colors data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-950 dark:data-[state=active]:text-slate-50"
                  >
                    Prompt & Inputs
                  </TabsTrigger>
                  <TabsTrigger
                    value="metrics"
                    className="rounded-md transition-colors data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-950 dark:data-[state=active]:text-slate-50"
                  >
                    Metrics
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </IslandContainer>

          <TabsContent value="prompt">
            <div className="flex items-start relative min-h-[75vh]">
              <div className="py-4 flex flex-col space-y-4 w-full h-full">
                <div className="flex">
                  <div className="w-2/3">
                    <PromptPlayground
                      prompt={selectedPrompt?.helicone_template || ""}
                      selectedInput={selectedInput || undefined}
                      onSubmit={async (history, model) => {
                        await createSubversion(history, model);
                      }}
                      submitText="Test"
                      initialModel={model}
                      isPromptCreatedFromUi={
                        prompt?.metadata?.createdFromUi as boolean | undefined
                      }
                      className="border-y"
                    />
                  </div>
                  <div className="w-1/3 flex flex-col">
                    <div className="border-y border-x border-[#E8EAEC] dark:border-slate-700 bg-[#F9FAFB] dark:bg-black">
                      <div
                        className="flex flex-row items-center justify-between px-4 h-12 cursor-pointer"
                        onClick={() =>
                          setIsVersionsExpanded(!isVersionsExpanded)
                        }
                      >
                        <h2 className="text-lg font-medium">Versions</h2>
                        <ChevronDownIcon
                          className={`h-5 w-5 transition-transform ${
                            isVersionsExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>

                      {isVersionsExpanded && (
                        <ScrollArea className="h-[25vh] rounded-b-lg">
                          <div>
                            {sortedPrompts?.map((promptVersion, index) => {
                              const isProduction =
                                promptVersion.metadata?.isProduction === true;
                              const isSelected =
                                selectedVersion ===
                                `${promptVersion.major_version}.${promptVersion.minor_version}`;
                              const isFirst = index === 0;
                              const isLast = index === sortedPrompts.length - 1;

                              return (
                                <div
                                  key={promptVersion.id}
                                  className={`flex flex-row w-full h-12 ${
                                    isSelected
                                      ? "bg-sky-100 dark:bg-sky-950"
                                      : "bg-slate-50 dark:bg-slate-900"
                                  } ${
                                    isFirst
                                      ? "border-t border-slate-300 dark:border-slate-700"
                                      : ""
                                  } ${
                                    isLast
                                      ? "border-b border-slate-300 dark:border-slate-700"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center">
                                    {isSelected && (
                                      <div className="bg-sky-500 h-full w-1" />
                                    )}
                                  </div>
                                  <div
                                    className={`flex-grow px-4 py-2 flex flex-row cursor-pointer ${
                                      !isFirst
                                        ? "border-t border-slate-300 dark:border-slate-700"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      setSelectedInputAndVersion(
                                        `${promptVersion.major_version}.${promptVersion.minor_version}`
                                      )
                                    }
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <div className="flex items-center space-x-2 flex-row justify-between w-full">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium text-lg">
                                            V{promptVersion.major_version}.
                                            {promptVersion.minor_version}
                                          </span>
                                          <Badge
                                            variant={"default"}
                                            className="bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#475569] text-[#334155] dark:text-white text-sm font-medium rounded-lg px-4 hover:bg-[#F1F5F9] hover:text-black"
                                          >
                                            {promptVersion.model.length > 10
                                              ? promptVersion.model.substring(
                                                  0,
                                                  10
                                                ) + "..."
                                              : promptVersion.model}
                                          </Badge>
                                          <span>
                                            {isProduction && (
                                              <Badge
                                                variant={"default"}
                                                className="bg-[#BAE6FD] dark:bg-[#1E293B]  dark:border-[#475569] text-[#0369A1] dark:text-white text-sm font-medium rounded-lg px-4 hover:bg-[#F1F5F9] hover:text-black"
                                              >
                                                Prod
                                              </Badge>
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-base text-slate-500">
                                            {getTimeAgo(
                                              new Date(promptVersion.created_at)
                                            )}
                                          </span>
                                          <div className="flex items-center space-x-2">
                                            {prompt?.metadata?.createdFromUi ===
                                            true ? (
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                                                    <EllipsisHorizontalIcon className="h-6 w-6 text-slate-500" />
                                                  </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                  {!isProduction && (
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
                                                      startExperiment(
                                                        promptVersion.id,
                                                        promptVersion.helicone_template
                                                      )
                                                    }
                                                  >
                                                    <BeakerIcon className="h-4 w-4 mr-2" />
                                                    Experiment
                                                  </DropdownMenuItem>
                                                  {!isProduction && (
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
                                            ) : (
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                                                    <EllipsisHorizontalIcon className="h-6 w-6 text-slate-500" />
                                                  </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                  <DropdownMenuItem
                                                    onClick={() =>
                                                      startExperiment(
                                                        promptVersion.id,
                                                        promptVersion.helicone_template
                                                      )
                                                    }
                                                  >
                                                    <BeakerIcon className="h-4 w-4 mr-2" />
                                                    Experiment
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                    <div className="border-x border-b border-[#E8EAEC] dark:border-slate-700 bg-[#F9FAFB] dark:bg-black">
                      <div
                        className="flex flex-row items-center justify-between px-4 h-12 cursor-pointer"
                        onClick={() => setIsInputsExpanded(!isInputsExpanded)}
                      >
                        <h2 className="text-lg font-medium">Inputs</h2>
                        <div className="flex items-center space-x-2">
                          {isSearchVisible ? (
                            <div className="relative w-64">
                              <TextInput
                                placeholder="Search by request id..."
                                value={searchRequestId}
                                onValueChange={(value) =>
                                  setSearchRequestId(value)
                                }
                                className="pr-8"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsSearchVisible(false);
                                  setSearchRequestId("");
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                              >
                                <XMarkIcon className="h-4 w-4 text-slate-500" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsSearchVisible(true);
                              }}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                            >
                              <MagnifyingGlassIcon className="h-5 w-5 text-slate-500" />
                            </button>
                          )}
                          <ChevronDownIcon
                            className={`h-5 w-5 transition-transform ${
                              isInputsExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {isInputsExpanded && (
                        <ScrollArea className="h-[30vh] rounded-b-lg">
                          <ul className="flex flex-col">
                            {inputs
                              ?.filter((input) =>
                                input.source_request.includes(searchRequestId)
                              )
                              .map((input, index, filteredInputs) => {
                                const isFirst = index === 0;
                                const isLast =
                                  index === filteredInputs.length - 1;
                                const isSelected =
                                  selectedInput?.id === input.id;

                                return (
                                  <li
                                    key={input.id}
                                    className={`flex flex-row w-full ${
                                      isSelected
                                        ? "bg-sky-50 dark:bg-sky-900"
                                        : "bg-white dark:bg-gray-800"
                                    } ${
                                      isFirst
                                        ? "border-t border-slate-300 dark:border-slate-700"
                                        : ""
                                    } ${
                                      isLast
                                        ? "border-b border-slate-300 dark:border-slate-700"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      {isSelected && (
                                        <div className="bg-sky-500 h-full w-1" />
                                      )}
                                    </div>
                                    <div
                                      className={`flex-grow p-4 cursor-pointer ${
                                        !isFirst
                                          ? "border-t border-slate-300 dark:border-slate-700"
                                          : ""
                                      }`}
                                      onClick={() => handleInputSelect(input)}
                                    >
                                      {Object.entries(input.inputs).map(
                                        ([key, value], index) => (
                                          <div
                                            key={index}
                                            className="mb-2 last:mb-0"
                                          >
                                            <span className="text-blue-500 font-medium">
                                              {key}:{" "}
                                            </span>
                                            <span className="text-gray-700 dark:text-gray-300">
                                              {typeof value === "string"
                                                ? value.length > 100
                                                  ? value.substring(0, 100) +
                                                    "..."
                                                  : value
                                                : JSON.stringify(value)}
                                            </span>
                                          </div>
                                        )
                                      )}
                                      {input.auto_prompt_inputs &&
                                        input.auto_prompt_inputs.length > 0 && (
                                          <div className="mt-2">
                                            <span className="text-blue-500 font-medium">
                                              messages:{" "}
                                            </span>
                                            <span className="text-gray-500">
                                              {JSON.stringify(
                                                input.auto_prompt_inputs
                                              ).substring(0, 50)}
                                              ...
                                            </span>
                                          </div>
                                        )}
                                      {input.response_body && (
                                        <div className="mt-2">
                                          <span className="text-blue-500 font-medium">
                                            messages:{" "}
                                          </span>
                                          <span className="text-gray-700 dark:text-gray-300">
                                            {JSON.stringify(
                                              (input.response_body as any)
                                                ?.choices[0]?.message
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                          </ul>
                        </ScrollArea>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PromptIdPage;
