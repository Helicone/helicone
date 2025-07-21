import { Col } from "@/components/layout/common";
import { generateOpenAITemplate } from "@/components/templates/evals/CreateNewEvaluator/evaluatorHelpers";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { H3, Muted } from "@/components/ui/typography";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { InfoIcon } from "lucide-react";
import React, { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import useNotification from "../../../shared/notification/useNotification";
import { useEvalConfigStore } from "../store/evalConfigStore";
import { useEvalFormStore } from "../store/evalFormStore";
import { useEvalPanelStore } from "../store/evalPanelStore";
import { LLM_AS_A_JUDGE_OPTIONS } from "../testing/examples";
import { TestInput } from "./types";

const modelOptions = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"];

export type LLMEvaluatorConfigFormPreset = {
  name: string;
  description: string;
  expectedValueType: "boolean" | "choice" | "range";
  includedVariables: {
    inputs: boolean;
    promptTemplate: boolean;
    inputBody: boolean;
    outputBody: boolean;
  };
  choiceScores?: Array<{ score: number; description: string }>;
  rangeMin?: number;
  rangeMax?: number;
  model: (typeof modelOptions)[number];
  testInput?: TestInput;
};

export const useLLMConfigStore = create<{
  LLMEvaluatorConfigFormPreset: LLMEvaluatorConfigFormPreset;
  setLLMEvaluatorConfigFormPreset: Dispatch<
    SetStateAction<LLMEvaluatorConfigFormPreset>
  >;
}>()(
  devtools(
    persist(
      (set) => ({
        LLMEvaluatorConfigFormPreset: LLM_AS_A_JUDGE_OPTIONS[0].preset,
        setLLMEvaluatorConfigFormPreset: (by) => {
          if (typeof by === "function") {
            set((state) => ({
              LLMEvaluatorConfigFormPreset: by(
                state.LLMEvaluatorConfigFormPreset,
              ),
            }));
          } else {
            set((state) => ({
              LLMEvaluatorConfigFormPreset: by,
            }));
          }
        },
      }),
      {
        name: "llm-config-store",
      },
    ),
  ),
);

// Component for section headers - more compact version
const SectionHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="mb-3 border-b pb-1">
    <div className="flex items-baseline gap-2">
      <H3 className="text-lg">{title}</H3>
      <Muted className="text-sm">{description}</Muted>
    </div>
  </div>
);

// Component for form field with label - more compact version
const FormField = ({
  id,
  label,
  children,
  tooltip,
  className = "",
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  tooltip?: string;
  className?: string;
}) => (
  <div className={`space-y-1 ${className}`}>
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon className="h-3 w-3 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
        </Tooltip>
      )}
    </div>
    {children}
  </div>
);

// Basic Information Section Component - more compact
const BasicInformationSection = ({
  configFormParams,
  updateConfigFormParams,
  notification,
  existingEvaluator = false,
}: {
  configFormParams: LLMEvaluatorConfigFormPreset;
  updateConfigFormParams: (
    updates: Partial<LLMEvaluatorConfigFormPreset>,
  ) => void;
  notification: ReturnType<typeof useNotification>;
  existingEvaluator?: boolean;
}) => (
  <div className="space-y-3">
    <SectionHeader
      title="Basic Information"
      description="Define your evaluator's name and purpose"
    />

    <div className="space-y-3">
      <FormField id="name" label="Evaluator Name">
        <Input
          id="name"
          placeholder="Enter evaluator name"
          value={configFormParams.name}
          className="border-input"
          readOnly={existingEvaluator}
          disabled={existingEvaluator}
          onChange={(e) => {
            if (existingEvaluator) return; // Skip if editing existing evaluator

            updateConfigFormParams({ name: e.target.value });
          }}
        />
        {existingEvaluator && (
          <div className="mt-1 text-xs text-muted-foreground">
            Evaluator names cannot be changed after creation
          </div>
        )}
      </FormField>

      <FormField id="description" label="Description">
        <>
          <Muted className="mb-1 block text-xs">
            Descriptions are used by the LLM to understand what the evaluator
            does.
          </Muted>
          <Textarea
            id="description"
            placeholder="Check if the response is appropriate"
            value={configFormParams.description}
            className="h-32 border-input"
            onChange={(e) =>
              updateConfigFormParams({ description: e.target.value })
            }
          />
        </>
      </FormField>
    </div>
  </div>
);

