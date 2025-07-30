import ModelPill from "@/components/templates/requests/modelPill";
import type { components } from "../../../lib/clients/jawnTypes/public";
import { formatTime } from "./timeUtils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
    <div className="group w-full cursor-pointer border-b border-border bg-background transition-colors hover:bg-muted/50">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-sm text-foreground">
            {version.commit_message}
          </span>
          <div className="flex shrink-0 items-center gap-2">
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
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
            <AlertDialog>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Crown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Set as Production</p>
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Set as Production Version</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to set {versionDisplay} as the
                    production version? This will replace the current production
                    version and affect all future API calls using this prompt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      onSetProductionVersion(version.prompt_id, version.id)
                    }
                  >
                    Set as Production
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <AlertDialog>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Version</p>
              </TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Version</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete version {versionDisplay}? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeletePromptVersion(version.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="flex items-center gap-4 px-4 pb-3">
        <ModelPill model={version.model} />
        <div className="flex items-center gap-1 whitespace-nowrap text-muted-foreground">
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
