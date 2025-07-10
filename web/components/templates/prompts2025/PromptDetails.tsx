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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import type { PromptWithVersions } from "@/services/hooks/prompts";
import PromptVersionHistory from "./PromptVersionHistory";
import { LuPanelRightClose, LuCopy } from "react-icons/lu";
import { Trash2 } from "lucide-react";
import TagsSummary from "./TagsSummary";
import useNotification from "@/components/shared/notification/useNotification";

interface PromptDetailsProps {
  promptWithVersions: PromptWithVersions | null;
  onSetProductionVersion: (promptId: string, promptVersionId: string) => void;
  onOpenPromptVersion: (promptVersionId: string) => void;
  onDeletePrompt: (promptId: string) => void;
  onDeletePromptVersion: (promptVersionId: string) => void;
  onFilterVersion?: (majorVersion: number | null) => void;
  onCollapse: () => void;
}

const PromptDetails = ({
  promptWithVersions,
  onSetProductionVersion,
  onOpenPromptVersion,
  onDeletePrompt,
  onDeletePromptVersion,
  onFilterVersion,
  onCollapse,
}: PromptDetailsProps) => {
  const { setNotification } = useNotification();
  const [selectedVersion, setSelectedVersion] = useState<string>(
    "All (last 50 versions)"
  );

  useEffect(() => {
    if (promptWithVersions) {
      setSelectedVersion("All (last 50 versions)");
    }
  }, [promptWithVersions?.prompt.id]);

  if (!promptWithVersions) {
    return (
      <div className="w-full h-full flex items-center justify-center">
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
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-border bg-background">
        <div className="flex flex-col h-full gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={"none"}
                      size={"square_icon"}
                      className="w-fit text-muted-foreground hover:text-primary"
                      onClick={onCollapse}
                    >
                      <LuPanelRightClose className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Collapse Drawer
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-foreground truncate">
                  {prompt.name}
                </span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  {versionDisplay}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ModelPill model={productionVersion.model}/>
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="none"
                      size="square_icon"
                      className="w-fit text-muted-foreground hover:text-destructive ml-1"
                      onClick={() => onDeletePrompt(prompt.id)}
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
            className="flex items-center group cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            onClick={() => {
              navigator.clipboard.writeText(prompt.id);
              setNotification("ID copied to clipboard", "success");
            }}
          >
            <span>ID: {prompt.id}</span>
            <LuCopy className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>

          <div className="flex items-end">
            <TagsSummary tags={prompt.tags} className="w-full" />
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-border bg-background">
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
    </div>
  );
};

export default PromptDetails;
