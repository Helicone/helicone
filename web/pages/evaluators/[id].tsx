import { ReactElement, useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuthLayout from "../../components/layout/auth/authLayout";
import AuthHeader from "@/components/shared/authHeader";
import { Card } from "@/components/ui/card";
import { useEvaluators } from "@/components/templates/evals/EvaluatorHook";
import { Button } from "@/components/ui/button";
import { H3 } from "@/components/ui/typography";
import useNotification from "@/components/shared/notification/useNotification";
import { useLLMEvaluatorSubmit } from "@/components/templates/evals/hooks/useEvaluatorSubmit";
import { useEvaluatorDetails } from "@/components/templates/evals/details/hooks";
import { OnlineEvaluatorsSection } from "@/components/templates/evals/details/OnlineEvaluatorsSection";
import { TestDrawer } from "@/components/templates/evals/details/TestDrawer";

import { openAITemplateToOpenAIFunctionParams } from "@/components/templates/evals/CreateNewEvaluator/evaluatorHelpers";
import { Plus, Settings, Play } from "lucide-react";

import EvaluatorForm from "@/components/templates/evals/EvaluatorForm";

// Type for choice score item
type ChoiceScore = {
  score: number;
  description: string;
};

// Available model options
const modelOptions = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"];

// Default values for various scoring types
const DEFAULT_CHOICE_SCORES: ChoiceScore[] = [
  { score: 1, description: "Poor" },
  { score: 2, description: "Excellent" },
];
const DEFAULT_RANGE_MIN = 0;
const DEFAULT_RANGE_MAX = 100;

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

const EvaluatorDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const { evaluators } = useEvaluators();
  const notification = useNotification();

  // Reduce state to only what's needed after form extraction
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnlineEvaluators, setHasOnlineEvaluators] = useState(false);
  const [onlineEvaluatorCount, setOnlineEvaluatorCount] = useState(0);
  const [currentEvaluator, setCurrentEvaluator] = useState<any>(null);
  const [evaluatorFormValues, setEvaluatorFormValues] = useState<any>(null);

  // Always call the hook with a real or placeholder evaluator
  // This ensures the hook is always called in the same order and with valid parameters
  const {
    onlineEvaluators: onlineEvaluatorsDetails,
    createOnlineEvaluator,
    deleteOnlineEvaluator,
  } = useEvaluatorDetails(currentEvaluator || PLACEHOLDER_EVALUATOR, () => {
    setShowCreateModal(false);
  });

  // State for managing create modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // State for managing modal visibility - explicitly set to false to prevent auto-opening
  const [showEvaluatorsModal, setShowEvaluatorsModal] = useState(false);

  // State for test drawer
  const [showTestDrawer, setShowTestDrawer] = useState(false);

  // Only update evaluator counts, don't trigger modal visibility
  useEffect(() => {
    if (onlineEvaluatorsDetails?.data?.data?.data && currentEvaluator?.id) {
      const evaluatorData = onlineEvaluatorsDetails.data.data.data;
      const evaluatorCount = evaluatorData.length;
      setHasOnlineEvaluators(evaluatorCount > 0);
      setOnlineEvaluatorCount(evaluatorCount);
    } else {
      // Reset if no data is available
      setHasOnlineEvaluators(false);
      setOnlineEvaluatorCount(0);
    }
  }, [onlineEvaluatorsDetails?.data, currentEvaluator]);

  // Update mutation
  const updateEvaluator = useLLMEvaluatorSubmit(() => {
    notification.setNotification("Evaluator updated successfully", "success");
    evaluators.refetch();
  });

  // Load evaluator data when available
  useEffect(() => {
    if (evaluators.data?.data?.data && id) {
      const evaluator = evaluators.data.data.data.find((e) => e.id === id);

      if (!evaluator) {
        notification.setNotification("Evaluator not found", "error");
        router.push("/evaluators");
        return;
      }

      setCurrentEvaluator(evaluator);
      setName(evaluator.name || "");

      // Get scoring type and description from the template
      if (evaluator.scoring_type && evaluator.llm_template) {
        try {
          // Parse the template if it's a string
          const template =
            typeof evaluator.llm_template === "string"
              ? JSON.parse(evaluator.llm_template)
              : evaluator.llm_template;

          // Convert scoring type to the format expected by the helper
          const scoringTypeUpper = evaluator.scoring_type.toUpperCase();
          const formattedScoringType = scoringTypeUpper.startsWith("LLM-")
            ? (scoringTypeUpper as "LLM-BOOLEAN" | "LLM-CHOICE" | "LLM-RANGE")
            : "LLM-BOOLEAN";

          // Use the helper to extract all parameters from the template
          const params = openAITemplateToOpenAIFunctionParams(
            template,
            formattedScoringType
          );

          // Extract includedVariables directly from the template since
          // openAITemplateToOpenAIFunctionParams doesn't extract this
          let extractedIncludedVariables = {
            inputs: true,
            promptTemplate: true,
            inputBody: true,
            outputBody: true,
          };

          if (template.messages?.[0]?.content?.[0]?.text) {
            const templateText = template.messages[0].content[0].text;

            // Check which sections are included in the template text
            extractedIncludedVariables = {
              inputs: templateText.includes(
                '<helicone-prompt-input key="inputs" />'
              ),
              promptTemplate: templateText.includes(
                '<helicone-prompt-input key="promptTemplate" />'
              ),
              inputBody: templateText.includes(
                '<helicone-prompt-input key="inputBody" />'
              ),
              outputBody: templateText.includes(
                '<helicone-prompt-input key="outputBody" />'
              ),
            };
          } else if (params.includedVariables) {
            // Fallback to params.includedVariables if available
            extractedIncludedVariables = params.includedVariables;
          }

          // Set the form values for the shared component
          setEvaluatorFormValues({
            name: evaluator.name || "",
            description: params.description || "",
            scoringType: params.expectedValueType || "boolean",
            model: params.model || modelOptions[0],
            choiceScores: params.choiceScores || [...DEFAULT_CHOICE_SCORES],
            rangeMin:
              typeof params.rangeMin === "number"
                ? params.rangeMin
                : DEFAULT_RANGE_MIN,
            rangeMax:
              typeof params.rangeMax === "number"
                ? params.rangeMax
                : DEFAULT_RANGE_MAX,
            includedVariables: extractedIncludedVariables,
          });
        } catch (e) {
          console.error("Error parsing template:", e);
          // Set defaults if parsing fails
          setEvaluatorFormValues({
            name: evaluator.name || "",
            description: "",
            scoringType: "boolean",
            model: modelOptions[0],
            choiceScores: [...DEFAULT_CHOICE_SCORES],
            rangeMin: DEFAULT_RANGE_MIN,
            rangeMax: DEFAULT_RANGE_MAX,
            includedVariables: {
              inputs: true,
              promptTemplate: true,
              inputBody: true,
              outputBody: true,
            },
          });
        }
      } else {
        // Set defaults if no scoring type or template
        setEvaluatorFormValues({
          name: evaluator.name || "",
          description: "",
          scoringType: "boolean",
          model: modelOptions[0],
          choiceScores: [...DEFAULT_CHOICE_SCORES],
          rangeMin: DEFAULT_RANGE_MIN,
          rangeMax: DEFAULT_RANGE_MAX,
          includedVariables: {
            inputs: true,
            promptTemplate: true,
            inputBody: true,
            outputBody: true,
          },
        });
      }

      setIsLoading(false);
    }
  }, [evaluators.data, id, router, notification]);

  // Helper to add a new choice score
  const addChoiceScore = () => {
    if (!evaluatorFormValues) return;

    const lastScore =
      evaluatorFormValues.choiceScores.length > 0
        ? evaluatorFormValues.choiceScores[
            evaluatorFormValues.choiceScores.length - 1
          ].score + 1
        : 1;
    setEvaluatorFormValues({
      ...evaluatorFormValues,
      choiceScores: [
        ...evaluatorFormValues.choiceScores,
        { score: lastScore, description: "" },
      ],
    });
  };

  // Helper to remove a choice score
  const removeChoiceScore = (index: number) => {
    if (!evaluatorFormValues) return;

    setEvaluatorFormValues({
      ...evaluatorFormValues,
      choiceScores: evaluatorFormValues.choiceScores.filter(
        (_: any, i: number) => i !== index
      ),
    });
  };

  // Helper to update a choice score
  const updateChoiceScore = (
    index: number,
    field: "score" | "description",
    value: string | number
  ) => {
    if (!evaluatorFormValues) return;

    const newScores = [...evaluatorFormValues.choiceScores];
    newScores[index] = {
      ...newScores[index],
      [field]: field === "score" ? Number(value) : value,
    };
    setEvaluatorFormValues({
      ...evaluatorFormValues,
      choiceScores: newScores,
    });
  };

  // Handle form submission
  const handleSubmit = async (data: any): Promise<void> => {
    try {
      await updateEvaluator.mutateAsync({
        ...data,
        existingEvaluatorId: id as string,
      });
    } catch (error) {
      console.error("Error updating evaluator:", error);
      notification.setNotification("Failed to update evaluator", "error");
    }
  };

  // Pulsing indicator component
  const OnlineIndicator = () => (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2 border-green-500/20 bg-green-50/10 text-green-700 hover:bg-green-50/30 hover:text-green-800"
      onClick={() => {
        if (currentEvaluator) {
          setShowEvaluatorsModal(true);
        }
      }}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span>{onlineEvaluatorCount} Online</span>
      </div>
      <Settings size={14} />
    </Button>
  );

  if (evaluators.isLoading || isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
          <Card className="w-full p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="h-24 bg-muted rounded w-full"></div>
            </div>
          </Card>
          <Card className="w-full p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="h-12 bg-muted rounded w-full"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader
        title="Edit Evaluator"
        breadcrumb={{
          title: "Evaluators",
          href: "/evaluators",
        }}
      />
      <div className="p-6 pb-24 bg-background min-h-screen">
        {/* Evaluator name heading */}
        <div className="mb-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <H3>{name || "Unnamed Evaluator"}</H3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  if (currentEvaluator) {
                    setShowTestDrawer(true);
                  } else {
                    notification.setNotification(
                      "Please save the evaluator first",
                      "info"
                    );
                  }
                }}
              >
                <Play size={14} />
                <span>Test Evaluator</span>
              </Button>

              {hasOnlineEvaluators ? (
                <OnlineIndicator />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (currentEvaluator) {
                      // For empty state, open the modal and the create form directly
                      setShowEvaluatorsModal(true);
                    } else {
                      notification.setNotification(
                        "Please save the evaluator first",
                        "info"
                      );
                    }
                  }}
                >
                  <Plus size={14} />
                  <span>Add Online Evaluator</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Conditional rendering of the form */}
        {evaluatorFormValues && (
          <EvaluatorForm
            initialValues={evaluatorFormValues}
            isCreating={false}
            onSubmit={handleSubmit}
            isSubmitting={updateEvaluator.isLoading}
            onCancel={() => router.push("/evaluators")}
          />
        )}
      </div>

      {/* Render the OnlineEvaluatorsSection directly */}
      {currentEvaluator &&
        onlineEvaluatorsDetails.data?.data?.data &&
        createOnlineEvaluator &&
        deleteOnlineEvaluator && (
          <OnlineEvaluatorsSection
            onlineEvaluators={onlineEvaluatorsDetails.data.data.data}
            createOnlineEvaluator={createOnlineEvaluator}
            deleteOnlineEvaluator={deleteOnlineEvaluator}
            open={showEvaluatorsModal}
            onOpenChange={setShowEvaluatorsModal}
          />
        )}

      {/* Render the Test Drawer */}
      {currentEvaluator && (
        <TestDrawer
          evaluatorId={currentEvaluator.id}
          isOpen={showTestDrawer}
          onClose={() => setShowTestDrawer(false)}
        />
      )}
    </div>
  );
};

EvaluatorDetail.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default EvaluatorDetail;
