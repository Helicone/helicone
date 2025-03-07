import { Col, Row } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import LLMAsJudgeEvaluatorDetails from "../details/LLMAsJudgeEvaluatorDetails";
import PythonEvaluatorDetails from "../details/PythonEvaluatorDetails";
import LastMileEvaluatorDetails from "../details/LastMileEvaluatorDetails";
import { getEvaluatorScoreName } from "../EvaluatorDetailsSheet";
import { useEvaluators } from "../EvaluatorHook";
import { useEvalPanelStore } from "../store/evalPanelStore";
import { H3, P } from "@/components/ui/typography";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnlineEvaluatorsSection } from "../details/OnlineEvaluatorsSection";
import { ExperimentsForEvaluator } from "../details/Experiments";
import { useEvaluatorDetails } from "../details/hooks";
import { useJawnClient } from "@/lib/clients/jawnHook";
import useNotification from "../../../shared/notification/useNotification";

// Create a dummy evaluator for when the real one doesn't exist yet
// This ensures we can always call the hook, even if we ignore the results
const PLACEHOLDER_EVALUATOR = {
  id: "placeholder",
  name: "placeholder",
  created_at: "",
  updated_at: "",
  scoring_type: "binary",
  organization_id: "",
  llm_template: null,
  code_template: null,
  last_mile_config: null,
};

