import {
  ArrowsPointingOutIcon,
  BookOpenIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  PresentationChartLineIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  MultiSelect,
  MultiSelectItem,
  Select,
  SelectItem,
} from "@tremor/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  usePrompts,
  usePrompt,
} from "../../../../services/hooks/prompts/prompts";

import ThemedDrawer from "../../../shared/themed/themedDrawer";
import ThemedModal from "../../../shared/themed/themedModal";
import { Chat } from "../../requests/chat";
import { clsx } from "../../../shared/clsx";
import { Tooltip } from "@mui/material";
import { BeakerIcon } from "@heroicons/react/24/solid";
import { ThemedPill } from "../../../shared/themed/themedPill";
import ExperimentForm from "./experimentForm";
import PromptPropertyCard from "./promptPropertyCard";
import { useOrg } from "../../../layout/organizationContext";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import HcBadge from "../../../ui/hcBadge";
import HcButton from "../../../ui/hcButton";
import { useRouter } from "next/router";
import ModelPill from "../../requestsV2/modelPill";
import ThemedTimeFilter from "../../../shared/themed/themedTimeFilter";
import { AreaChartUsageExample, DUMMY_DATA } from "./dummyChart";
import StyledAreaChart from "../../dashboard/styledAreaChart";
import { SimpleTable } from "../../../shared/table/simpleTable";
import TableFooter from "../../requestsV2/tableFooter";

interface PromptIdPageProps {
  id: string;
}

