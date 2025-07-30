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
import { useState, useEffect } from "react";
import type { PromptWithVersions } from "@/services/hooks/prompts";
import PromptVersionHistory from "./PromptVersionHistory";
import { LuPanelRightClose, LuCopy } from "react-icons/lu";
import { Trash2 } from "lucide-react";
import TagsSummary from "./TagsSummary";
import useNotification from "@/components/shared/notification/useNotification";

interface PromptDetailsProps {
  promptWithVersions: PromptWithVersions | null;
  onRenamePrompt: (promptId: string, newName: string) => void;
  onSetProductionVersion: (promptId: string, promptVersionId: string) => void;
  onOpenPromptVersion: (promptVersionId: string) => void;
  onDeletePrompt: (promptId: string) => void;
  onDeletePromptVersion: (promptVersionId: string) => void;
  onFilterVersion?: (majorVersion: number | null) => void;
  onCollapse: () => void;
}

const PromptDetails = ({
  promptWithVersions,
  onRenamePrompt,
  onSetProductionVersion,
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

  useEffect(() => {
    if (promptWithVersions) {
      setSelectedVersion("All (last 50 versions)");
    }
  }, [promptWithVersions?.prompt.id]);

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

          <div className="flex items-end">
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
          onSetProductionVersion={onSetProductionVersion}
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