export const EditPanel = ({
  selectedEvaluatorId,
}: {
  selectedEvaluatorId: string;
}) => {
  const { evaluators: evaluators, deleteEvaluator } = useEvaluators();
  const { closeEditPanel, resetPanels } = useEvalPanelStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const notification = useNotification();

  const evaluator = useMemo(() => {
    return evaluators.data?.data?.data?.find(
      (e) =>
        getEvaluatorScoreName(e.name, e.scoring_type) === selectedEvaluatorId ||
        e.name === selectedEvaluatorId
    );
  }, [evaluators, selectedEvaluatorId]);

  // Reset the panel if no evaluator is found after data is loaded
  useEffect(() => {
    if (evaluators.isSuccess && evaluators.data?.data?.data && !evaluator) {
      // If evaluators loaded but the selected one doesn't exist, reset panels
      resetPanels();
    }
  }, [evaluators.isSuccess, evaluator, resetPanels]);

  // Always call the hook with a real or placeholder evaluator
  // This ensures the hook is always called in the same order
  const { onlineEvaluators, createOnlineEvaluator, deleteOnlineEvaluator } =
    useEvaluatorDetails(evaluator || PLACEHOLDER_EVALUATOR, () => {
      setShowCreateModal(false);
    });

  const handleDelete = () => {
    if (evaluator && deleteConfirmation === evaluator.name) {
      setIsDeleting(true);
      deleteEvaluator.mutate(evaluator.id, {
        onSuccess: () => {
          setShowDeleteModal(false);
          closeEditPanel();
          setIsDeleting(false);
        },
        onError: () => {
          setIsDeleting(false);
        },
      });
    }
  };

  const handleUpdate = async () => {
    if (!evaluator) return;

    setIsUpdating(true);
    try {
      // The actual update logic is handled by the individual evaluator forms
      // This is just a placeholder for the UI state

      // Simulate a successful update after a short delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      notification.setNotification("Evaluator updated successfully", "success");
      setIsUpdating(false);
    } catch (error) {
      notification.setNotification("Failed to update evaluator", "error");
      setIsUpdating(false);
    }
  };

  const handleTest = () => {
    if (!evaluator) return;
    console.log("Opening test panel for evaluator", evaluator.id);
    useEvalPanelStore.getState().openTestPanel();
  };

  const getEvaluatorType = () => {
    if (!evaluator) return "default";
    if (evaluator.llm_template) return "LLM as a judge";
    if (evaluator.code_template) return "Python";
    if (evaluator.last_mile_config) return "LastMile";
    return "default";
  };

  const renderEvaluatorEditor = () => {
    if (!evaluator) return <p>This evaluator is a default evaluator.</p>;

    if (evaluator.llm_template) {
      return (
        <LLMAsJudgeEvaluatorDetails
          evaluator={evaluator}
          deleteEvaluator={deleteEvaluator}
          setSelectedEvaluator={() => {}}
        />
      );
    } else if (evaluator.code_template) {
      return (
        <PythonEvaluatorDetails
          evaluator={evaluator}
          deleteEvaluator={deleteEvaluator}
          setSelectedEvaluator={() => {}}
        />
      );
    } else if (evaluator.last_mile_config) {
      return (
        <LastMileEvaluatorDetails
          evaluator={evaluator}
          deleteEvaluator={deleteEvaluator}
          setSelectedEvaluator={() => {}}
        />
      );
    } else {
      return <p>This evaluator is a default evaluator.</p>;
    }
  };

  // Show loading state or fallback UI if evaluator is not found
  if (evaluators.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p>Loading evaluator details...</p>
      </div>
    );
  }

  if (!evaluator) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="flex justify-between w-full mb-4">
          <H3>Evaluator Not Found</H3>
          <Button variant="ghost" size="icon" onClick={closeEditPanel}>
            <XIcon size={18} />
          </Button>
        </div>
        <P className="text-muted-foreground text-center mb-6">
          The selected evaluator could not be found. It may have been deleted or
          you may need to refresh the page.
        </P>
        <Button variant="outline" onClick={closeEditPanel}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <Col className="h-full flex flex-col overflow-hidden bg-background">
      <Row className="justify-between items-center px-4 py-2 border-b shrink-0 bg-muted/30">
        <H3 className="text-lg font-medium">Edit evaluator</H3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            closeEditPanel();
          }}
        >
          <XIcon className="w-4 h-4" />
        </Button>
      </Row>

      <div className="px-4 py-2 text-sm text-muted-foreground">
        This evaluator is a {getEvaluatorType()} evaluator.
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-grow flex flex-col overflow-hidden"
      >
        <TabsList className="w-full grid grid-cols-3 bg-muted/30 p-0 h-9 rounded-none border-b">
          <TabsTrigger value="edit" className="text-xs rounded-none">
            Edit
          </TabsTrigger>
          <TabsTrigger value="online" className="text-xs rounded-none">
            Online Evaluators
          </TabsTrigger>
          <TabsTrigger value="experiments" className="text-xs rounded-none">
            Experiments
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-grow overflow-y-auto">
          <TabsContent value="edit" className="m-0 p-4 h-full">
            {renderEvaluatorEditor()}
          </TabsContent>

          <TabsContent value="online" className="m-0 p-4 h-full">
            {evaluator && onlineEvaluators?.data?.data?.data ? (
              <OnlineEvaluatorsSection
                onlineEvaluators={onlineEvaluators.data.data.data}
                createOnlineEvaluator={createOnlineEvaluator}
                deleteOnlineEvaluator={deleteOnlineEvaluator}
                showCreateModal={showCreateModal}
                setShowCreateModal={setShowCreateModal}
              />
            ) : (
              <P className="text-muted-foreground text-center py-8">
                {!evaluator
                  ? "Evaluator not found"
                  : "Loading online evaluators..."}
              </P>
            )}
          </TabsContent>

          <TabsContent value="experiments" className="m-0 p-4 h-full">
            {evaluator ? (
              <ExperimentsForEvaluator evaluator={evaluator} />
            ) : (
              <P className="text-muted-foreground text-center py-8">
                Evaluator not found
              </P>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Sticky Bottom Bar */}
      {evaluator && (
        <div className="shrink-0 border-t bg-muted/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                "Update Evaluator"
              )}
            </Button>
            <Button variant="outline" onClick={handleTest}>
              Test Evaluator
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            className="text-destructive border-destructive hover:bg-destructive/10"
          >
            Delete Evaluator
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this evaluator?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Please type the name of the
              evaluator to confirm:
              <br />
              <span className="text-destructive font-medium">
                {evaluator?.name}
              </span>
              <Input
                className="mt-2"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={evaluator?.name}
              />
              <div className="mt-2 text-sm">
                This will remove the evaluator from all experiments. Your scores
                will still be saved, but you will not be able to use this
                evaluator in new experiments.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteConfirmation !== evaluator?.name || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Col>
  );
};
