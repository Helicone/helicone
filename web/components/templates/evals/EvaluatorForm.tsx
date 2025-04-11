import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { P } from "@/components/ui/typography";
import { ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import {
  generateOpenAITemplate,
  OpenAIFunctionParams,
} from "./CreateNewEvaluator/evaluatorHelpers";

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

export interface EvaluatorFormValues {
  name: string;
  description: string;
  scoringType: ScoringType;
  model: string;
  choiceScores?: ChoiceScore[];
  rangeMin?: number;
  rangeMax?: number;
  includedVariables?: {
    inputs: boolean;
    promptTemplate: boolean;
    inputBody: boolean;
    outputBody: boolean;
  };
}

export interface EvaluatorFormProps {
  initialValues?: Partial<EvaluatorFormValues>;
  isCreating: boolean;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export const EvaluatorForm = ({
  initialValues = {},
  isCreating,
  onSubmit,
  isSubmitting,
  onCancel,
}: EvaluatorFormProps) => {
  // State for form values with defaults
  const [name, setName] = useState(initialValues.name || "");
  const [scoringType, setScoringType] = useState<ScoringType>(
    initialValues.scoringType || "boolean"
  );
  const [description, setDescription] = useState(
    initialValues.description || ""
  );
  const [model, setModel] = useState(initialValues.model || modelOptions[0]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Additional state for scoring type configurations
  const [choiceScores, setChoiceScores] = useState<ChoiceScore[]>(
    initialValues.choiceScores || [...DEFAULT_CHOICE_SCORES]
  );
  const [rangeMin, setRangeMin] = useState(
    initialValues.rangeMin !== undefined
      ? initialValues.rangeMin
      : DEFAULT_RANGE_MIN
  );
  const [rangeMax, setRangeMax] = useState(
    initialValues.rangeMax !== undefined
      ? initialValues.rangeMax
      : DEFAULT_RANGE_MAX
  );

  // Included variables state
  const [includedVariables, setIncludedVariables] = useState({
    inputs: initialValues.includedVariables?.inputs !== false,
    promptTemplate: initialValues.includedVariables?.promptTemplate !== false,
    inputBody: initialValues.includedVariables?.inputBody !== false,
    outputBody: initialValues.includedVariables?.outputBody !== false,
  });

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
        name: name || (isCreating ? "New Evaluator" : "Evaluator"),
        description,
        expectedValueType: scoringType,
        includedVariables,
        model,
        ...(scoringType === "choice" ? { choiceScores } : {}),
        ...(scoringType === "range" ? { rangeMin, rangeMax } : {}),
      };

      // Generate the template using the helper function
      const openAITemplate = generateOpenAITemplate(functionParams);

      await onSubmit({
        configFormParams: {
          name: name || (isCreating ? "New Evaluator" : "Evaluator"),
          description,
          expectedValueType: scoringType,
          includedVariables,
          model,
          ...(scoringType === "choice" ? { choiceScores } : {}),
          ...(scoringType === "range" ? { rangeMin, rangeMax } : {}),
        },
        openAIFunction: openAITemplate,
      });
    } catch (error) {
      console.error("Error with evaluator:", error);
      // Error handling is done at the parent component level
    }
  };

  return (
    <form
      id="evaluator-form"
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Basic Info card - only shown when creating */}
      {isCreating && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Evaluator Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1"
                >
                  Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter evaluator name"
                  className="max-w-md"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <CardTitle className="text-lg font-medium">Scoring Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Tabs
              value={scoringType}
              onValueChange={(value) => setScoringType(value as ScoringType)}
              className="w-full"
            >
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="boolean">Boolean</TabsTrigger>
                <TabsTrigger value="choice">Categorical</TabsTrigger>
                <TabsTrigger value="range">Numeric</TabsTrigger>
              </TabsList>
              <TabsContent value="boolean" className="pt-4">
                <P className="text-muted-foreground">
                  Boolean scoring returns true/false or yes/no values. Ideal for
                  factual accuracy or requirement checking.
                </P>
              </TabsContent>
              <TabsContent value="choice" className="pt-4">
                <div className="space-y-4">
                  <P className="text-muted-foreground">
                    Categorical scoring returns values like &ldquo;good&rdquo;,
                    &ldquo;bad&rdquo;, &ldquo;excellent&rdquo;. Best for
                    qualitative assessments.
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
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={choice.score}
                            onChange={(e) =>
                              updateChoiceScore(index, "score", e.target.value)
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
                    Numeric scoring returns a value between 0-100. Suitable for
                    granular quality evaluations.
                  </P>
                  <div className="p-4 border rounded-md bg-muted/10">
                    <h4 className="font-medium text-sm mb-3">Range Values</h4>
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
                          onChange={(e) => setRangeMin(Number(e.target.value))}
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
                          onChange={(e) => setRangeMax(Number(e.target.value))}
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
              <Select value={model} onValueChange={(value) => setModel(value)}>
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
                    <label htmlFor="inputBody" className="text-sm font-medium">
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
                    <label htmlFor="outputBody" className="text-sm font-medium">
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

      {/* Footer */}
      <div className="pt-6 mt-10">
        {/* This div gives space for the fixed footer */}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4 shadow-md z-10">
        <div className="max-w-4xl mx-auto flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isCreating
                ? "Creating..."
                : "Saving..."
              : isCreating
              ? "Create Evaluator"
              : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default EvaluatorForm;