const PrettyInput = ({
  keyName,
  selectedProperties,
}: {
  keyName: string;
  selectedProperties: Record<string, string> | undefined;
}) => {
  const getRenderText = () => {
    if (selectedProperties) {
      return selectedProperties[keyName] || "{{undefined}}";
    } else {
      return keyName;
    }
  };
  const renderText = getRenderText();
  const [open, setOpen] = useState(false);
  const TEXT_LIMIT = 120;

  return (
    <>
      <Tooltip title={keyName} placement="top">
        {renderText.length > TEXT_LIMIT ? (
          <button
            onClick={() => setOpen(!open)}
            className={clsx(
              selectedProperties
                ? "bg-sky-100 border-sky-300 dark:bg-sky-950 dark:border-sky-700"
                : "bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700",
              "relative text-sm text-gray-900 dark:text-gray-100 border rounded-lg py-1 px-3 text-left"
            )}
            title={renderText}
          >
            <ArrowsPointingOutIcon className="h-4 w-4 text-sky-500 absolute right-2 top-1.5 transform" />
            <p className="pr-8">{renderText.slice(0, TEXT_LIMIT)}...</p>
          </button>
        ) : (
          <span
            className={clsx(
              selectedProperties
                ? "bg-sky-100 border-sky-300 dark:bg-sky-950 dark:border-sky-700"
                : "bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700",
              "inline-block border text-gray-900 dark:text-gray-100 rounded-lg py-1 px-3 text-sm"
            )}
          >
            {renderText}
          </span>
        )}
      </Tooltip>

      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[66vw] h-full flex flex-col space-y-4">
          <div className="flex items-center w-full justify-center">
            <h3 className="text-2xl font-semibold">{keyName}</h3>
            <button onClick={() => setOpen(false)} className="ml-auto">
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          <div className="bg-white border-gray-300 dark:bg-black dark:border-gray-700 p-4 border rounded-lg flex flex-col space-y-4">
            {selectedProperties?.[keyName]}
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

const AutoResizingTextarea = ({
  text,
  setText,
}: {
  text: string;
  setText: (text: string) => void;
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const adjustHeight = () => {
      if (textareaRef && textareaRef.current) {
        const textarea = textareaRef.current as HTMLTextAreaElement;
        textarea.style.height = "inherit"; // Reset height to recalculate
        const computed = window.getComputedStyle(textareaRef.current);
        // Calculate the height
        const height =
          textarea.scrollHeight +
          parseInt(computed.borderTopWidth, 10) +
          parseInt(computed.borderBottomWidth, 10);
        textarea.style.height = `${height}px`;
      }
    };
    adjustHeight();
  }, [text]); // This effect runs when 'text' changes

  return (
    <textarea
      ref={textareaRef}
      className="text-sm leading-8 resize-none w-full border rounded-lg p-4"
      value={text}
      onChange={(e) => setText(e.target.value)}
      style={{ overflow: "hidden" }}
    />
  );
};

export const RenderWithPrettyInputKeys = (props: {
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

const PromptIdPage = (props: PromptIdPageProps) => {
  const { id } = props;
  const { prompt, isLoading } = usePrompt(id);

  const org = useOrg();

  const [selectedVersion, setSelectedVersion] = useState<string>();

  const [inputOpen, setInputOpen] = useState(false);
  const [experimentOpen, setExperimentOpen] = useState(false);

  // the selected request to view in the tempalte
  const [selectedInput, setSelectedInput] = useState<{
    id: string;
    createdAt: string;
    properties: Record<string, string>;
    response: string;
  }>();

  const router = useRouter();

  // set the selected version to the latest version on initial load

  return (
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
                onClick={() => setExperimentOpen(!experimentOpen)}
                variant={"secondary"}
                size={"sm"}
                title="View Prompt"
                icon={BookOpenIcon}
              />
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
            {/* <div className="rounded-full h-1 w-1 bg-slate-400" />
            <ModelPill model={prompt?.latest_model_used || "unknown"} /> */}
            <div className="rounded-full h-1 w-1 bg-slate-400" />
            <p className="">
              created on{" "}
              {prompt?.created_at &&
                new Date(prompt?.created_at).toDateString()}
            </p>
          </div>
        </div>
      </div>
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
            value={"1063"}
            isDataOverTimeLoading={false}
          >
            <AreaChartUsageExample />
          </StyledAreaChart>
        </div>
      </div>
      <div className="flex flex-col space-y-4 h-full w-full">
        <h2 className="text-2xl font-semibold">Experiment Logs</h2>
        <div className="flex items-center justify-between w-full">
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
        </div>
        <SimpleTable
          data={DUMMY_DATA}
          columns={[
            {
              key: "name",
              header: "Name",
              render: (item) => item.name,
            },
            {
              key: "departement",
              header: "Departement",
              render: (item) => item.departement,
            },
            {
              key: "Role",
              header: "Role",
              render: (item) => item.Role,
            },
            {
              key: "status",
              header: "Status",
              render: (item) => item.status,
            },
          ]}
        />
        <TableFooter
          currentPage={0}
          pageSize={0}
          count={0}
          isCountLoading={false}
          onPageChange={function (newPageNumber: number): void {
            // throw new Error("Function not implemented.");
          }}
          onPageSizeChange={function (newPageSize: number): void {
            // throw new Error("Function not implemented.");
          }}
          pageSizeOptions={[]}
        />
      </div>
      {/* {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex flex-col min-h-[80vh] h-full">
          <div className="w-full flex flex-col space-y-4 py-4">
            {currentPrompt ? (
              <>
                <div
                  id="toolbar"
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center space-x-1">
                    <button
                      className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
                      onClick={() => setExperimentOpen(!experimentOpen)}
                    >
                      <BeakerIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
                        Run Experiment
                      </p>
                    </button>

                    <button
                      onClick={() => setInputOpen(!inputOpen)}
                      className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
                    >
                      <PaintBrushIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
                        View Inputs
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        const randomInput = Math.floor(
                          Math.random() *
                            (selectedPrompt.properties?.length || 0)
                        );

                        const randomProperty =
                          selectedPrompt.properties?.[randomInput];

                        setSelectedInput(randomProperty);
                      }}
                      className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
                    >
                      <SparklesIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block pr-1">
                        Random Input
                      </p>
                    </button>
                    {selectedInput && (
                      <ThemedPill
                        label={selectedInput.id}
                        onDelete={() => setSelectedInput(undefined)}
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <label className="text-black dark:text-white">
                      Version:
                    </label>
                    <Select
                      value={selectedVersion}
                      placeholder={selectedVersion}
                      onValueChange={(e) => {
                        setSelectedVersion(e);
                      }}
                      enableClear={false}
                      style={{ width: "2rem" }}
                    >
                      {Array.from(
                        { length: currentPrompt.latest_version + 1 },
                        (_, i) => i
                      )
                        .reverse()
                        .map((version: any, i: number) => (
                          <SelectItem value={version} key={i}>
                            {version}
                          </SelectItem>
                        ))}
                    </Select>
                  </div>
                </div>
                {selectedVersion === undefined ? (
                  <div className="flex flex-col w-full h-96 justify-center items-center">
                    <div className="flex flex-col w-2/5">
                      <DocumentTextIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                      <p className="text-xl text-black dark:text-white font-semibold mt-8">
                        Select a version
                      </p>
                      <p className="text-sm text-gray-500 max-w-sm mt-2">
                        Select a version to view the prompt and its output.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-4 w-full">
                    <div className="flex flex-col space-y-8 w-full">
                      {selectedPrompt.isLoading ? (
                        <h1>Loading...</h1>
                      ) : (
                        <div className="w-full">
                          <Chat
                            requestBody={selectedPrompt.heliconeTemplate}
                            responseBody={{
                              role: "assistant",
                              choices: [
                                {
                                  message: {
                                    content:
                                      selectedInput?.response ||
                                      `<helicone-prompt-input key="output" />`,
                                    role: "assistant",
                                  },
                                },
                              ],
                            }}
                            status={200}
                            requestId={""}
                            model={selectedPrompt.heliconeTemplate.model}
                            selectedProperties={selectedInput?.properties}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col w-full h-96 justify-center items-center">
                <div className="flex flex-col w-2/5">
                  <DocumentTextIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                  <p className="text-xl text-black dark:text-white font-semibold mt-8">
                    Select a prompt to get started.
                  </p>
                  <p className="text-sm text-gray-500 max-w-sm mt-2">
                    If you do not have any prompts, please view our
                    documentation to get started.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="#"
                      className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <BookOpenIcon className="h-4 w-4" />
                      View Docs
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )} */}
      {/* <ThemedDrawer
        open={experimentOpen}
        setOpen={setExperimentOpen}
        defaultExpanded={true}
      >
        <ExperimentForm
          heliconeTemplate={selectedPrompt.heliconeTemplate}
          currentPrompt={currentPrompt!}
          promptProperties={selectedPrompt.properties || []}
          close={() => setExperimentOpen(false)}
        />
      </ThemedDrawer>
      <ThemedDrawer open={inputOpen} setOpen={setInputOpen}>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <PaintBrushIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Inputs
            </h2>
          </div>
        </div>
        <ul className="flex flex-col space-y-4 mt-8 w-full">
          {selectedPrompt?.properties?.map((row, i) => (
            <PromptPropertyCard
              key={`selectedPrompt-${i}`}
              isSelected={selectedInput?.id === row.id}
              onSelect={() => {
                if (selectedInput?.id === row.id) {
                  setSelectedInput(undefined);
                  return;
                }
                setSelectedInput(row);
              }}
              requestId={row.id}
              createdAt={row.createdAt}
              properties={row.properties}
            />
          ))}
        </ul>
      </ThemedDrawer> */}
    </div>
  );
};

export default PromptIdPage;
