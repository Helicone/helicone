import { useEffect, useState, useMemo, useRef } from "react";
import {
  usePrompt,
  usePromptRequestsOverTime,
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";

import {
  BeakerIcon,
  ArrowTrendingUpIcon,
  TrashIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useExperiments } from "../../../../services/hooks/prompts/experiments";
import { useInputs } from "../../../../services/hooks/prompts/inputs";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import { useGetDataSets } from "../../../../services/hooks/prompts/datasets";
import { MODEL_LIST } from "../../playground/new/modelList";
import { BackendMetricsCall } from "../../../../services/hooks/useBackendFunction";
import {
  TimeInterval,
  getTimeInterval,
  getTimeIntervalAgo,
} from "../../../../lib/timeCalculations/time";
import { useSearchParams } from "next/navigation";
import { TimeFilter } from "@/types/timeFilter";
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
import { MultiSelect, MultiSelectItem, AreaChart } from "@tremor/react";
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
import { useFeatureFlags } from "@/services/hooks/featureFlags";
import { useOrg } from "@/components/layout/org/organizationContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hoverCard";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { clsx } from "clsx";
import PromptInputItem from "./promptInputItem";
import { IslandContainer } from "@/components/ui/islandContainer";
import { cn } from "@/lib/utils";
import useOnboardingContext, {
  ONBOARDING_STEPS,
} from "@/components/layout/onboardingContext";
import { OnboardingPopover } from "../../onboarding/OnboardingPopover";

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
    const promptVersion = prompts?.find((p) => p.id === promptVersionId);

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

  // Add this new function to handle the button click
  const handleSearchButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // This stops the event from propagating to the parent div
    setIsSearchVisible(!isSearchVisible);
  };

  const { isOnboardingVisible, currentStep } = useOnboardingContext();

  return (
    <IslandContainer className="mx-0">
      <div className="w-full h-full flex flex-col space-y-4 pt-4">
        <Tabs defaultValue="prompt">
          <div
            className={cn(
              "flex flex-row items-center justify-between ml-8",
              isOverMaxWidth ? "" : "mr-8"
            )}
          >
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

              <HoverCard>
                <HoverCardTrigger>
                  <InfoIcon
                    width={16}
                    height={16}
                    className="text-slate-500 cursor-pointer"
                  />
                </HoverCardTrigger>
                <HoverCardContent
                  className="w-[220px] p-0 z-[1000] bg-white"
                  align="start"
                >
                  <div className="p-3 gap-3 flex flex-col border-b border-slate-200">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold text-slate-700">
                        Prompt Name
                      </h3>
                      <div className="flex flex-row items-center gap-2">
                        <p className="text-sm text-slate-500 truncate">
                          {prompt?.user_defined_id}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 gap-3 flex flex-col border-b border-slate-200">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold text-slate-700">
                        Versions
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {sortedPrompts?.length}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 gap-3 flex flex-col border-b border-slate-200">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold text-slate-700">
                        Last used
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {prompt?.last_used
                          ? getTimeAgo(new Date(prompt?.last_used))
                          : "Never"}{" "}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold text-slate-700">
                        Created on
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {prompt?.created_at &&
                          new Date(prompt?.created_at).toDateString()}{" "}
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <HoverCard>
                {prompt?.metadata?.createdFromUi === true ? (
                  <>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="outline"
                        size={"sm"}
                        className="h-6 bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-normal"
                      >
                        {/* <PencilIcon className="h-4 w-4 mr-2" /> */}
                        Editable
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent
                      className="max-w-[15rem] bg-white "
                      align="center"
                    >
                      <p className="text-sm">
                        This prompt was created{" "}
                        <span className="font-semibold">in the UI</span>. You
                        can edit / delete them, or promote to prod.
                      </p>
                    </HoverCardContent>
                  </>
                ) : (
                  <>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="outline"
                        size={"sm"}
                        className="h-6 bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-normal"
                      >
                        {/* <EyeIcon className="h-4 w-4 mr-2" /> */}
                        View only
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="max-w-[15rem]" align="center">
                      <p className="text-sm">
                        This prompt was created{" "}
                        <span className="font-semibold">in code</span>. You
                        won&apos;t be able to edit this from the UI.
                      </p>
                    </HoverCardContent>
                  </>
                )}
              </HoverCard>
            </div>
            <div className="flex items-center space-x-4">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="prompt">Prompt & Inputs</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="prompt">
            <div className="flex items-start relative">
              <div className="py-4 flex flex-col space-y-4 w-full h-[calc(100vh-76px)]">
                <div className="flex h-full">
                  <OnboardingPopover
                    open={typeof prompt?.user_defined_id === "string"}
                    popoverContentProps={{
                      onboardingStep: "PROMPTS_PAGE",
                      align: "start",
                      side: "right",
                    }}
                  >
                    <div className="w-2/3 overflow-y-auto">
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
                        className="border-y border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </OnboardingPopover>
                  <div className="w-1/3 flex flex-col h-full">
                    <div className="border-y border-x border-slate-200 dark:border-slate-700 bg-[#F9FAFB] dark:bg-black flex flex-col h-full">
                      <div
                        className="flex flex-row items-center justify-between px-4 py-3.5 cursor-pointer"
                        onClick={() =>
                          setIsVersionsExpanded(!isVersionsExpanded)
                        }
                      >
                        <h2 className="font-medium text-sm">Versions</h2>
                        <ChevronDownIcon
                          className={`h-5 w-5 transition-transform ${
                            isVersionsExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>

                      {isVersionsExpanded && (
                        <ScrollArea className="h-[25vh] flex-shrink-0">
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
                                  className={`flex flex-row w-full h-12 relative ${
                                    isSelected
                                      ? "bg-sky-100 dark:bg-sky-950"
                                      : "bg-white dark:bg-slate-950"
                                  } ${
                                    isFirst
                                      ? "border-t border-slate-200 dark:border-slate-700"
                                      : ""
                                  } ${
                                    isLast
                                      ? "border-b border-slate-200 dark:border-slate-700"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center absolute left-0 h-full">
                                    {isSelected && (
                                      <div className="bg-sky-500 h-full w-1" />
                                    )}
                                  </div>
                                  <div
                                    className={`flex-grow px-4 py-2 flex flex-row cursor-pointer ${
                                      !isFirst
                                        ? "border-t border-slate-200 dark:border-slate-700"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      setSelectedInputAndVersion(
                                        `${promptVersion.major_version}.${promptVersion.minor_version}`
                                      )
                                    }
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center space-x-2 min-w-0 flex-grow overflow-hidden">
                                        <span className="font-medium text-sm whitespace-nowrap flex-shrink-0">
                                          V{promptVersion.major_version}.
                                          {promptVersion.minor_version}
                                        </span>
                                        {promptVersion.model &&
                                          promptVersion.model.length > 0 && (
                                            <Tooltip>
                                              <TooltipTrigger className="max-w-[calc(100%-6rem)] flex-shrink">
                                                <Badge
                                                  variant={"default"}
                                                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium rounded-lg px-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white w-full"
                                                >
                                                  <span className="block truncate">
                                                    {promptVersion.model}
                                                  </span>
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                {promptVersion.model}
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                        <span className="flex-shrink-0 ml-auto">
                                          {isProduction && (
                                            <Badge
                                              variant={"default"}
                                              className="bg-sky-200 dark:bg-slate-800 text-sky-700 dark:text-white text-sm font-medium rounded-lg px-4 hover:bg-sky-200 dark:hover:bg-slate-800 hover:text-sky-700 dark:hover:text-white"
                                            >
                                              Prod
                                            </Badge>
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                        <span className="text-sm text-slate-500">
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
                                          ) : promptVersion.minor_version ===
                                            0 ? (
                                            <DropdownMenu
                                              open={
                                                isOnboardingVisible &&
                                                currentStep ===
                                                  ONBOARDING_STEPS
                                                    .PROMPTS_EXPERIMENT
                                                    .stepNumber
                                              }
                                            >
                                              <DropdownMenuTrigger asChild>
                                                <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                                                  <EllipsisHorizontalIcon className="h-6 w-6 text-slate-500" />
                                                </button>
                                              </DropdownMenuTrigger>
                                              <OnboardingPopover
                                                popoverContentProps={{
                                                  onboardingStep:
                                                    "PROMPTS_EXPERIMENT",
                                                  next: () => {
                                                    startExperiment(
                                                      promptVersion.id,
                                                      promptVersion.helicone_template
                                                    );
                                                  },
                                                  align: "end",
                                                  side: "bottom",
                                                  sideOffset: 80,
                                                  alignOffset: -10,
                                                }}
                                                triggerAsChild={false}
                                              >
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
                                              </OnboardingPopover>
                                            </DropdownMenu>
                                          ) : (
                                            <></>
                                          )}
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
                      <div
                        className="flex flex-row items-center justify-between px-4 h-12 flex-shrink-0 overflow-hidden cursor-pointer border-y border-slate-200 dark:border-slate-700"
                        onClick={() => setIsInputsExpanded(!isInputsExpanded)}
                      >
                        <h2 className="font-medium text-sm">Inputs</h2>
                        <div className="flex items-center space-x-2">
                          {isInputsExpanded && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="relative flex items-center">
                                  <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                      isSearchVisible ? "w-40 sm:w-64" : "w-0"
                                    }`}
                                  >
                                    <Input
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                      ref={searchInputRef}
                                      type="text"
                                      value={searchRequestId}
                                      onChange={(e) =>
                                        setSearchRequestId(e.target.value)
                                      }
                                      placeholder="Search by request id..."
                                      className={clsx(
                                        "w-40 sm:w-64 text-sm pr-8 transition-transform duration-300 ease-in-out outline-none border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                                        isSearchVisible
                                          ? "translate-x-0"
                                          : "translate-x-full"
                                      )}
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={
                                      isSearchVisible
                                        ? "absolute right-0 hover:bg-transparent"
                                        : ""
                                    }
                                    onClick={handleSearchButtonClick} // Use the new handler here
                                  >
                                    {isSearchVisible ? (
                                      <XMarkIcon className="h-4 w-4" />
                                    ) : (
                                      <MagnifyingGlassIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isSearchVisible
                                  ? "Close search"
                                  : "Open search"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <ChevronDownIcon
                            className={`h-5 w-5 transition-transform ${
                              isInputsExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {isInputsExpanded && (
                        <div className="flex-grow overflow-hidden">
                          <ScrollArea className="h-full">
                            <ul className="flex flex-col">
                              {inputs
                                ?.filter((input) =>
                                  input.source_request.includes(searchRequestId)
                                )
                                .map((input, index, filteredInputs) => (
                                  <PromptInputItem
                                    key={input.id}
                                    input={input}
                                    isSelected={selectedInput?.id === input.id}
                                    isFirst={index === 0}
                                    isLast={index === filteredInputs.length - 1}
                                    onSelect={handleInputSelect}
                                  />
                                ))}
                            </ul>
                          </ScrollArea>
                        </div>
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
    </IslandContainer>
  );
};

export default PromptIdPage;
