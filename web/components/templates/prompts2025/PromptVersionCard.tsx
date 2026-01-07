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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  TestTube2,
  Rocket,
  Clock,
  Trash2,
  Check,
  ChevronsUpDown,
  Crown,
  Copy,
  AlertTriangle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useGetPromptEnvironments } from "@/services/hooks/prompts";
import { Input } from "@/components/ui/input";
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
  onOpenPromptVersion: (promptVersionId: string) => void;
  onDeletePromptVersion: (promptVersionId: string) => void;
}

const PromptVersionCard = ({
  version,
  isProductionVersion = false,
  onSetEnvironment,
  onOpenPromptVersion,
  onDeletePromptVersion,
}: PromptVersionCardProps) => {
  const [isEnvironmentDialogOpen, setIsEnvironmentDialogOpen] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<
    string | undefined
  >(undefined);
  const [customEnvironment, setCustomEnvironment] = useState("");
  const [isEnvironmentDropdownOpen, setIsEnvironmentDropdownOpen] =
    useState(false);

  const { setNotification } = useNotification();
  const { data: environments = [], isLoading: isLoadingEnvironments } =
    useGetPromptEnvironments();

  const versionDisplay =
    version.minor_version === 0
      ? `v${version.major_version}`
      : `v${version.major_version}.${version.minor_version}`;

  const handleSetEnvironment = () => {
    const environmentToSet = selectedEnvironment || customEnvironment;
    if (environmentToSet) {
      onSetEnvironment(version.prompt_id, version.id, environmentToSet);
      setIsEnvironmentDialogOpen(false);
      setSelectedEnvironment(undefined);
      setCustomEnvironment("");
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
              <EnvironmentPill key={env} environment={env} />
            ))}
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

          <Dialog
            open={isEnvironmentDialogOpen}
            onOpenChange={setIsEnvironmentDialogOpen}
          >
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Rocket className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set Environment</p>
              </TooltipContent>
            </Tooltip>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Environment for {versionDisplay}</DialogTitle>
                <DialogDescription>
                  Select an environment to deploy this prompt version to. This
                  will immediately point all prompt calls in this environment to
                  this version.
                </DialogDescription>
              </DialogHeader>

              {version.environments?.includes("production") && (
                <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/20">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Production Environment Warning
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      You are about to deploy your production prompt version to
                      a different environment. Consider setting another prompt
                      version to production first to ensure safe fallback
                      behavior.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 pb-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Environment</label>
                  <Popover
                    open={isEnvironmentDropdownOpen}
                    onOpenChange={setIsEnvironmentDropdownOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isEnvironmentDropdownOpen}
                        className="w-full justify-between"
                        disabled={isLoadingEnvironments}
                      >
                        {selectedEnvironment ||
                          customEnvironment ||
                          "Select environment"}
                        <ChevronsUpDown size={16} className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search environments..." />
                        <CommandList>
                          <CommandEmpty>No environments found.</CommandEmpty>
                          <CommandGroup>
                            {environments.map((env) => (
                              <CommandItem
                                key={env}
                                onSelect={() => {
                                  setSelectedEnvironment(env);
                                  setCustomEnvironment("");
                                  setIsEnvironmentDropdownOpen(false);
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
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEnvironmentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetEnvironment}
                  disabled={!selectedEnvironment && !customEnvironment}
                >
                  Set Environment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
