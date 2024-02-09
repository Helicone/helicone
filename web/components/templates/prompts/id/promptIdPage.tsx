import { useState } from "react";
import { usePlaygroundPage } from "../../../../services/hooks/playground";
import { clsx } from "../../../shared/clsx";
import { useDebounce } from "../../../../services/hooks/debounce";
import AuthHeader from "../../../shared/authHeader";
import RequestDrawerV2 from "../../requestsV2/requestDrawerV2";
import useNotification from "../../../shared/notification/useNotification";
import {
  BookOpenIcon,
  CircleStackIcon,
  CodeBracketSquareIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PaintBrushIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import {
  MultiSelect,
  MultiSelectItem,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TextInput,
} from "@tremor/react";
import ThemedModal from "../../../shared/themed/themedModal";
import Image from "next/image";
import { usePrompts } from "../../../../services/hooks/prompts/prompts";
import { usePrompt } from "../../../../services/hooks/prompts/singlePrompt";
import Link from "next/link";
import { Database } from "../../../../supabase/database.types";
import ThemedDrawer from "../../../shared/themed/themedDrawer";
import { getUSDateFromString } from "../../../shared/utils/utils";

interface PromptIdPageProps {
  id: string;
}

const PrettyInput = ({ keyName }: { keyName: string }) => {
  return (
    <span className="inline-block border border-orange-200 rounded py-1 px-3 text-sm text-gray-700 bg-cyan-200">
      {keyName}
    </span>
  );
};

const RenderWithPrettyInputKeys = (props: { text: string }) => {
  const { text } = props;

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
      parts.push(<PrettyInput keyName={keyName} key={offset} />);

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

  return <div>{replaceInputKeysWithComponents(text)}</div>;
};

const PromptIdPage = (props: PromptIdPageProps) => {
  const { id } = props;
  const { prompts, isLoading } = usePrompts();

  const currentPrompt = prompts?.data?.find((p) => p.id === id);

  const [selectedVersion, setSelectedVersion] = useState<string>(
    currentPrompt?.latest_version.toString() ?? "0"
  );

  console.log("latest", currentPrompt?.latest_version);

  const selectedPrompt = usePrompt({
    version: `${selectedVersion}`,
    promptId: id,
  });

  const [inputOpen, setInputOpen] = useState(false);

  return (
    <>
      <AuthHeader title={"Prompts"} />
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex flex-col xl:flex-row xl:divide-x xl:divide-gray-200 dark:xl:divide-gray-800 gap-8 xl:gap-4 min-h-[80vh] h-full">
          <div className="w-full xl:pl-4 flex flex-col space-y-4">
            {currentPrompt?.latest_version}
            ------
            {selectedVersion}
            {currentPrompt ? (
              <>
                <div
                  id="toolbar"
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center space-x-1">
                    <button
                      // onClick={() => setOpen(true)}
                      className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
                    >
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
                      // onClick={() => setOpen(true)}
                      className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
                    >
                      <StarIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
                        Random Input
                      </p>
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
                <div className="flex flex-col gap-2">
                  {selectedPrompt.isLoading ? (
                    <h1>Loading...</h1>
                  ) : (
                    <div className="bg-white border-gray-300 p-4 border rounded-lg flex flex-col space-y-4">
                      <i className="text-gray-500">input</i>
                      {selectedPrompt.heliconeTemplate?.messages.map(
                        (m: any, i: number) => (
                          <div key={i}>
                            <RenderWithPrettyInputKeys text={m.content} />
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className="bg-white border-gray-300 p-4 border rounded-lg flex flex-col space-y-4">
                    <i className="text-gray-500">output</i>
                    <div>
                      <PrettyInput keyName="output" />
                    </div>
                  </div>
                </div>
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
                  {/* upper-case the first letter */}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </TableHeaderCell>
              ))}
              <TableHeaderCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {/* {

            } */}
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
        <table>
          {selectedPrompt?.properties?.map((row, i) => (
            <tr key={i}>
              <td className="text-gray-500">{row.id}</td>
              <td className="text-gray-500">{row.createdAt}</td>
              {selectedPrompt?.columnNames?.map((col, i) => (
                <td key={i}>{row.properties[col]}</td>
              ))}
            </tr>
          ))}
        </table>
      </ThemedDrawer>
    </>
  );
};

export default PromptIdPage;
