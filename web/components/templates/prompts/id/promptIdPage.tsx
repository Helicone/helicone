import { BookOpenIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import {
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
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";

import { BeakerIcon } from "@heroicons/react/24/solid";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import HcBadge from "../../../ui/hcBadge";
import HcButton from "../../../ui/hcButton";
import { useRouter } from "next/router";
import ThemedTimeFilter from "../../../shared/themed/themedTimeFilter";
import StyledAreaChart from "../../dashboard/styledAreaChart";
import { SimpleTable } from "../../../shared/table/simpleTable";
import TableFooter from "../../requestsV2/tableFooter";
import { PrettyInput } from "../../playground/chatRow";
import { useExperiments } from "../../../../services/hooks/prompts/experiments";
import ModelPill from "../../requestsV2/modelPill";
import StatusBadge from "../../requestsV2/statusBadge";
import { getUSDateFromString } from "../../../shared/utils/utils";
import { Chat } from "../../requests/chat";
import { useInputs } from "../../../../services/hooks/prompts/inputs";
import PromptPropertyCard from "./promptPropertyCard";

interface PromptIdPageProps {
  id: string;
  currentPage: number;
  pageSize: number;
}

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} days ago`;
  } else if (hours > 0) {
    return `${hours} hrs ago`;
  } else if (minutes > 0) {
    return `${minutes} min ago`;
  } else {
    return `${seconds} sec ago`;
  }
};

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

    console.log(inputText);
    console.log(selectedProperties);

    // Use the regular expression to find and replace all occurrences
    inputText.replace(regex, (match: any, keyName: string, offset: number) => {
      // Push preceding text if any
      if (offset > lastIndex) {
        parts.push(inputText.substring(lastIndex, offset));
      }

      // Push the PrettyInput component for the current match
      parts.push(
        <PrettyInput
          keyName={keyName}
          key={offset}
          selectedProperties={selectedProperties}
        />
      );

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

const PromptIdPage = (props: PromptIdPageProps) => {
  const { id, currentPage, pageSize } = props;
  const { prompt, isLoading } = usePrompt(id);
  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [inputView, setInputView] = useState<"list" | "grid">("list");
  const [selectedInput, setSelectedInput] = useState<{
    id: string;
    inputs: {
      [key: string]: string;
    };
    source_request: string;
    prompt_version: string;
    created_at: string;
  }>();
  const [searchRequestId, setSearchRequestId] = useState<string>("");

  const router = useRouter();

  const { experiments, isLoading: experimentsLoading } = useExperiments({
    page,
    pageSize: currentPageSize,
  });

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
          </TabList>
          <TabPanels>
            <TabPanel>
              <div className="flex flex-col space-y-8 py-4">
                <div className="w-full h-full flex flex-col space-y-4">
                  <div className="flex items-center justify-between w-full">
                    <ThemedTimeFilter
                      timeFilterOptions={[
                        {
                          key: "24H",
                          value: "24H",
                        },
                        {
                          key: "7D",
                          value: "7D",
                        },
                        {
                          key: "1M",
                          value: "1M",
                        },
                        {
                          key: "3M",
                          value: "3M",
                        },
                        {
                          key: "all",
                          value: "all",
                        },
                      ]}
                      custom={true}
                      onSelect={function (key: string, value: string): void {
                        throw new Error("Function not implemented.");
                      }}
                      isFetching={false}
                      defaultValue={"24H"}
                      currentTimeFilter={{
                        start: new Date(),
                        end: new Date(),
                      }}
                    />
                  </div>

                  <div>
                    <StyledAreaChart
                      title={"Total Requests"}
                      value={"coming soon..."}
                      isDataOverTimeLoading={false}
                    >
                      <div className="h-[12rem] w-full bg-white dark:bg-black flex flex-col items-center justify-center">
                        <ChartBarIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        <p className="text-lg font-semibold">
                          Requests over time coming soon...
                        </p>
                      </div>
                      {/* <AreaChartUsageExample /> */}
                    </StyledAreaChart>
                  </div>
                </div>
                <div className="flex flex-col space-y-4 h-full w-full">
                  <h2 className="text-2xl font-semibold">Experiment Logs</h2>
                  {/* <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <MultiSelect placeholder="Version(s)">
              <MultiSelectItem value="1">Version 1</MultiSelectItem>
              <MultiSelectItem value="2">Version 2</MultiSelectItem>
              <MultiSelectItem value="3">Version 3</MultiSelectItem>
            </MultiSelect>{" "}
            <MultiSelect placeholder="Dataset">
              <MultiSelectItem value="1">Version 1</MultiSelectItem>
              <MultiSelectItem value="2">Version 2</MultiSelectItem>
              <MultiSelectItem value="3">Version 3</MultiSelectItem>
            </MultiSelect>{" "}
            <MultiSelect placeholder="Model">
              <MultiSelectItem value="1">Version 1</MultiSelectItem>
              <MultiSelectItem value="2">Version 2</MultiSelectItem>
              <MultiSelectItem value="3">Version 3</MultiSelectItem>
            </MultiSelect>
            <div className="pl-2">
              <HcButton variant={"light"} size={"sm"} title={"Clear All"} />
            </div>
          </div>
          <HcButton
            variant={"secondary"}
            size={"sm"}
            title={"Add Metrics"}
            icon={PresentationChartLineIcon}
          />
        </div> */}

                  <SimpleTable
                    data={experiments}
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
                  <TableFooter
                    currentPage={currentPage}
                    pageSize={pageSize}
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
              <div className="flex items-start relative">
                <div className="min-w-[25rem] w-1/3 p-4 flex flex-col space-y-4">
                  <div className="flex flex-col w-full space-y-2">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-lg">Inputs</p>
                    </div>
                    <TextInput
                      placeholder="Search by request id..."
                      value={searchRequestId}
                      onValueChange={(value) => setSearchRequestId(value)}
                    />
                  </div>
                  <ul className="flex flex-col space-y-4">
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
                            view={inputView}
                          />
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="p-4 flex flex-col space-y-4 w-full sticky top-4">
                  <div className="w-full flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-lg">Prompt</p>
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
                            >
                              {prompt.major_version}.{prompt.minor_version}
                            </SelectItem>
                          ))}
                      </Select>
                    </div>
                  </div>
                  <Chat
                    requestBody={selectedPrompt?.helicone_template}
                    responseBody={{}}
                    status={200}
                    requestId={""}
                    model={prompts?.at(0)?.model || "unknown"}
                    selectedProperties={selectedInput?.inputs}
                  />
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </>
  );
};

export default PromptIdPage;
