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
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import useNotification from "../../../shared/notification/useNotification";
import { Message } from "../../requests/chatComponent/types";

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
        },
      }
    );

    if (result.error || !result.data.data) {
      notification.setNotification("Failed to create subversion", "error");
      return;
    }
    notification.setNotification("Subversion created successfully", "success");
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
          <h1 className="font-semibold text-2xl text-black dark:text-white">
            {prompt?.user_defined_id}
          </h1>
          <HcBadge title={`${prompt?.versions.length} versions`} size={"sm"} />
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
        <p>
          last used{" "}
          {prompt?.last_used && getTimeAgo(new Date(prompt?.last_used))}
        </p>
        <div className="rounded-full h-1 w-1 bg-slate-400" />
        <p>
          created on{" "}
          {prompt?.created_at && new Date(prompt?.created_at).toDateString()}
        </p>
      </div>

      <div className="flex space-x-4">
        <div className="w-2/3">
          <PromptPlayground
            prompt={selectedPrompt?.helicone_template || ""}
            selectedInput={selectedInput}
            onSubmit={async (history, model) => {
              console.log("Submitted history:", history);
              console.log("Selected model:", model);
              await createSubversion(history, model);
            }}
            submitText="Submit"
            initialModel={selectedPrompt?.model || MODEL_LIST[0].value}
          />
        </div>
        <div className="w-1/3">
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Versions</h2>
            <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {sortedPrompts?.map((prompt) => (
                <div
                  key={prompt.id}
                  className={`p-4 rounded-lg cursor-pointer ${
                    selectedVersion ===
                    `${prompt.major_version}.${prompt.minor_version}`
                      ? "bg-blue-100 dark:bg-blue-900"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                  onClick={() =>
                    setSelectedVersion(
                      `${prompt.major_version}.${prompt.minor_version}`
                    )
                  }
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      V{prompt.major_version}.{prompt.minor_version}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(prompt.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm">{prompt.model}</div>
                  {prompt.is_production && (
                    <HcBadge title="Prod" size="sm" className="mt-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptIdPage;
