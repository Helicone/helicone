import { useState } from "react";
import { usePlaygroundPage } from "../../../services/hooks/playground";
import { clsx } from "../../shared/clsx";
import { useDebounce } from "../../../services/hooks/debounce";
import AuthHeader from "../../shared/authHeader";
import RequestDrawerV2 from "../requestsV2/requestDrawerV2";
import useNotification from "../../shared/notification/useNotification";
import {
  CodeBracketSquareIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { MultiSelect, MultiSelectItem } from "@tremor/react";
import ThemedModal from "../../shared/themed/themedModal";
import Image from "next/image";
import { usePrompts } from "../../../services/hooks/prompts/prompts";
import { usePrompt } from "../../../services/hooks/prompts/singlePrompt";

interface PromptsPageProps {
  request?: string;
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
    console.log(parts);
    return parts;
  };

  return <div>{replaceInputKeysWithComponents(text)}</div>;
};

const PromptsPage = (props: PromptsPageProps) => {
  const { prompts } = usePrompts();

  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>(
    undefined
  );

  const [selectedVersion, setSelectedVersion] = useState<number>(0);

  const selectedPrompt = usePrompt({
    version: selectedVersion,
    promptId: selectedPromptId,
  });

  return (
    <>
      <AuthHeader title={"Prompts"} />
      <div className="flex flex-col xl:flex-row xl:divide-x xl:divide-gray-200 dark:xl:divide-gray-800 gap-8 xl:gap-4 min-h-[80vh] h-full">
        <div className="flex flex-col space-y-6 w-full min-w-[350px] max-w-[350px]">
          <h3 className="font-semibold text-md text-black dark:text-white">
            Your Prompts
          </h3>

          <ul className="w-full bg-white h-fit border border-gray-300 dark:border-gray-700 rounded-lg">
            {prompts?.data?.map((p) => (
              <div key={p.id}>
                <button
                  onClick={() => {
                    setSelectedPromptId(p.id);
                    setSelectedVersion(p.latest_version);
                  }}
                  className={clsx(
                    "bg-gray-200 rounded-md p-2 m-2",
                    selectedPromptId === p.id ? "bg-blue-200" : ""
                  )}
                >
                  {JSON.stringify(p)}
                  {/* {p.id} - version count: {p.latest_version} */}
                </button>
              </div>
            ))}
          </ul>
        </div>

        <div className="w-full xl:pl-4 flex flex-col space-y-4">
          {selectedPromptId ? (
            <div className="flex flex-col gap-2">
              <div>
                Version:
                <input
                  type="number"
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(parseInt(e.target.value))}
                />
              </div>
              {selectedPrompt.isLoading ? (
                <h1>Loading...</h1>
              ) : (
                <div className="bg-white p-5">
                  <i className="text-gray-400">input</i>
                  {selectedPrompt.heliconeTemplate?.messages.map(
                    (m: any, i: number) => (
                      <div key={i}>
                        <RenderWithPrettyInputKeys text={m.content} />
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="bg-white p-5">
                <i className="text-gray-400">output</i>
                <div>
                  <PrettyInput keyName="output" />
                </div>
              </div>
            </div>
          ) : (
            <div>Select a prompt on the left side</div>
          )}
        </div>
      </div>
    </>
  );
};

export default PromptsPage;
