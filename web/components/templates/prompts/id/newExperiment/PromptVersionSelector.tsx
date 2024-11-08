import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../ui/select";
import { clsx } from "../../../../shared/clsx";
import MarkdownEditor from "../../../../shared/markdownEditor";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import ThemedModal from "../../../../shared/themed/themedModal";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { Button } from "../../../../ui/button";
import { Prompt } from "./types";
import useNotification from "../../../../shared/notification/useNotification";
import { Badge } from "@/components/ui/badge";

interface PromptVersionSelectorProps {
  prompts: Prompt[];
  selectedPrompt: Prompt | undefined;
  setSelectedPrompt: (prompt: Prompt | undefined) => void;
  onContinue: () => void;
}

const PromptVersionSelector: React.FC<PromptVersionSelectorProps> = ({
  prompts,
  selectedPrompt,
  setSelectedPrompt,
  onContinue,
}) => {
  const { setNotification } = useNotification();
  const [searchVersion, setSearchVersion] = React.useState<string>();
  const [open, setOpen] = React.useState(false);
  const [selectedVersionTemplate, setSelectedVersionTemplate] =
    React.useState("");

  const sortedPrompts = prompts?.sort(
    (a, b) =>
      b.major_version - a.major_version || b.minor_version - a.minor_version
  );

  // Find the production version based on metadata
  const productionVersion = sortedPrompts?.find(
    (prompt) => prompt.metadata?.isProduction === true
  );

  // If no version is explicitly set as production, fall back to the legacy logic
  const legacyProductionVersion = !productionVersion
    ? sortedPrompts?.find((prompt) => prompt.minor_version === 0)
    : null;

  const getTemplate = (prompt: Prompt) => {
    try {
      const content = JSON.parse(JSON.stringify(prompt.helicone_template))
        .messages[0].content;
      if (typeof content === "string") {
        return content;
      } else if (Array.isArray(content)) {
        return content.find((part) => part.type === "text")?.text;
      }
    } catch (e) {
      return "error parsing template";
    }
  };

  return (
    <>
      <div className="mt-2 flex flex-col h-full items-center justify-center">
        <div className="h-full w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black">
          <div className="w-full flex justify-between items-center py-2 px-4 border-b border-gray-300 dark:border-gray-700 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-500">Version:</label>
              <Select
                value={searchVersion}
                onValueChange={(value) => setSearchVersion(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {prompts?.map((prompt) => (
                    <SelectItem
                      key={prompt.id}
                      value={`${prompt.major_version}.${prompt.minor_version}`}
                    >
                      {prompt.major_version}.{prompt.minor_version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ul className="divide-y divide-gray-300 dark:divide-gray-700">
            {sortedPrompts
              ?.filter((prompt) => {
                if (!searchVersion) {
                  return true;
                }
                return (
                  `${prompt.major_version}.${prompt.minor_version}` ===
                  searchVersion
                );
              })
              .map((prompt, index) => {
                const template = getTemplate(prompt);
                const isProduction =
                  prompt.metadata?.isProduction === true ||
                  (!productionVersion && prompt === legacyProductionVersion);

                return (
                  <li
                    key={prompt.id}
                    className={clsx(
                      index === sortedPrompts?.length - 1 ? "rounded-b-lg" : "",
                      selectedPrompt?.id === prompt.id
                        ? "bg-sky-50 dark:bg-sky-950"
                        : "bg-white dark:bg-black",
                      "flex items-start space-x-2 gap-2 p-6 text-black dark:text-white"
                    )}
                  >
                    <input
                      type="radio"
                      name="selected-prompt"
                      className="border border-gray-300 dark:border-gray-700 rounded-full p-2.5 hover:cursor-pointer"
                      checked={selectedPrompt?.id === prompt.id}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                          setSelectedPrompt(prompt);
                        } else {
                          setSelectedPrompt(undefined);
                        }
                      }}
                    />
                    <div className="flex flex-col space-y-1 w-1/4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">
                          V{prompt.major_version}.{prompt.minor_version}
                        </span>
                        {isProduction && (
                          <Badge variant="secondary">Production</Badge>
                        )}
                      </div>
                    </div>
                    <div className="relative w-full">
                      <MarkdownEditor
                        text={
                          template?.length > 200
                            ? `${template.substring(0, 200)}...`
                            : template
                        }
                        setText={() => {}}
                        disabled={true}
                        language="markdown"
                      />
                      {template?.length > 200 && (
                        <Tooltip title="Expand">
                          <button
                            onClick={() => {
                              setSelectedVersionTemplate(
                                prompt.helicone_template
                              );
                              setOpen(true);
                            }}
                            className="absolute top-4 right-4"
                          >
                            <ArrowsPointingOutIcon className="h-4 w-4 text-gray-500" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
      <div
        id="step-inc"
        className="w-full flex justify-end sticky bottom-0 bg-gray-100 py-4 border-t border-gray-300 dark:border-gray-700 dark:bg-transparent"
      >
        <Button
          size="sm"
          onClick={() => {
            if (!selectedPrompt) {
              setNotification(
                "Please select a version to run the experiment.",
                "error"
              );
              return;
            } else {
              onContinue();
            }
          }}
        >
          Continue
        </Button>
      </div>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex flex-col w-[80vw]">
          <MarkdownEditor
            text={selectedVersionTemplate}
            setText={() => {}}
            disabled={true}
            language="markdown"
          />
        </div>
      </ThemedModal>
    </>
  );
};

export default PromptVersionSelector;
