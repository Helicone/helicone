import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, SquareArrowOutUpRight, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useJawnClient } from "../../../../../lib/clients/jawnHook";
import { useExperimentTables } from "../../../../../services/hooks/prompts/experiments";
import { usePrompts } from "../../../../../services/hooks/prompts/prompts";
import AuthHeader from "../../../../shared/authHeader";
import useNotification from "../../../../shared/notification/useNotification";
import ThemedTable from "../../../../shared/themed/table/themedTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { StartFromPromptDialog } from "./components/startFromPromptDialog";
import { useHasAccess } from "@/hooks/useHasAccess";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import Link from "next/link";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";

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
  const org = useOrg();
  const hasAccess = useHasAccess("experiments");
  const { setNotification } = useNotification();
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [emptyStateDropdownOpen, setEmptyStateDropdownOpen] = useState(false);

  // Free tier limit checks
  const experimentCount = experiments?.length || 0;
  const {
    canCreate: canCreateExperiment,
    hasReachedLimit: hasReachedExperimentLimit,
    freeLimit: MAX_EXPERIMENTS,
  } = useFeatureLimit("experiments", experimentCount);

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

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <AuthHeader
        title="Experiments"
        actions={
          hasReachedExperimentLimit ? (
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
                <DropdownMenuItem
                  onSelect={async () => {
                    setNotification("Creating experiment...", "info");
                    const res = await jawn.POST("/v2/experiment/create/empty");
                    if (res.error) {
                      notification.setNotification(
                        "Failed to create experiment",
                        "error"
                      );
                    } else {
                      router.push(
                        `/experiments/${res.data?.data?.experimentId}`
                      );
                    }
                  }}
                >
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
      {hasReachedExperimentLimit && (
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
              disabled={deleteExperiment.isLoading}
            >
              {deleteExperiment.isLoading ? "Deleting..." : "Yes, delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {experiments?.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-12 px-4 text-center max-w-lg">
            <div className="flex flex-col items-center justify-center gap-2">
              <h3 className="text-2xl font-semibold">
                No experiments created yet
              </h3>
              <p className="text-gray-500 text-md">
                Get started by creating your first experiment. Compare different
                prompt and model variations side by side.
              </p>
            </div>
            <div className="flex flex-row gap-2">
              <DropdownMenu
                open={emptyStateDropdownOpen}
                onOpenChange={setEmptyStateDropdownOpen}
                modal={false}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="action" disabled={!canCreateExperiment}>
                    Create First Experiment
                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-[200px]">
                  <DropdownMenuItem
                    onSelect={async () => {
                      setNotification("Creating experiment...", "info");
                      const res = await jawn.POST(
                        "/v2/experiment/create/empty"
                      );
                      if (res.error) {
                        notification.setNotification(
                          "Failed to create experiment",
                          "error"
                        );
                      } else {
                        router.push(
                          `/experiments/${res.data?.data?.experimentId}`
                        );
                      }
                    }}
                  >
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
                <Button variant="outline" className="gap-2 text-slate-700">
                  View Docs
                  <SquareArrowOutUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default ExperimentsPage;
