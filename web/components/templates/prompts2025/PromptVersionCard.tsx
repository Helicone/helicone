import ModelPill from "@/components/templates/requests/modelPill";
import type { components } from "../../../lib/clients/jawnTypes/public";
import { formatTime } from "./timeUtils";
import { Button } from "@/components/ui/button";
import { TestTube2, Crown, Clock, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Prompt2025Version = components["schemas"]["Prompt2025Version"];

interface PromptVersionCardProps {
  version: Prompt2025Version;
  isProductionVersion?: boolean;
  onSetProductionVersion: (promptId: string, promptVersionId: string) => void;
  onOpenPromptVersion: (promptVersionId: string) => void;
  onDeletePromptVersion: (promptVersionId: string) => void;
}

const PromptVersionCard = ({
  version,
  isProductionVersion = false,
  onSetProductionVersion,
  onOpenPromptVersion,
  onDeletePromptVersion,
}: PromptVersionCardProps) => {
  const versionDisplay =
    version.minor_version === 0
      ? `v${version.major_version}`
      : `v${version.major_version}.${version.minor_version}`;

  return (
    <div className="w-full border-b border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer group">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm text-foreground truncate">
            {version.commit_message}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
              {versionDisplay}
            </span>
            {isProductionVersion && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-600/20">
                Production
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPromptVersion(version.id);
                }}
              >
                <TestTube2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open in Playground</p>
            </TooltipContent>
          </Tooltip>
          {!isProductionVersion && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetProductionVersion(version.prompt_id, version.id);
                  }}
                >
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set as Production</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePromptVersion(version.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Version</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="flex items-center gap-4 px-4 pb-3">
        <ModelPill model={version.model} />
        <div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
          <Clock className="h-4 w-4" />
          <span className="text-xs">
            {formatTime(new Date(version.created_at), "")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PromptVersionCard;
