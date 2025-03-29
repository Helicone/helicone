import { ReactElement, useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuthLayout from "../../components/layout/auth/authLayout";
import AuthHeader from "@/components/shared/authHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvaluators } from "@/components/templates/evals/EvaluatorHook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { P, H3 } from "@/components/ui/typography";
import useNotification from "@/components/shared/notification/useNotification";
import { useLLMEvaluatorSubmit } from "@/components/templates/evals/hooks/useEvaluatorSubmit";
import { useEvaluatorDetails } from "@/components/templates/evals/details/hooks";
import { OnlineEvaluatorsSection } from "@/components/templates/evals/details/OnlineEvaluatorsSection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  OpenAIFunctionToFunctionParams,
  generateOpenAITemplate,
  openAITemplateToOpenAIFunctionParams,
  OpenAIFunctionParams,
} from "@/components/templates/evals/CreateNewEvaluator/evaluatorHelpers";
import {
  Pencil,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Activity,
  Settings,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Type for scoring types
type ScoringType = "boolean" | "choice" | "range";

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

  // State for form values
  const [name, setName] = useState("");
  const [scoringType, setScoringType] = useState<ScoringType>("boolean");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState(modelOptions[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Additional state for scoring type configurations
  const [choiceScores, setChoiceScores] = useState<ChoiceScore[]>([
    ...DEFAULT_CHOICE_SCORES,
  ]);
  const [rangeMin, setRangeMin] = useState(DEFAULT_RANGE_MIN);
  const [rangeMax, setRangeMax] = useState(DEFAULT_RANGE_MAX);

  // Included variables state
  const [includedVariables, setIncludedVariables] = useState({
    inputs: true,
    promptTemplate: true,
    inputBody: true,
    outputBody: true,
  });

  // State to track if evaluator has any online evaluators
  const [hasOnlineEvaluators, setHasOnlineEvaluators] = useState(false);
  const [onlineEvaluatorCount, setOnlineEvaluatorCount] = useState(0);
  const [currentEvaluator, setCurrentEvaluator] = useState<any>(null);

  // Always call the hook with a real or placeholder evaluator
  // This ensures the hook is always called in the same order and with valid parameters
  const { onlineEvaluators, createOnlineEvaluator, deleteOnlineEvaluator } =
    useEvaluatorDetails(currentEvaluator || PLACEHOLDER_EVALUATOR, () => {
      setShowCreateModal(false);
    });

  // State for managing create modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // State for managing modal visibility
  const [showEvaluatorsModal, setShowEvaluatorsModal] = useState(false);

  // Update online evaluator status when data changes
  useEffect(() => {
    if (onlineEvaluators?.data?.data?.data && currentEvaluator?.id) {
      const evaluatorData = onlineEvaluators.data.data.data;
      const evaluatorCount = evaluatorData.length;
      setHasOnlineEvaluators(evaluatorCount > 0);
      setOnlineEvaluatorCount(evaluatorCount);
    } else {
      // Reset if no data is available
      setHasOnlineEvaluators(false);
      setOnlineEvaluatorCount(0);
    }
  }, [onlineEvaluators?.data, currentEvaluator]);

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

          // Set all form values from the extracted parameters
          setScoringType(params.expectedValueType);
          setDescription(params.description);
          setModel(params.model || modelOptions[0]);

          // Set scoring type specific values
          if (params.choiceScores?.length) {
            setChoiceScores(params.choiceScores);
          }

          if (typeof params.rangeMin === "number") setRangeMin(params.rangeMin);
          if (typeof params.rangeMax === "number") setRangeMax(params.rangeMax);

          // Extract includedVariables directly from the template since
          // openAITemplateToOpenAIFunctionParams doesn't extract this
          if (template.messages?.[0]?.content?.[0]?.text) {
            const templateText = template.messages[0].content[0].text;

            // Check which sections are included in the template text
            setIncludedVariables({
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
            });
          } else if (params.includedVariables) {
            // Fallback to params.includedVariables if available
            setIncludedVariables(params.includedVariables);
          }
        } catch (e) {
          console.error("Error parsing template:", e);
          // Set defaults if parsing fails
          setScoringType("boolean");
          setDescription("");
        }
      }

      setIsLoading(false);
    }
  }, [evaluators.data, id, router, notification]);

  // Simplified choice score helpers
  const addChoiceScore = () => {
    const lastScore =
      choiceScores.length > 0
        ? choiceScores[choiceScores.length - 1].score + 1
        : 1;
    setChoiceScores([...choiceScores, { score: lastScore, description: "" }]);
  };

  // Helper to remove a choice score
  const removeChoiceScore = (index: number) => {
    setChoiceScores(choiceScores.filter((_, i) => i !== index));
  };

  const updateChoiceScore = (
    index: number,
    field: keyof ChoiceScore,
    value: string | number
  ) => {
    const newScores = [...choiceScores];
    newScores[index] = {
      ...newScores[index],
      [field]: field === "score" ? Number(value) : value,
    };
    setChoiceScores(newScores);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create a params object for the OpenAI function template
      const functionParams: OpenAIFunctionParams & {
        model: string;
        includedVariables: {
          inputs: boolean;
          promptTemplate: boolean;
          inputBody: boolean;
          outputBody: boolean;
        };
      } = {
        name: name || "Evaluator",
        description,
        expectedValueType: scoringType,
        includedVariables,
        model,
        ...(scoringType === "choice" ? { choiceScores } : {}),
        ...(scoringType === "range" ? { rangeMin, rangeMax } : {}),
      };

      // Generate the template using the helper function
      const openAITemplate = generateOpenAITemplate(functionParams);

      await updateEvaluator.mutateAsync({
        configFormParams: {
          name: name || "Evaluator",
          description,
          expectedValueType: scoringType,
          includedVariables,
          model,
          ...(scoringType === "choice" ? { choiceScores } : {}),
          ...(scoringType === "range" ? { rangeMin, rangeMax } : {}),
        },
        openAIFunction: openAITemplate,
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
        <form
          id="evaluator-form"
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Evaluator name heading */}
          <div className="mb-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <H3>{name || "Unnamed Evaluator"}</H3>
              </div>
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

          {/* Prompt card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Evaluation Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="font-mono h-64"
                  placeholder="Enter your evaluator prompt here"
                  required
                />
                <P className="text-sm text-muted-foreground">
                  The instructions for how the LLM should evaluate responses. Be
                  specific about criteria and scoring.
                </P>
              </div>
            </CardContent>
          </Card>

          {/* Scoring Type card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Scoring Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Tabs
                  value={scoringType}
                  onValueChange={(value) =>
                    setScoringType(value as ScoringType)
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="boolean">Boolean</TabsTrigger>
                    <TabsTrigger value="choice">Categorical</TabsTrigger>
                    <TabsTrigger value="range">Numeric</TabsTrigger>
                  </TabsList>
                  <TabsContent value="boolean" className="pt-4">
                    <P className="text-muted-foreground">
                      Boolean scoring returns true/false or yes/no values. Ideal
                      for factual accuracy or requirement checking.
                    </P>
                  </TabsContent>
                  <TabsContent value="choice" className="pt-4">
                    <div className="space-y-4">
                      <P className="text-muted-foreground">
                        Categorical scoring returns values like "good", "bad",
                        "excellent". Best for qualitative assessments.
                      </P>
                      <div className="p-4 border rounded-md bg-muted/10">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-sm">Choice Values</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addChoiceScore}
                            className="h-8 px-2"
                          >
                            <Plus size={14} className="mr-1" /> Add Value
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {choiceScores.map((choice, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Input
                                type="number"
                                value={choice.score}
                                onChange={(e) =>
                                  updateChoiceScore(
                                    index,
                                    "score",
                                    e.target.value
                                  )
                                }
                                className="w-20"
                                placeholder="Score"
                              />
                              <Input
                                value={choice.description}
                                onChange={(e) =>
                                  updateChoiceScore(
                                    index,
                                    "description",
                                    e.target.value
                                  )
                                }
                                className="flex-1"
                                placeholder="Description"
                              />
                              {choiceScores.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeChoiceScore(index)}
                                  className="h-8 w-8"
                                >
                                  <Minus size={14} />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="range" className="pt-4">
                    <div className="space-y-4">
                      <P className="text-muted-foreground">
                        Numeric scoring returns a value between 0-100. Suitable
                        for granular quality evaluations.
                      </P>
                      <div className="p-4 border rounded-md bg-muted/10">
                        <h4 className="font-medium text-sm mb-3">
                          Range Values
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="range-min"
                              className="text-sm text-muted-foreground"
                            >
                              Minimum
                            </label>
                            <Input
                              id="range-min"
                              type="number"
                              value={rangeMin}
                              onChange={(e) =>
                                setRangeMin(Number(e.target.value))
                              }
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="range-max"
                              className="text-sm text-muted-foreground"
                            >
                              Maximum
                            </label>
                            <Input
                              id="range-max"
                              type="number"
                              value={rangeMax}
                              onChange={(e) =>
                                setRangeMax(Number(e.target.value))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Configuration dropdown */}
          <Card className="shadow-sm">
            <div
              className="cursor-pointer"
              onClick={() => setAdvancedOpen(!advancedOpen)}
            >
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-lg font-medium">
                  Advanced Configuration
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  {advancedOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
            </div>
            {advancedOpen && (
              <CardContent className="pt-0 space-y-6">
                {/* Model Selection */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label htmlFor="model" className="text-sm font-medium">
                      Model
                    </label>
                  </div>
                  <Select
                    value={model}
                    onValueChange={(value) => setModel(value)}
                  >
                    <SelectTrigger id="model" className="max-w-md">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <P className="text-sm text-muted-foreground">
                    You will be charged for the LLM usage of this evaluator.
                  </P>
                </div>

                {/* Included Variables Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Included Variables</h3>
                  <P className="text-sm text-muted-foreground">
                    Select which variables to include in the evaluation
                  </P>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {/* Inputs checkbox */}
                    <div className="flex items-start space-x-2 p-1 hover:bg-muted/20 rounded-md">
                      <Checkbox
                        id="inputs"
                        checked={includedVariables.inputs}
                        className="mt-1"
                        onCheckedChange={(checked) =>
                          setIncludedVariables({
                            ...includedVariables,
                            inputs: !!checked,
                          })
                        }
                      />
                      <div>
                        <label htmlFor="inputs" className="text-sm font-medium">
                          Inputs
                        </label>
                        <P className="text-xs text-muted-foreground">
                          Include prompt input variables
                        </P>
                      </div>
                    </div>

                    {/* Prompt Template checkbox */}
                    <div className="flex items-start space-x-2 p-1 hover:bg-muted/20 rounded-md">
                      <Checkbox
                        id="promptTemplate"
                        checked={includedVariables.promptTemplate}
                        className="mt-1"
                        onCheckedChange={(checked) =>
                          setIncludedVariables({
                            ...includedVariables,
                            promptTemplate: !!checked,
                          })
                        }
                      />
                      <div>
                        <label
                          htmlFor="promptTemplate"
                          className="text-sm font-medium"
                        >
                          Prompt Template
                        </label>
                        <P className="text-xs text-muted-foreground">
                          Include the prompt template
                        </P>
                      </div>
                    </div>

                    {/* Input Body checkbox */}
                    <div className="flex items-start space-x-2 p-1 hover:bg-muted/20 rounded-md">
                      <Checkbox
                        id="inputBody"
                        checked={includedVariables.inputBody}
                        className="mt-1"
                        onCheckedChange={(checked) =>
                          setIncludedVariables({
                            ...includedVariables,
                            inputBody: !!checked,
                          })
                        }
                      />
                      <div>
                        <label
                          htmlFor="inputBody"
                          className="text-sm font-medium"
                        >
                          Input Body
                        </label>
                        <P className="text-xs text-muted-foreground">
                          Include the full request body
                        </P>
                      </div>
                    </div>

                    {/* Output Body checkbox */}
                    <div className="flex items-start space-x-2 p-1 hover:bg-muted/20 rounded-md">
                      <Checkbox
                        id="outputBody"
                        checked={includedVariables.outputBody}
                        className="mt-1"
                        onCheckedChange={(checked) =>
                          setIncludedVariables({
                            ...includedVariables,
                            outputBody: !!checked,
                          })
                        }
                      />
                      <div>
                        <label
                          htmlFor="outputBody"
                          className="text-sm font-medium"
                        >
                          Output Body
                        </label>
                        <P className="text-xs text-muted-foreground">
                          Include the full response body
                        </P>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </form>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4 shadow-md z-10">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/evaluators")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="evaluator-form"
            disabled={updateEvaluator.isLoading}
          >
            {updateEvaluator.isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Render the OnlineEvaluatorsSection directly */}
      {currentEvaluator &&
        onlineEvaluators.data?.data?.data &&
        createOnlineEvaluator &&
        deleteOnlineEvaluator && (
          <OnlineEvaluatorsSection
            onlineEvaluators={onlineEvaluators.data.data.data}
            createOnlineEvaluator={createOnlineEvaluator}
            deleteOnlineEvaluator={deleteOnlineEvaluator}
            open={showEvaluatorsModal}
            onOpenChange={setShowEvaluatorsModal}
          />
        )}
    </div>
  );
};

EvaluatorDetail.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default EvaluatorDetail;
