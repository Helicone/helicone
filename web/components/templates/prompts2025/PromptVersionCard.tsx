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
import { logger } from "@/lib/telemetry/logger";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TestTube2, Clock, Trash2, Crown, Copy, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { useGetPromptEnvironments } from "@/services/hooks/prompts";
import EnvironmentPill from "./EnvironmentPill";
import useNotification from "@/components/shared/notification/useNotification";

type Prompt2025Version = components["schemas"]["Prompt2025Version"];

interface PromptVersionCardProps {
  version: Prompt2025Version;
  isProductionVersion?: boolean;
  onSetEnvironment: (
    promptId: string,
    promptVersionId: string,
    environment: string,
  ) => void;
  onRemoveEnvironment: (
    promptId: string,
    promptVersionId: string,
    environment: string,
  ) => void;
  onOpenPromptVersion: (promptVersionId: string) => void;
  onDeletePromptVersion: (promptVersionId: string) => void;
}

const PromptVersionCard = ({
  version,
  isProductionVersion = false,
  onSetEnvironment,
  onRemoveEnvironment,
  onOpenPromptVersion,
  onDeletePromptVersion,
}: PromptVersionCardProps) => {
  const [isAddEnvironmentOpen, setIsAddEnvironmentOpen] = useState(false);
  const [environmentSearch, setEnvironmentSearch] = useState("");
  const [environmentToRemove, setEnvironmentToRemove] = useState<string | null>(
    null
  );

  const { setNotification } = useNotification();
  const { data: existingEnvironments = [] } = useGetPromptEnvironments();

  // Default environments that are always available
  const DEFAULT_ENVIRONMENTS = ["production", "staging", "development"];

  // Merge default environments with existing ones (deduped)
  const allEnvironments = Array.from(
    new Set([...DEFAULT_ENVIRONMENTS, ...existingEnvironments])
  );

  const versionDisplay =
    version.minor_version === 0
      ? `v${version.major_version}`
      : `v${version.major_version}.${version.minor_version}`;

  // Filter out environments already assigned to this version
  const availableEnvironments = allEnvironments.filter(
    (env) => !version.environments?.includes(env),
  );

  // Check if the search value is a new custom environment
  const trimmedSearch = environmentSearch.trim().toLowerCase();
  const isNewEnvironment =
    trimmedSearch.length > 0 &&
    !allEnvironments.some((env) => env.toLowerCase() === trimmedSearch) &&
    !version.environments?.some((env) => env.toLowerCase() === trimmedSearch);

  const handleCreateEnvironment = () => {
    if (trimmedSearch) {
      onSetEnvironment(version.prompt_id, version.id, environmentSearch.trim());
      setEnvironmentSearch("");
      setIsAddEnvironmentOpen(false);
    }
  };

  const handleCopyVersionId = async () => {
    try {
      await navigator.clipboard.writeText(version.id);
      setNotification("Version ID copied to clipboard", "success");
    } catch (err) {
      logger.error({ error: err }, "Failed to copy version ID");
      setNotification("Failed to copy version ID", "error");
    }
  };

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
            {version.environments?.map((env) => (
              <EnvironmentPill
                key={env}
                environment={env}
                onRemove={() => setEnvironmentToRemove(env)}
              />
            ))}
            <Popover
              open={isAddEnvironmentOpen}
              onOpenChange={(open) => {
                setIsAddEnvironmentOpen(open);
                if (!open) setEnvironmentSearch("");
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/50 hover:border-muted-foreground hover:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-muted-foreground">+</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search or type environment..."
                    value={environmentSearch}
                    onValueChange={setEnvironmentSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {isNewEnvironment ? (
                        <CommandItem
                          onSelect={handleCreateEnvironment}
                          className="cursor-pointer"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create "{environmentSearch.trim()}"
                        </CommandItem>
                      ) : (
                        <p className="p-2 text-sm text-muted-foreground">
                          No environments available.
                        </p>
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {isNewEnvironment && (
                        <CommandItem
                          onSelect={handleCreateEnvironment}
                          className="cursor-pointer"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create "{environmentSearch.trim()}"
                        </CommandItem>
                      )}
                      {availableEnvironments
                        .filter(
                          (env) =>
                            !trimmedSearch ||
                            env.toLowerCase().includes(trimmedSearch)
                        )
                        .map((env) => (
                          <CommandItem
                            key={env}
                            onSelect={() => {
                              onSetEnvironment(version.prompt_id, version.id, env);
                              setEnvironmentSearch("");
                              setIsAddEnvironmentOpen(false);
                            }}
                          >
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
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 transition-opacity">
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyVersionId();
                }}
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy Version ID</p>
            </TooltipContent>
          </Tooltip>

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

      {/* Environment removal confirmation dialog */}
      <AlertDialog
        open={environmentToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setEnvironmentToRemove(null);
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{environmentToRemove}" Environment</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the environment from this version entirely.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Trying to move it to another version?
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Don't remove it here. Instead, go to the version you want and click
              the + button to assign "{environmentToRemove}" there. It will
              automatically move.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (environmentToRemove) {
                  onRemoveEnvironment(
                    version.prompt_id,
                    version.id,
                    environmentToRemove
                  );
                  setEnvironmentToRemove(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PromptVersionCard;