// Choice Scores Component
const ChoiceScoresSection = ({
  configFormParams,
  updateConfigFormParams,
}: {
  configFormParams: LLMEvaluatorConfigFormPreset;
  updateConfigFormParams: (
    updates: Partial<LLMEvaluatorConfigFormPreset>,
  ) => void;
}) => (
  <div className="rounded-md bg-muted/10 p-3">
    <div className="mb-2 flex items-center justify-between">
      <Label>Choice Scores</Label>
      <Tooltip>
        <TooltipTrigger>
          <InfoIcon className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Define the possible scores and their descriptions. The LLM will choose
          one of these options when evaluating.
        </TooltipContent>
      </Tooltip>
    </div>

    {!configFormParams.choiceScores ||
    configFormParams.choiceScores.length === 0 ? (
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          updateConfigFormParams({
            choiceScores: [
              { score: 1, description: "Poor" },
              { score: 5, description: "Excellent" },
            ],
          })
        }
        className="w-full"
      >
        <PlusIcon className="mr-2 h-4 w-4" />
        Add Choice Scores
      </Button>
    ) : (
      <div className="space-y-2">
        {configFormParams.choiceScores.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="number"
              value={item.score}
              onChange={(e) => {
                const choiceScores = configFormParams.choiceScores ?? [];
                choiceScores[index] = {
                  score: Number(e.target.value),
                  description: item.description,
                };
                updateConfigFormParams({
                  choiceScores,
                });
              }}
              className="w-16"
            />
            <Input
              type="text"
              value={item.description}
              onChange={(e) => {
                const choiceScores = configFormParams.choiceScores ?? [];
                choiceScores[index] = {
                  score: item.score,
                  description: e.target.value,
                };
                updateConfigFormParams({
                  choiceScores,
                });
              }}
              placeholder="Description"
              className="flex-grow"
            />
            <div className="flex gap-1">
              {index > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    updateConfigFormParams({
                      choiceScores: configFormParams.choiceScores?.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
              )}
              {index === (configFormParams.choiceScores?.length || 0) - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    updateConfigFormParams({
                      choiceScores: [
                        ...(configFormParams.choiceScores || []),
                        {
                          score: item.score + 1,
                          description: "",
                        },
                      ],
                    })
                  }
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Range Configuration Component - more compact
const RangeConfigSection = ({
  configFormParams,
  updateConfigFormParams,
}: {
  configFormParams: LLMEvaluatorConfigFormPreset;
  updateConfigFormParams: (
    updates: Partial<LLMEvaluatorConfigFormPreset>,
  ) => void;
}) => (
  <div className="rounded-md bg-muted/10 p-2">
    <Label className="mb-1 block text-sm">Range Configuration</Label>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label htmlFor="min-range" className="text-xs text-muted-foreground">
          Minimum Value
        </Label>
        <Input
          id="min-range"
          type="number"
          value={configFormParams.rangeMin ?? 0}
          onChange={(e) =>
            updateConfigFormParams({
              rangeMin: Number(e.target.value),
            })
          }
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="max-range" className="text-xs text-muted-foreground">
          Maximum Value
        </Label>
        <Input
          id="max-range"
          type="number"
          value={configFormParams.rangeMax ?? 100}
          onChange={(e) =>
            updateConfigFormParams({
              rangeMax: Number(e.target.value),
            })
          }
          className="w-full"
        />
      </div>
    </div>
  </div>
);

// Scoring Type Section Component - more compact
const ScoringTypeSection = ({
  configFormParams,
  updateConfigFormParams,
}: {
  configFormParams: LLMEvaluatorConfigFormPreset;
  updateConfigFormParams: (
    updates: Partial<LLMEvaluatorConfigFormPreset>,
  ) => void;
}) => {
  const scoringTypeTooltip = {
    boolean:
      "Boolean scorers allow you to assign a score to a response based on whether it is true or false.",
    choice:
      "Choice scorers allow you to assign a score to a response based on how well it matches a predefined set of choices.",
    range:
      "Range scorers allow you to assign a score to a response based on how well it matches a predefined range.",
  };

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Scoring Type"
        description="Choose how your evaluator will score responses"
      />

      <div className="flex flex-col space-y-3">
        <FormField
          id="scoring-type"
          label="Scoring Type"
          tooltip={scoringTypeTooltip[configFormParams.expectedValueType]}
        >
          <Select
            value={configFormParams.expectedValueType}
            onValueChange={(value) => {
              const valueType = value as "boolean" | "choice" | "range";
              const updates: Partial<LLMEvaluatorConfigFormPreset> = {
                expectedValueType: valueType,
              };

              // Initialize choiceScores when switching to choice type
              if (
                valueType === "choice" &&
                (!configFormParams.choiceScores ||
                  configFormParams.choiceScores.length === 0)
              ) {
                updates.choiceScores = [
                  { score: 1, description: "Poor" },
                  { score: 5, description: "Excellent" },
                ];
              }

              if (valueType === "range") {
                updates.rangeMin = 0;
                updates.rangeMax = 100;
              }

              updateConfigFormParams(updates);
            }}
          >
            <SelectTrigger id="scoring-type">
              <SelectValue placeholder="Select a scoring type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boolean">
                Boolean Scorer (true/false)
              </SelectItem>
              <SelectItem value="choice">
                Choice Scorer (predefined options)
              </SelectItem>
              <SelectItem value="range">
                Range Scorer (numeric range)
              </SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {/* Configuration based on selected type */}
        {configFormParams.expectedValueType === "boolean" && (
          <div className="rounded-md bg-muted/10 p-2">
            <Muted className="text-xs">
              The LLM will return true (1) or false (0) based on your
              description. Make sure your description clearly explains the
              criteria for a true result.
            </Muted>
          </div>
        )}

        {configFormParams.expectedValueType === "choice" && (
          <ChoiceScoresSection
            configFormParams={configFormParams}
            updateConfigFormParams={updateConfigFormParams}
          />
        )}

        {configFormParams.expectedValueType === "range" && (
          <RangeConfigSection
            configFormParams={configFormParams}
            updateConfigFormParams={updateConfigFormParams}
          />
        )}
      </div>
    </div>
  );
};

// Variables Section Component - more compact with 2x2 grid
const VariablesSection = ({
  configFormParams,
  updateConfigFormParams,
}: {
  configFormParams: LLMEvaluatorConfigFormPreset;
  updateConfigFormParams: (
    updates: Partial<LLMEvaluatorConfigFormPreset>,
  ) => void;
}) => {
  const variableOptions = [
    {
      id: "inputs",
      label: "Inputs",
      description: "Include prompt input variables",
      checked: configFormParams.includedVariables.inputs,
    },
    {
      id: "promptTemplate",
      label: "Prompt Template",
      description: "Include the prompt template",
      checked: configFormParams.includedVariables.promptTemplate,
    },
    {
      id: "inputBody",
      label: "Input Body",
      description: "Include the full request body",
      checked: configFormParams.includedVariables.inputBody,
    },
    {
      id: "outputBody",
      label: "Output Body",
      description: "Include the full response body",
      checked: configFormParams.includedVariables.outputBody,
    },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Included Variables"
        description="Select which variables to include in the evaluation"
      />

      <div className="grid grid-cols-2 gap-2">
        {variableOptions.map((option) => (
          <div
            key={option.id}
            className="flex items-start space-x-2 rounded-md p-1 hover:bg-muted/20"
          >
            <Checkbox
              id={option.id}
              checked={option.checked}
              className="mt-1"
              onCheckedChange={(checked) =>
                updateConfigFormParams({
                  includedVariables: {
                    ...configFormParams.includedVariables,
                    [option.id]: !!checked,
                  },
                })
              }
            />
            <div>
              <Label htmlFor={option.id} className="text-sm font-medium">
                {option.label}
              </Label>
              <Muted className="block text-xs">{option.description}</Muted>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Model & Testing Section Component - more compact with inline layout
const ModelTestingSection = ({
  configFormParams,
  updateConfigFormParams,
  openTestPanel,
  evalPanelStore,
  existingEvaluatorId,
}: {
  configFormParams: LLMEvaluatorConfigFormPreset;
  updateConfigFormParams: (
    updates: Partial<LLMEvaluatorConfigFormPreset>,
  ) => void;
  openTestPanel?: () => void;
  evalPanelStore: {
    openTestPanel: () => void;
  };
  existingEvaluatorId?: string;
}) => (
  <div className="space-y-3">
    <SectionHeader
      title="Model & Testing"
      description="Select the model and test your evaluator"
    />

    <div>
      <FormField id="model" label="Model" className="flex-1">
        <Select
          defaultValue="gpt-4o"
          value={configFormParams.model}
          onValueChange={(value) =>
            updateConfigFormParams({
              model: value as "gpt-4o" | "gpt-4o-mini" | "gpt-3.5-turbo",
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>

    <Muted className="text-xs">
      You will be charged for the LLM usage of this evaluator.
    </Muted>
  </div>
);

// Main Component - more compact spacing
export const LLMEvaluatorConfigForm: React.FC<{
  onSubmit: () => void;
  existingEvaluatorId?: string;
  openTestPanel?: () => void;
}> = ({ existingEvaluatorId, onSubmit, openTestPanel }) => {
  const notification = useNotification();
  const evalPanelStore = useEvalPanelStore();
  const { isSubmitting, hideFormButtons } = useEvalFormStore();

  // Use the evalConfigStore directly
  const { llmConfig, setLLMConfig, setLLMTemplate } = useEvalConfigStore();

  const openAIFunction = useMemo(() => {
    return generateOpenAITemplate({
      name: llmConfig.name,
      description: llmConfig.description,
      expectedValueType: llmConfig.expectedValueType,
      choiceScores: llmConfig.choiceScores,
      rangeMin: llmConfig.rangeMin,
      rangeMax: llmConfig.rangeMax,
      model: llmConfig.model,
      includedVariables: llmConfig.includedVariables,
    });
  }, [llmConfig]);

  // This function is called by child components to update the config
  const updateConfigFormParams = (
    updates: Partial<LLMEvaluatorConfigFormPreset>,
  ) => {
    // Update the store
    setLLMConfig(updates);
  };

  useEffect(() => {
    // Update the template in the store
    setLLMTemplate(openAIFunction);
  }, [openAIFunction, setLLMTemplate]);

  // Define the handleSubmit function for the Create/Update button
  const handleSubmit = () => {
    if (!llmConfig.name) {
      notification.setNotification("Evaluator name is required", "error");
      return;
    }

    // The actual submission is handled by CreatePanel's handleCreate function,
    // which uses the data from the store

    // Call onSubmit to continue with the flow
    onSubmit();
  };

  return (
    <Col className="flex h-full flex-col overflow-hidden">
      <ScrollArea
        className="flex-grow overflow-y-auto"
        type="always"
        scrollHideDelay={0}
      >
        <div className="px-4 py-4">
          <Col className="space-y-4">
            <BasicInformationSection
              configFormParams={llmConfig}
              updateConfigFormParams={updateConfigFormParams}
              notification={notification}
              existingEvaluator={!!existingEvaluatorId}
            />

            <Separator className="my-1" />

            <ScoringTypeSection
              configFormParams={llmConfig}
              updateConfigFormParams={updateConfigFormParams}
            />

            <Separator className="my-1" />

            <VariablesSection
              configFormParams={llmConfig}
              updateConfigFormParams={updateConfigFormParams}
            />

            <Separator className="my-1" />

            <ModelTestingSection
              configFormParams={llmConfig}
              updateConfigFormParams={updateConfigFormParams}
              openTestPanel={openTestPanel}
              evalPanelStore={evalPanelStore}
              existingEvaluatorId={existingEvaluatorId}
            />
          </Col>
        </div>
      </ScrollArea>
    </Col>
  );
};
