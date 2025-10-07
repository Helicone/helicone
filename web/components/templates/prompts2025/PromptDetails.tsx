import { Small } from "@/components/ui/typography";
import ModelPill from "@/components/templates/requests/modelPill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState, useEffect, useMemo, type KeyboardEvent } from "react";
import { Edit3, Loader2, Plus, Trash2, X } from "lucide-react";
import type { PromptWithVersions } from "@/services/hooks/prompts";
import { useGetPromptTags } from "@/services/hooks/prompts";
import PromptVersionHistory from "./PromptVersionHistory";
import { LuPanelRightClose, LuCopy } from "react-icons/lu";
import TagsSummary from "./TagsSummary";
import useNotification from "@/components/shared/notification/useNotification";

interface PromptDetailsProps {
  promptWithVersions: PromptWithVersions | null;
  onRenamePrompt: (promptId: string, newName: string) => void;
  onUpdatePromptTags: (
    promptId: string,
    tags: string[],
  ) => Promise<boolean> | boolean;
  onSetEnvironment: (
    promptId: string,
    promptVersionId: string,
    environment: string,
  ) => void;
  onOpenPromptVersion: (promptVersionId: string) => void;
  onDeletePrompt: (promptId: string) => void;
  onDeletePromptVersion: (promptVersionId: string) => void;
  onFilterVersion?: (majorVersion: number | null) => void;
  onCollapse: () => void;
}

