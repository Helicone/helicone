import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { InfoIcon, Check, ChevronsUpDown, Crown, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  useGetPromptTags,
  useGetPromptEnvironments,
} from "@/services/hooks/prompts";
import TagsFilter from "@/components/templates/prompts2025/TagsFilter";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface PromptFormProps {
  isScrolled: boolean;
  saveAndVersion: boolean;
  onCreatePrompt: (tags: string[], promptName: string) => void;
  onSavePrompt: (
    newMajorVersion: boolean,
    environment: string | undefined,
    commitMessage: string,
  ) => void;
  autoOpen?: boolean;
}

export default function PromptForm({
  isScrolled,
  saveAndVersion,
  onCreatePrompt,
  onSavePrompt,
  autoOpen,
}: PromptFormProps) {
  const [promptName, setPromptName] = useState("");
  const [commitMessage, setCommitMessage] = useState("Update.");
  const [isPromptFormPopoverOpen, setIsPromptFormPopoverOpen] = useState(false);
  const [upgradeMajorVersion, setUpgradeMajorVersion] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<
    string | undefined
  >(undefined);
  const [isEnvironmentOpen, setIsEnvironmentOpen] = useState(false);
  const [customEnvironment, setCustomEnvironment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState("");
  const [saveAsNewPrompt, setSaveAsNewPrompt] = useState(!saveAndVersion);

  const { data: existingTags = [], isLoading: isLoadingTags } =
    useGetPromptTags();

  const { data: environments = [], isLoading: isLoadingEnvironments } =
    useGetPromptEnvironments();

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
  };

  const getAllTags = () => {
    const customTagsList = customTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
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
            "border-none relative",
            isScrolled &&
              "bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900",
          )}
        >
          Save Prompt
          {autoOpen && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="relative mr-2 w-96">
        <Link
          href="https://docs.helicone.ai/gateway/prompt-integration"
          target="_blank"
          className="absolute right-4 top-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          View docs
          <SquareArrowOutUpRight className="h-3 w-3" />
        </Link>
        <div className="flex w-full flex-col gap-4 py-4">
          {saveAndVersion && (
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
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
                <div className="mt-2 flex flex-col gap-2">
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
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent align="start">
                      Create a new major version instead of incrementing the
                      minor version.
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

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label>Environment</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent align="start">
                      Select an existing environment or create a custom one.
                      Leave empty for no environment assignment.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Popover
                  open={isEnvironmentOpen}
                  onOpenChange={setIsEnvironmentOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isEnvironmentOpen}
                      className="w-full justify-between"
                      disabled={isLoadingEnvironments}
                    >
                      {selectedEnvironment ||
                        customEnvironment ||
                        "Select environment (optional)"}
                      <ChevronsUpDown size={16} className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search environments..." />
                      <CommandList>
                        <CommandEmpty>No environments found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setSelectedEnvironment(undefined);
                              setCustomEnvironment("");
                              setIsEnvironmentOpen(false);
                            }}
                          >
                            <Check
                              size={16}
                              className={cn(
                                "mr-2",
                                !selectedEnvironment && !customEnvironment
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            No environment
                          </CommandItem>
                          {environments.map((env) => (
                            <CommandItem
                              key={env}
                              onSelect={() => {
                                setSelectedEnvironment(env);
                                setCustomEnvironment("");
                                setIsEnvironmentOpen(false);
                              }}
                            >
                              <Check
                                size={16}
                                className={cn(
                                  "mr-2",
                                  selectedEnvironment === env
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {env}
                              {env === "production" && (
                                <Crown className="ml-auto h-3 w-3 text-muted-foreground/50" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="mt-2 flex flex-col gap-2">
                  <Input
                    placeholder="Or enter custom environment name..."
                    value={customEnvironment}
                    onChange={(e) => {
                      setCustomEnvironment(e.target.value);
                      if (e.target.value) {
                        setSelectedEnvironment(undefined);
                      }
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              if (!saveAndVersion || saveAsNewPrompt) {
                onCreatePrompt(getAllTags(), promptName);
              } else {
                onSavePrompt(
                  upgradeMajorVersion,
                  selectedEnvironment || customEnvironment,
                  commitMessage,
                );
              }
              setIsPromptFormPopoverOpen(false);
            }}
          >
            {!saveAndVersion || saveAsNewPrompt
              ? "Create Prompt"
              : "Save Prompt"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
