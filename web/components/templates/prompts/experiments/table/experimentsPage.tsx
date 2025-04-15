import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import GenericEmptyState from "@/components/shared/helicone/GenericEmptyState";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import {
  ChevronDownIcon,
  FlaskConical,
  Plus,
  SquareArrowOutUpRight,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useJawnClient } from "../../../../../lib/clients/jawnHook";
import { useExperimentTables } from "../../../../../services/hooks/prompts/experiments";
import { usePrompts } from "../../../../../services/hooks/prompts/prompts";
import AuthHeader from "../../../../shared/authHeader";
import useNotification from "../../../../shared/notification/useNotification";
import ThemedTable from "../../../../shared/themed/table/themedTableOld";
import { StartFromPromptDialog } from "./components/startFromPromptDialog";

const ExperimentsPage = () => {
  const jawn = useJawnClient();
  const notification = useNotification();
  const { prompts } = usePrompts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [experimentToDelete, setExperimentToDelete] = useState<string | null>(
    null
  );
  const router = useRouter();
  const { experiments, isLoading, deleteExperiment } = useExperimentTables();
  const { setNotification } = useNotification();
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [emptyStateDropdownOpen, setEmptyStateDropdownOpen] = useState(false);
  const experimentCount = experiments?.length || 0;
  const hasExperiments = !isLoading && experimentCount > 0;
  const { canCreate: canCreateExperiment, freeLimit: MAX_EXPERIMENTS } =
    useFeatureLimit("experiments", experimentCount);

  if (isLoading) {
    return <LoadingAnimation title="Loading Experiments" />;
  }

  const handleDeleteExperiment = async () => {
    if (!experimentToDelete) return;

    try {
      await deleteExperiment.mutateAsync(experimentToDelete);
      setNotification("Experiment deleted successfully", "success");
    } catch (error) {
      setNotification("Failed to delete experiment", "error");
    } finally {
      setDeleteDialogOpen(false);
      setExperimentToDelete(null);
    }
  };

  const handleStartFromScratch = async () => {
    setNotification("Creating experiment...", "info");
    const res = await jawn.POST("/v2/experiment/create/empty");
    if (res.error) {
      notification.setNotification("Failed to create experiment", "error");
    } else {
      router.push(`/experiments/${res.data?.data?.experimentId}`);
    }
  };

  if (!hasExperiments && !isLoading) {
    return (
      <div className="flex flex-col w-full h-screen bg-background dark:bg-sidebar-background">
        <div className="flex flex-1 h-full">
          <GenericEmptyState
            title="Start Your First Experiment"
            description="Create an experiment to compare prompt and model variations side by side."
            icon={<FlaskConical size={28} className="text-accent-foreground" />}
            className="w-full"
            actions={
              <>
                <DropdownMenu
                  open={emptyStateDropdownOpen}
                  onOpenChange={setEmptyStateDropdownOpen}
                  modal={false}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      size="default"
                      disabled={!canCreateExperiment}
                    >
                      New Experiment
                      <Plus className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-[200px]">
                    <DropdownMenuItem onSelect={handleStartFromScratch}>
                      Start from scratch
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                      Start from prompt
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link
                  href="https://docs.helicone.ai/features/experiments"
                  target="_blank"
                >
                  <Button variant="outline" className="gap-2">
                    View Docs
                    <SquareArrowOutUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            }
          >
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <StartFromPromptDialog
                prompts={prompts as any}
                onDialogClose={() => setDialogOpen(false)}
              />
            </Dialog>
          </GenericEmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <AuthHeader
        title="Experiments"
        actions={
          !canCreateExperiment ? (
            <FreeTierLimitWrapper
              feature="experiments"
              itemCount={experimentCount}
            >
              <Button variant="action">
                Start new experiment
                <ChevronDownIcon className="w-4 h-4 ml-2" />
              </Button>
            </FreeTierLimitWrapper>
          ) : (
            <DropdownMenu
              open={headerDropdownOpen}
              onOpenChange={setHeaderDropdownOpen}
              modal={false}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="action">
                  Start new experiment
                  <ChevronDownIcon className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-[200px]">
                <DropdownMenuItem onSelect={handleStartFromScratch}>
                  Start from scratch
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                  Start from prompt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />

      {/* Experiment limit warning banner */}
      {!canCreateExperiment && (
        <FreeTierLimitBanner
          feature="experiments"
          itemCount={experimentCount}
          freeLimit={MAX_EXPERIMENTS}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <StartFromPromptDialog
          prompts={prompts as any}
          onDialogClose={() => setDialogOpen(false)}
        />
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Experiment</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Once deleted, this experiment cannot be recovered. Do you want to
            delete it?
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteExperiment}
              disabled={deleteExperiment.isPending}
            >
              {deleteExperiment.isPending ? "Deleting..." : "Yes, delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ThemedTable
        defaultColumns={[
          {
            header: "Name",
            accessorFn: (row) => {
              return row.name;
            },
          },
          {
            header: "Created At",
            accessorKey: "created_at",
            minSize: 100,
            accessorFn: (row) => {
              return new Date(row.created_at ?? 0).toLocaleString();
            },
          },
          {
            header: "",
            accessorKey: "actions",
            cell: ({ row }) => (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setExperimentToDelete(row.original.id);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            ),
            enableSorting: false,
            size: 10,
          },
        ]}
        defaultData={experiments}
        dataLoading={isLoading}
        id="experiments"
        skeletonLoading={false}
        onRowSelect={(row) => {
          const promptId = row.original_prompt_version;
          if (promptId) {
            router.push(`/experiments/${row.id}`);
          }
        }}
        fullWidth={true}
      />
    </div>
  );
};

export default ExperimentsPage;
