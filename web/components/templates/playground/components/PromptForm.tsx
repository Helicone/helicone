import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetPromptTags } from "@/services/hooks/prompts";
import TagsFilter from "@/components/templates/prompts2025/TagsFilter";

interface PromptFormProps {
  isScrolled: boolean;
  saveAndVersion: boolean;
  onCreatePrompt: (tags: string[], promptName: string) => void;
  onSavePrompt: (newMajorVersion: boolean, setAsProduction: boolean, commitMessage: string) => void;
}

export default function PromptForm({
  isScrolled,
  saveAndVersion,
  onCreatePrompt,
  onSavePrompt,
}: PromptFormProps) {
  const [promptName, setPromptName] = useState("");
  const [commitMessage, setCommitMessage] = useState("Update.");
  const [isPromptFormPopoverOpen, setIsPromptFormPopoverOpen] = useState(false);
  const [upgradeMajorVersion, setUpgradeMajorVersion] = useState(false);
  const [setAsProduction, setSetAsProduction] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState("");
  const [saveAsNewPrompt, setSaveAsNewPrompt] = useState(!saveAndVersion);

  const { data: existingTags = [], isLoading: isLoadingTags } = useGetPromptTags();

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
  };

  const getAllTags = () => {
    const customTagsList = customTags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    return Array.from(new Set([...selectedTags, ...customTagsList]));
  };

  return (
    <Popover
      open={isPromptFormPopoverOpen}
      onOpenChange={setIsPromptFormPopoverOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "border-none",
            isScrolled &&
              "bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900"
          )}
        >
          Save Prompt
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 mr-2">
        <div className="flex flex-col gap-4 py-4 w-full">
          {saveAndVersion && (
            <div className="flex justify-end">
              <div className="flex gap-2 items-center">
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent align="start">
                    Create a new prompt instead of versioning the current one.
                  </TooltipContent>
                </Tooltip>
                <Label htmlFor="save-as-new-prompt" className="text-sm">
                  Save as new prompt
                </Label>
                <Switch
                  className="data-[state=checked]:bg-foreground"
                  size="sm"
                  variant="helicone"
                  id="save-as-new-prompt"
                  checked={saveAsNewPrompt}
                  onCheckedChange={setSaveAsNewPrompt}
                />
              </div>
            </div>
          )}

          {(!saveAndVersion || saveAsNewPrompt) && (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="promptName">Prompt Name</Label>
                </div>
                <Input
                  id="promptName"
                  value={promptName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPromptName(e.target.value)
                  }
                  placeholder="new-prompt"
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label>Tags</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent align="start">
                      Add tags to help organize and filter your prompts
                    </TooltipContent>
                  </Tooltip>
                </div>
                <TagsFilter
                  tags={existingTags}
                  selectedTags={selectedTags}
                  onTagsChange={handleTagsChange}
                />
                <div className="flex flex-col gap-2 mt-2">
                  <Input
                    id="customTags"
                    value={customTags}
                    onChange={(e) => setCustomTags(e.target.value)}
                    placeholder="Tags separated by commas (e.g. tag1, tag2, tag3)"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="commitMessage">Commit Message</Label>
            </div>
            <Input
              id="commitMessage"
              value={commitMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCommitMessage(e.target.value)
              }
              placeholder="Update."
              className="w-full"
            />
          </div>

          {saveAndVersion && !saveAsNewPrompt && (
            <>
              <div className="flex justify-end">
                <div className="flex gap-2 items-center">
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent align="start">
                      Create a new major version instead of incrementing the minor version.
                    </TooltipContent>
                  </Tooltip>
                  <Label htmlFor="upgrade-major-version" className="text-sm">
                    Upgrade major version
                  </Label>
                  <Switch
                    className="data-[state=checked]:bg-foreground"
                    size="sm"
                    variant="helicone"
                    id="upgrade-major-version"
                    checked={upgradeMajorVersion}
                    onCheckedChange={setUpgradeMajorVersion}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <div className="flex gap-2 items-center">
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent align="start">
                      Mark this version as the production version for this prompt.
                    </TooltipContent>
                  </Tooltip>
                  <Label htmlFor="set-as-production" className="text-sm">
                    Set as production
                  </Label>
                  <Switch
                    className="data-[state=checked]:bg-foreground"
                    size="sm"
                    variant="helicone"
                    id="set-as-production"
                    checked={setAsProduction}
                    onCheckedChange={setSetAsProduction}
                  />
                </div>
              </div>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => {
              if (!saveAndVersion || saveAsNewPrompt) {
                onCreatePrompt(getAllTags(), promptName);
              } else {
                onSavePrompt(upgradeMajorVersion, setAsProduction, commitMessage);
              }
              setIsPromptFormPopoverOpen(false);
            }}
          >
            {(!saveAndVersion || saveAsNewPrompt) ? "Create Prompt" : "Save Prompt"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