const PromptDetails = ({
  promptWithVersions,
  onRenamePrompt,
  onUpdatePromptTags,
  onSetEnvironment,
  onOpenPromptVersion,
  onDeletePrompt,
  onDeletePromptVersion,
  onFilterVersion,
  onCollapse,
}: PromptDetailsProps) => {
  const { setNotification } = useNotification();
  const [selectedVersion, setSelectedVersion] = useState<string>(
    "All (last 50 versions)",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [tagInputValue, setTagInputValue] = useState("");
  const [tagInputFeedback, setTagInputFeedback] = useState<string | null>(null);
  const [isSavingTags, setIsSavingTags] = useState(false);

  const { data: availableTags = [], isLoading: isLoadingAvailableTags } =
    useGetPromptTags();

  const promptTagsKey = useMemo(
    () => JSON.stringify(promptWithVersions?.prompt.tags ?? []),
    [promptWithVersions?.prompt.tags],
  );

  const tagsChanged = useMemo(() => {
    const currentTags = JSON.parse(promptTagsKey) as string[];
    if (currentTags.length !== draftTags.length) {
      return true;
    }

    const sortedCurrent = [...currentTags].sort((a, b) => a.localeCompare(b));
    const sortedDraft = [...draftTags].sort((a, b) => a.localeCompare(b));

    return sortedDraft.some((tag, index) => tag !== sortedCurrent[index]);
  }, [draftTags, promptTagsKey]);

  const allTagOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: string[] = [];
    [...availableTags, ...draftTags].forEach((tag) => {
      const normalized = tag?.trim();
      if (!normalized) {
        return;
      }
      const key = normalized.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      options.push(normalized);
    });
    return options.sort((a, b) => a.localeCompare(b));
  }, [availableTags, draftTags]);

  const suggestionTags = useMemo(() => {
    const selected = new Set(draftTags.map((tag) => tag.toLowerCase()));
    return allTagOptions.filter((tag) => !selected.has(tag.toLowerCase()));
  }, [allTagOptions, draftTags]);

  useEffect(() => {
    if (promptWithVersions) {
      setSelectedVersion("All (last 50 versions)");
    }
  }, [promptWithVersions?.prompt.id]);

  useEffect(() => {
    if (!promptWithVersions) {
      setDraftTags([]);
      setTagInputValue("");
      setTagInputFeedback(null);
      setIsTagEditorOpen(false);
      setIsSavingTags(false);
      return;
    }
    setDraftTags(promptWithVersions.prompt.tags ?? []);
    setTagInputValue("");
    setTagInputFeedback(null);
    setIsTagEditorOpen(false);
    setIsSavingTags(false);
  }, [promptWithVersions?.prompt.id]);

  useEffect(() => {
    if (!promptWithVersions || isTagEditorOpen) {
      return;
    }
    setDraftTags(promptWithVersions.prompt.tags ?? []);
  }, [promptTagsKey, isTagEditorOpen, promptWithVersions]);

  if (!promptWithVersions) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Small className="text-muted-foreground">
          Select a prompt to view details
        </Small>
      </div>
    );
  }

  const { prompt, productionVersion, majorVersions } = promptWithVersions;

  const handleTagEditorOpenChange = (open: boolean) => {
    setIsTagEditorOpen(open);
    setTagInputFeedback(null);
    setTagInputValue("");
  };

  const handleAddTag = (tag: string) => {
    const normalized = tag.trim();
    if (!normalized) {
      setTagInputFeedback("Tag cannot be empty");
      return;
    }

    const alreadySelected = draftTags.some(
      (existing) => existing.toLowerCase() === normalized.toLowerCase(),
    );

    if (alreadySelected) {
      setTagInputFeedback("Tag already added");
      return;
    }

    setDraftTags((prev) => [...prev, normalized]);
    setTagInputValue("");
    setTagInputFeedback(null);
  };

  const handleRemoveTag = (tag: string) => {
    setDraftTags((prev) =>
      prev.filter((existing) => existing.toLowerCase() !== tag.toLowerCase()),
    );
  };

  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleAddTag(tagInputValue);
    }

    if (
      event.key === "Backspace" &&
      tagInputValue.length === 0 &&
      draftTags.length > 0
    ) {
      event.preventDefault();
      const lastTag = draftTags[draftTags.length - 1];
      setDraftTags((prev) => prev.slice(0, -1));
      setTagInputValue(lastTag);
      setTagInputFeedback(null);
    }
  };

  const handleSaveTags = async () => {
    if (!tagsChanged) {
      handleTagEditorOpenChange(false);
      return;
    }

    setIsSavingTags(true);
    try {
      const success = await onUpdatePromptTags(prompt.id, draftTags);
      if (success) {
        handleTagEditorOpenChange(false);
      }
    } finally {
      setIsSavingTags(false);
    }
  };

  const versionOptions = ["All (last 50 versions)"];
  for (let i = 0; i <= majorVersions; i++) {
    versionOptions.push(`v${i}`);
  }

  const versionDisplay =
    productionVersion.minor_version === 0
      ? `v${productionVersion.major_version}`
      : `v${productionVersion.major_version}.${productionVersion.minor_version}`;

  const handleVersionChange = (value: string) => {
    setSelectedVersion(value);
    if (onFilterVersion) {
      if (value === "All (last 50 versions)") {
        onFilterVersion(null);
      } else {
        const majorVersion = parseInt(value.replace("v", ""));
        onFilterVersion(majorVersion);
      }
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="border-b border-border bg-background p-4">
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={"none"}
                      size={"square_icon"}
                      className="w-fit text-muted-foreground hover:text-primary"
                      onClick={onCollapse}
                    >
                      <LuPanelRightClose className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Collapse Drawer
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-2 truncate">
                {isEditing ? (
                  <Input
                    className="ml-1 h-auto truncate rounded border-none bg-transparent px-1 py-0 font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => {
                      setIsEditing(false);
                      if (editName !== prompt.name) {
                        onRenamePrompt(prompt.id, editName);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                      if (e.key === "Escape") {
                        setEditName(prompt.name);
                        setIsEditing(false);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <span
                    className="cursor-pointer truncate font-semibold text-foreground"
                    onClick={() => {
                      setIsEditing(true);
                      setEditName(prompt.name);
                    }}
                  >
                    {prompt.name}
                  </span>
                )}
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  {versionDisplay}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ModelPill model={productionVersion.model} />
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="none"
                      size="square_icon"
                      className="ml-1 w-fit text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Delete Prompt
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div
            className="group flex cursor-pointer items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            onClick={() => {
              navigator.clipboard.writeText(prompt.id);
              setNotification("ID copied to clipboard", "success");
            }}
          >
            <span>ID: {prompt.id}</span>
            <LuCopy className="ml-2 h-4 w-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Small className="font-medium text-foreground">Tags</Small>
              <Popover
                open={isTagEditorOpen}
                onOpenChange={handleTagEditorOpenChange}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm_sleek"
                    className="gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    type="button"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Manage
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Small className="text-xs font-semibold uppercase text-muted-foreground">
                        Selected Tags
                      </Small>
                      {draftTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {draftTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="helicone-secondary"
                              className="group flex items-center gap-2"
                            >
                              <span className="truncate">{tag}</span>
                              <button
                                type="button"
                                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                onClick={() => handleRemoveTag(tag)}
                                aria-label={`Remove ${tag}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                          No tags yet. Add or select tags below.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={tagInputValue}
                          onChange={(event) => {
                            setTagInputValue(event.target.value);
                            if (tagInputFeedback) {
                              setTagInputFeedback(null);
                            }
                          }}
                          onKeyDown={handleTagInputKeyDown}
                          placeholder="Add a tag"
                        />
                        <Button
                          variant="secondary"
                          size="sm_sleek"
                          onClick={() => handleAddTag(tagInputValue)}
                          disabled={tagInputValue.trim().length === 0}
                          className="gap-1"
                          type="button"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      </div>
                      {tagInputFeedback ? (
                        <span className="text-xs text-destructive">
                          {tagInputFeedback}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Press Enter or comma to add quickly.
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Small className="text-xs font-semibold uppercase text-muted-foreground">
                        Suggestions
                      </Small>
                      {isLoadingAvailableTags ? (
                        <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading tags...
                        </div>
                      ) : suggestionTags.length > 0 ? (
                        <Command className="max-h-40 overflow-hidden rounded-md border border-border">
                          <CommandInput placeholder="Search tags..." />
                          <CommandList>
                            <CommandEmpty>
                              No matches. Add a custom tag instead.
                            </CommandEmpty>
                            <CommandGroup>
                              {suggestionTags.map((tag) => (
                                <CommandItem
                                  key={tag}
                                  value={tag}
                                  onSelect={(value) => handleAddTag(value)}
                                >
                                  <Plus className="mr-2 h-3 w-3" />
                                  {tag}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      ) : (
                        <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                          All available tags are already selected. Add a custom
                          tag above.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm_sleek"
                        className="text-xs"
                        onClick={() => handleTagEditorOpenChange(false)}
                        disabled={isSavingTags}
                        type="button"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm_sleek"
                        className="gap-2"
                        onClick={handleSaveTags}
                        disabled={isSavingTags || !tagsChanged}
                        type="button"
                      >
                        {isSavingTags && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <TagsSummary tags={prompt.tags} className="w-full" />
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-background p-4">
        <div className="flex flex-col gap-2">
          <Small className="font-medium text-foreground">Version</Small>
          <Select value={selectedVersion} onValueChange={handleVersionChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versionOptions.map((version) => (
                <SelectItem key={version} value={version}>
                  {version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <PromptVersionHistory
          promptWithVersions={promptWithVersions}
          onSetEnvironment={onSetEnvironment}
          onOpenPromptVersion={onOpenPromptVersion}
          onDeletePromptVersion={onDeletePromptVersion}
        />
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              prompt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDeletePrompt(prompt.id);
                setDeleteDialogOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptDetails;
