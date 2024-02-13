import {
  BookOpenIcon,
  ChevronLeftIcon,
  CircleStackIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrompts } from "../../../../services/hooks/prompts/prompts";
import { usePrompt } from "../../../../services/hooks/prompts/singlePrompt";
import ThemedDrawer from "../../../shared/themed/themedDrawer";
import { getUSDateFromString } from "../../../shared/utils/utils";
import ThemedModal from "../../../shared/themed/themedModal";

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
  const renderText = selectedProperties?.[keyName] || keyName;
  const [open, setOpen] = useState(false);
  const TEXT_LIMIT = 120;
  return (
    <>
      {renderText.length > TEXT_LIMIT ? (
        <button
          onClick={() => setOpen(!open)}
          className="text-sm text-gray-900 bg-yellow-100 border border-yellow-300 rounded-lg py-1 px-3"
          title={renderText}
        >
          {renderText.slice(0, TEXT_LIMIT)}...
        </button>
      ) : (
        <span className="inline-block border border-yellow-300 rounded-lg py-1 px-3 text-sm text-gray-900 bg-yellow-100">
          {renderText}
        </span>
      )}
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[66vw] h-full flex flex-col space-y-4">
          <div className="flex items-center w-full justify-center">
            <h3 className="text-2xl font-semibold">{keyName}</h3>
            <button onClick={() => setOpen(false)} className="ml-auto">
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          <div className="bg-white border-gray-300 p-4 border rounded-lg flex flex-col space-y-4">
            {selectedProperties?.[keyName]}
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

const RenderWithPrettyInputKeys = (props: {
  text: string;
  selectedProperties: Record<string, string> | undefined;
}) => {
  const { text, selectedProperties } = props;

  // Function to replace matched patterns with JSX components
  const replaceInputKeysWithComponents = (inputText: string) => {
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
    <div className="text-sm leading-8">
      {replaceInputKeysWithComponents(text)}
    </div>
  );
};

const PromptIdPage = (props: PromptIdPageProps) => {
  const { id } = props;
  const { prompts, isLoading } = usePrompts();

  const currentPrompt = prompts?.data?.prompts.find((p) => p.id === id);
  const [selectedVersion, setSelectedVersion] = useState<string>();

  const selectedPrompt = usePrompt({
    version: selectedVersion || "0",
    promptId: id,
  });

  const [inputOpen, setInputOpen] = useState(false);

  // the selected request to view in the tempalte
  const [selectedInput, setSelectedInput] = useState<{
    id: string;
    createdAt: string;
    properties: Record<string, string>;
  }>();

  // set the selected version to the latest version on initial load
  useEffect(() => {
    if (currentPrompt) {
      setSelectedVersion(currentPrompt.latest_version.toString());
    }
  }, [currentPrompt]);

  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col items-start space-y-2">
          <Link
            className="flex w-fit items-center text-gray-500 space-x-2 hover:text-gray-700"
            href={"/prompts"}
          >
            <ChevronLeftIcon className="h-4 w-4 inline" />
            <span className="text-sm font-semibold">Prompts</span>
          </Link>
          <h1 className="font-semibold text-3xl text-black dark:text-white">
            {id}
          </h1>
        </div>
      </div>
      {isLoading ? (
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
                    <button className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2">
                      <CircleStackIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
                        Run on Dataset
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
                      className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center"
                    >
                      <SparklesIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block pl-2 pr-1">
                        Random Input
                      </p>
                      {selectedInput && (
                        <div className="flex items-center">
                          <span className="text-sm font-medium border-l border-gray-300 pl-1 text-sky-500">
                            {selectedInput.id}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInput(undefined);
                            }}
                            className="flex items-center hover:cursor-pointer text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            <XMarkIcon className="h-4 w-4 inline" />
                          </button>
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    <label>Version:</label>
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
                {!selectedVersion ? (
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
                  <div className="flex flex-col gap-2">
                    {selectedPrompt.isLoading ? (
                      <h1>Loading...</h1>
                    ) : (
                      <div className="bg-white border-gray-300 p-4 border rounded-lg flex flex-col space-y-4">
                        <i className="text-gray-500">input</i>
                        {selectedPrompt.heliconeTemplate?.messages.map(
                          (m: any, i: number) => (
                            <div key={i}>
                              <RenderWithPrettyInputKeys
                                text={m.content}
                                selectedProperties={selectedInput?.properties}
                              />
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className="bg-white border-gray-300 p-4 border rounded-lg flex flex-col space-y-4">
                      <i className="text-gray-500">output</i>
                      <div>
                        <PrettyInput
                          keyName="output"
                          selectedProperties={selectedInput?.properties}
                        />
                      </div>
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
      )}
      <ThemedDrawer open={inputOpen} setOpen={setInputOpen}>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <PaintBrushIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
            <h2 className="text-2xl font-semibold">Inputs</h2>
          </div>
        </div>
        <Table className="">
          <TableHead className="border-b border-gray-300 dark:border-gray-700">
            <TableRow>
              <TableHeaderCell className="text-black dark:text-white w-[10px]">
                Request Id
              </TableHeaderCell>
              <TableHeaderCell className="text-black dark:text-white">
                Created At
              </TableHeaderCell>
              {selectedPrompt?.columnNames?.map((p, i) => (
                <TableHeaderCell key={i} className="text-black dark:text-white">
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </TableHeaderCell>
              ))}
              <TableHeaderCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedPrompt?.properties?.map((row, i) => (
              <TableRow key={i}>
                <TableCell>
                  <p className="w-[80px] truncate"> {row.id}</p>
                </TableCell>
                <TableCell>{getUSDateFromString(row.createdAt)}</TableCell>
                {selectedPrompt?.columnNames?.map((col, i) => (
                  <TableCell key={i}>{row.properties[col]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ThemedDrawer>
    </>
  );
};

export default PromptIdPage;
