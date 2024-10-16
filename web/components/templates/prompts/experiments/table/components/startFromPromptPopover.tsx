import { usePromptVersions } from "../../../../../../services/hooks/prompts/prompts";

import { useState } from "react";
import { usePrompts } from "../../../../../../services/hooks/prompts/prompts";
import { PopoverContent } from "../../../../../ui/popover";
import { Select, SelectContent, SelectItem } from "../../../../../ui/select";
import { ScrollArea } from "../../../../../ui/scroll-area";
import { SelectTrigger, SelectValue } from "../../../../../ui/select";
import { Button } from "../../../../../ui/button";
import { FileTextIcon } from "lucide-react";

export const StartFromPromptPopover = ({
  prompts,
}: {
  prompts: {
    id: string;
    user_defined_id: string;
    description: string;
    pretty_name: string;
    created_at: string;
    major_version: number;
    metadata?: Record<string, any>;
  }[];
}) => {
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );

  const { prompts: promptVersions, isLoading: isLoadingVersions } =
    usePromptVersions(selectedPromptId ?? "");

  const handlePromptSelect = (promptId: string) => {
    setSelectedPromptId(promptId);
    setSelectedVersionId(null);
  };

  return (
    <PopoverContent
      className="w-[400px] p-4 bg-white shadow-lg rounded-md"
      side="top"
      align="center"
    >
      <div>
        <h3 className="font-semibold mb-2">Start with a prompt</h3>
        <p className="text-sm text-gray-500 mb-2">
          Choose an existing prompt and select the version you want to
          experiment on.
        </p>
        <ScrollArea className="flex flex-col overflow-y-auto max-h-[30vh] ">
          {prompts &&
            prompts?.map((prompt) => (
              <Button
                key={prompt.id}
                variant="ghost"
                className={`w-full justify-start mt-2 ${
                  selectedPromptId === prompt.id
                    ? "bg-slate-200"
                    : "hover:bg-accent"
                }`}
                onClick={() => handlePromptSelect(prompt.id)}
              >
                <FileTextIcon className="mr-2 h-4 w-4" />
                {prompt.user_defined_id}
              </Button>
            ))}
        </ScrollArea>

        <div className="mt-4 flex flex-row space-x-2 items-center justify-center">
          <h4 className="font-semibold ">Version</h4>
          <Select
            value={selectedVersionId ?? ""}
            onValueChange={setSelectedVersionId}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingVersions
                    ? "Loading versions..."
                    : "Select the version"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {!isLoadingVersions &&
                promptVersions?.map((version: any) => (
                  <SelectItem
                    key={version.id}
                    value={version.id}
                    className={`cursor-pointer ${
                      selectedVersionId === version.id
                        ? "bg-accent"
                        : "hover:bg-accent"
                    }`}
                  >
                    {version.name ||
                      `V ${version.major_version}.${version.minor_version}`}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-col space-y-2 items-center justify-center">
          <Button
            variant="default"
            disabled={!selectedVersionId}
            onClick={() => alert(1)}
            className="w-full"
          >
            Create experiment
          </Button>
        </div>
      </div>
    </PopoverContent>
  );
};
