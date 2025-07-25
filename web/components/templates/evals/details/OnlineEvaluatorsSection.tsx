import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PlusIcon,
  TrashIcon,
  InfoIcon,
  PercentIcon,
  TagIcon,
  PencilIcon,
} from "lucide-react";
import { H4, P } from "@/components/ui/typography";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import AddOnlineEvaluatorForm from "../AddOnlineEvaluatorForm";
import { useEvaluatorDetails } from "./hooks";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OnlineEvaluatorsSectionProps {
  onlineEvaluators: Array<{
    id: string;
    config: any;
  }>;
  createOnlineEvaluator: ReturnType<
    typeof useEvaluatorDetails
  >["createOnlineEvaluator"];
  deleteOnlineEvaluator: ReturnType<
    typeof useEvaluatorDetails
  >["deleteOnlineEvaluator"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OnlineEvaluatorsSection = ({
  onlineEvaluators,
  createOnlineEvaluator,
  deleteOnlineEvaluator,
  open,
  onOpenChange,
}: OnlineEvaluatorsSectionProps) => {
  const emptyState = onlineEvaluators.length === 0;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvaluator, setEditingEvaluator] = useState<string | null>(null);
  const [localEvaluators, setLocalEvaluators] = useState<
    typeof onlineEvaluators
  >([]);

  // Initialize or update local evaluators when props change and not editing
  useEffect(() => {
    if (!editingEvaluator) {
      // If IDs changed, update our local copy
      const currentIds = new Set(localEvaluators.map((e) => e.id));
      const newIds = new Set(onlineEvaluators.map((e) => e.id));

      // Only update if IDs actually changed (added or removed)
      if (
        currentIds.size !== newIds.size ||
        !Array.from(currentIds).every((id) => newIds.has(id))
      ) {
        setLocalEvaluators(onlineEvaluators);
      }
    }
  }, [onlineEvaluators, editingEvaluator]);

  // Initialize on first render
  useEffect(() => {
    if (localEvaluators.length === 0 && onlineEvaluators.length > 0) {
      setLocalEvaluators(onlineEvaluators);
    }
  }, [onlineEvaluators]);

  // Edit handler that preserves order
  const handleEditSubmit = (itemId: string, data: any) => {
    // Create new array with same order, updating just the one item
    const updatedEvaluators = localEvaluators.map((item) =>
      item.id === itemId ? { id: itemId, config: data.config } : item,
    );

    // Update local state to maintain order
    setLocalEvaluators(updatedEvaluators);

    // Exit edit mode
    setEditingEvaluator(null);

    // Perform backend operations
    deleteOnlineEvaluator.mutate(itemId);
    setTimeout(() => createOnlineEvaluator.mutate(data), 300);
  };

  // Add new evaluator to the list
  const handleCreate = (data: any) => {
    createOnlineEvaluator.mutate(data);
    setShowCreateForm(false);

    // No need to update localEvaluators here as the useEffect will handle it
    // when the onlineEvaluators prop updates
  };

  // Main dialog component for online evaluator management
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Online Evaluators</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              Run this evaluator automatically on your API requests based on
              filters and sampling rates.
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="ml-1 inline-block h-4 w-4 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="max-w-xs">
                      Online evaluators let you automatically evaluate specific
                      requests in production without manual setup.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {emptyState ? (
              <Card className="flex flex-col items-center justify-center space-y-4 border-dashed bg-muted/5 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/30">
                  <TagIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <H4>No online evaluators yet</H4>
                  <P className="mx-auto mt-1 max-w-md text-muted-foreground">
                    Create your first online evaluator to automatically evaluate
                    your API requests in production.
                  </P>
                </div>
                <Button onClick={() => setShowCreateForm(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" /> Create Online Evaluator
                </Button>
              </Card>
            ) : (
              <>
                <div
                  className={cn(
                    "grid gap-4 pb-2 pr-2",
                    "max-h-[60vh] overflow-y-auto",
                    "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:w-2",
                    "[&::-webkit-scrollbar-track]:bg-transparent",
                    "[&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700",
                    "scrollbar-gutter-stable",
                  )}
                >
                  {localEvaluators.map((item) => {
                    const sampleRate = (item.config as { sampleRate: number })
                      .sampleRate;
                    const propertyFilters = (
                      item.config as {
                        propertyFilters: { key: string; value: string }[];
                      }
                    ).propertyFilters;

                    return (
                      <Card
                        key={item.id}
                        className="overflow-hidden p-0 transition-shadow hover:shadow-sm"
                      >
                        <div className="flex flex-col">
                          {/* Card Header with sample rate and delete button */}
                          <div className="flex items-center justify-between border-b bg-muted/5 p-3">
                            <div className="flex items-center">
                              <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                                <PercentIcon className="h-3 w-3 text-primary" />
                              </div>
                              <p className="text-sm font-medium">
                                <span className="font-semibold">
                                  {sampleRate}%
                                </span>{" "}
                                sample rate
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                onClick={() => setEditingEvaluator(item.id)}
                                title="Edit evaluator"
                              >
                                <PencilIcon className="h-3 w-3" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Online Evaluator
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will delete the online evaluator and
                                      your requests will no longer be evaluated
                                      by this evaluator.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteOnlineEvaluator.mutate(item.id)
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          {/* Card Content - Property Filters */}
                          <div className="p-3">
                            {editingEvaluator === item.id ? (
                              <div className="mt-1">
                                <AddOnlineEvaluatorForm
                                  onSubmit={(data) => {
                                    handleEditSubmit(item.id, data);
                                  }}
                                  isLoading={
                                    createOnlineEvaluator.isPending ||
                                    deleteOnlineEvaluator.isPending
                                  }
                                  initialValues={{
                                    sampleRate,
                                    propertyFilters,
                                  }}
                                  close={() => setEditingEvaluator(null)}
                                />
                              </div>
                            ) : (
                              <>
                                {propertyFilters.length > 0 ? (
                                  <div>
                                    <p className="mb-1.5 flex items-center text-xs font-medium text-muted-foreground">
                                      <TagIcon className="mr-1 h-3 w-3" />
                                      Property Filters
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {propertyFilters.map((property) => (
                                        <Badge
                                          key={property.key}
                                          variant="outline"
                                          className="rounded bg-muted/20 px-1.5 py-0.5 text-xs"
                                        >
                                          <span className="font-medium text-foreground">
                                            {property.key}
                                          </span>
                                          <span className="mx-0.5 text-muted-foreground">
                                            =
                                          </span>
                                          <span className="text-foreground/80">
                                            {property.value}
                                          </span>
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-muted-foreground">
                                    <InfoIcon className="mr-1 h-3 w-3" />
                                    <span className="text-xs">
                                      No filters - all requests within sample
                                      rate
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="mt-4 pt-2">
                  <Button
                    variant="outline"
                    className="w-full justify-center border-dashed py-6 text-muted-foreground hover:border-dashed hover:bg-muted/10 hover:text-foreground"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" /> Add Another Evaluator
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Form Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Online Evaluator</DialogTitle>
            <DialogDescription>
              Create a new online evaluator to automatically evaluate your
              requests based on specific criteria.
            </DialogDescription>
          </DialogHeader>
          <AddOnlineEvaluatorForm
            onSubmit={handleCreate}
            isLoading={createOnlineEvaluator.isPending}
            close={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
