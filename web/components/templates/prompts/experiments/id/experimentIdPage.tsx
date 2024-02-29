import {
  ArrowsPointingOutIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Select, SelectItem } from "@tremor/react";
import Link from "next/link";
import { LegacyRef, useEffect, useRef, useState } from "react";
import { usePrompts } from "../../../../../services/hooks/prompts/prompts";
import { usePrompt } from "../../../../../services/hooks/prompts/singlePrompt";
import ThemedDrawer from "../../../../shared/themed/themedDrawer";
import { getUSDateFromString } from "../../../../shared/utils/utils";
import ThemedModal from "../../../../shared/themed/themedModal";
import { Chat } from "../../../requests/chat";
import { clsx } from "../../../../shared/clsx";
import { Tooltip } from "@mui/material";
import { BeakerIcon } from "@heroicons/react/24/solid";
import { ThemedPill } from "../../../../shared/themed/themedPill";
import ExperimentForm from "../../id/experimentForm";
import PromptPropertyCard from "../../id/promptPropertyCard";

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
      throw new Error("Input text must be a string");
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
    <div className="text-sm leading-8">
      {replaceInputKeysWithComponents(text)}
    </div>
  );
};

const ExperimentIdPage = (props: PromptIdPageProps) => {
  const { id } = props;
  const { prompts, isLoading } = usePrompts();

  const currentPrompt = prompts?.data?.prompts.find((p) => p.id === id);
  const [selectedVersion, setSelectedVersion] = useState<string>();

  const selectedPrompt = usePrompt({
    version: selectedVersion || "0",
    promptId: id,
  });

  const [inputOpen, setInputOpen] = useState(false);
  const [experimentOpen, setExperimentOpen] = useState(false);

  // the selected request to view in the tempalte
  const [selectedInput, setSelectedInput] = useState<{
    id: string;
    createdAt: string;
    properties: Record<string, string>;
    response: string;
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
    </>
  );
};

export default ExperimentIdPage;
