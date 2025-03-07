import { Col, Row } from "@/components/layout/common";
import { generateOpenAITemplate } from "@/components/templates/evals/CreateNewEvaluator/evaluatorHelpers";
import { useInvalidateEvaluators } from "@/components/templates/evals/EvaluatorHook";
import { useTestDataStore } from "@/components/templates/evals/testing/testingStore";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { InfoIcon } from "lucide-react";
import React, { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import useNotification from "../../../shared/notification/useNotification";
import { LLM_AS_A_JUDGE_OPTIONS } from "../testing/examples";
import { TestInput } from "./types";
import { useEvalPanelStore } from "../store/evalPanelStore";

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
                state.LLMEvaluatorConfigFormPreset
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
      }
    )
  )
);

export const LLMEvaluatorConfigForm: React.FC<{
  onSubmit: () => void;
  existingEvaluatorId?: string;
  openTestPanel?: () => void;
}> = ({ existingEvaluatorId, onSubmit, openTestPanel }) => {
  const notification = useNotification();
  const jawn = useJawnClient();
  const { invalidate } = useInvalidateEvaluators();
  const { setTestConfig: setTestData } = useTestDataStore();
  const evalPanelStore = useEvalPanelStore();

  const {
    LLMEvaluatorConfigFormPreset: configFormParams,
    setLLMEvaluatorConfigFormPreset: setConfigFormParams,
  } = useLLMConfigStore();

  const openAIFunction = useMemo(() => {
    return generateOpenAITemplate({
      name: configFormParams.name,
      description: configFormParams.description,
      expectedValueType: configFormParams.expectedValueType,
      choiceScores: configFormParams.choiceScores,
      rangeMin: configFormParams.rangeMin,
      rangeMax: configFormParams.rangeMax,
      model: configFormParams.model,
      includedVariables: configFormParams.includedVariables,
    });
  }, [configFormParams]);

  const updateConfigFormParams = (
    updates: Partial<LLMEvaluatorConfigFormPreset>
  ) => {
    const updatedConfigFormParams = { ...configFormParams, ...updates };
    console.log(updatedConfigFormParams.includedVariables);
    setConfigFormParams(updatedConfigFormParams);
  };

  useEffect(() => {
    setTestData({
      _type: "llm",
      evaluator_llm_template: openAIFunction,
      evaluator_scoring_type: `LLM-${configFormParams.expectedValueType.toUpperCase()}`,
      evaluator_name: configFormParams.name,
    });
  }, [
    openAIFunction,
    configFormParams.expectedValueType,
    configFormParams.name,
    setTestData,
  ]);

  return (
    <Col className="h-full flex flex-col">
      <ScrollArea className="flex-grow">
        <Col className="space-y-4 h-full">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter evaluator name"
              value={configFormParams.name}
              onChange={(e) => {
                if (!/[^a-zA-Z0-9\s]+/g.test(e.target.value)) {
                  updateConfigFormParams({ name: e.target.value });
                } else {
                  notification.setNotification(
                    "Evaluator name can only contain letters and numbers.",
                    "error"
                  );
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Expected Value Type</Label>
            <RadioGroup
              defaultValue="boolean"
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

                updateConfigFormParams(updates);
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="boolean" id="boolean" />
                <Label htmlFor="boolean">Boolean</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Boolean scorers allow you to assign a score to a response
                    based on whether it is true or false.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="choice" id="choice" />
                <Label htmlFor="choice">Choice Scorer</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Choice scorers allow you to assign a score to a response
                    based on how well it matches a predefined set of choices.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="range" id="range" />
                <Label htmlFor="range">Range Scorer</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Range scorers allow you to assign a score to a response
                    based on how well it matches a predefined range.
                  </TooltipContent>
                </Tooltip>
              </div>
            </RadioGroup>
          </div>
          {configFormParams.expectedValueType === "boolean" && (
            <div className="space-y-2">
              <Label>Boolean Scorer</Label>
              <br />
              <span className="text-xs text-gray-500">
                Boolean scorers allow you to assign a score to a response based
                on whether it is true or false.
              </span>
            </div>
          )}
          {configFormParams.expectedValueType === "choice" && (
            <div className="space-y-2">
              <Label>Choice Scores</Label>
              <br />
              <span className="text-xs text-gray-500">
                You can add as many choice scores as you want, and they will be
                used to score the response based on how well it matches a
                predefined set of choices.
              </span>
              {!configFormParams.choiceScores ||
              configFormParams.choiceScores.length === 0 ? (
                <div className="mt-2">
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
                  >
                    Add Choice Scores
                  </Button>
                </div>
              ) : (
                configFormParams.choiceScores.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <Input
                      type="number"
                      value={item.score}
                      onChange={(e) => {
                        const choiceScores =
                          configFormParams.choiceScores ?? [];
                        choiceScores[index] = {
                          score: Number(e.target.value),
                          description: item.description,
                        };
                        updateConfigFormParams({
                          choiceScores,
                        });
                      }}
                      className="w-24"
                    />
                    <Input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const choiceScores =
                          configFormParams.choiceScores ?? [];
                        choiceScores[index] = {
                          score: item.score,
                          description: e.target.value,
                        };
                        updateConfigFormParams({
                          choiceScores,
                        });
                      }}
                      placeholder="Short description"
                      className="flex-grow"
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateConfigFormParams({
                            choiceScores: configFormParams.choiceScores?.filter(
                              (_, i) => i !== index
                            ),
                          })
                        }
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                    )}
                    {index ===
                      (configFormParams.choiceScores?.length || 0) - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateConfigFormParams({
                            choiceScores: [
                              ...(configFormParams.choiceScores || []),
                              { score: 0, description: "" },
                            ],
                          })
                        }
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          {configFormParams.expectedValueType === "range" && (
            <div className="space-y-2">
              <Label>Range Scorer</Label>
              <br />
              <span className="text-xs text-gray-500">
                You can set the minimum and maximum values for the range. The
                LLM will return a score between these values based on how well
                it matches the predefined range.
              </span>
              <div className="flex items-center space-x-2">
                <Input
                  id="range-min"
                  type="number"
                  value={configFormParams.rangeMin}
                  onChange={(e) =>
                    updateConfigFormParams({ rangeMin: Number(e.target.value) })
                  }
                  className="w-24"
                />
                <Input
                  id="range-max"
                  type="number"
                  value={configFormParams.rangeMax}
                  onChange={(e) =>
                    updateConfigFormParams({ rangeMax: Number(e.target.value) })
                  }
                  className="w-24"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <br />
            <span className="text-xs text-gray-500">
              Desciptions are used by the LLM to understand what the evaluator
              does.
            </span>
            <Textarea
              id="description"
              placeholder={
                configFormParams.expectedValueType === "boolean"
                  ? "Return true if the response is funny, false otherwise... (optional)"
                  : configFormParams.expectedValueType === "choice"
                  ? "Return the score of the response based on how well it matches a predefined set of choices... (optional)"
                  : "Return a score between 0 and 100 where 0 is super boring and 100 is hilarious... (optional)"
              }
              className="min-h-[100px]"
              value={configFormParams.description}
              onChange={(e) =>
                updateConfigFormParams({ description: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Included Variables</Label>
            <br />
            <Row className="gap-2">
              <Row className="items-center space-x-2">
                <Checkbox
                  variant="ghost"
                  id="inputs"
                  checked={configFormParams.includedVariables.inputs}
                  onCheckedChange={(checked) => {
                    updateConfigFormParams({
                      ...configFormParams,
                      includedVariables: {
                        ...configFormParams.includedVariables,
                        inputs: checked.valueOf() as boolean,
                      },
                    });
                  }}
                />
                <Label htmlFor="inputs">Inputs</Label>
              </Row>
              <Row className="items-center space-x-2">
                <Checkbox
                  variant="ghost"
                  id="promptTemplate"
                  checked={configFormParams.includedVariables.promptTemplate}
                  onCheckedChange={(checked) => {
                    updateConfigFormParams({
                      ...configFormParams,
                      includedVariables: {
                        ...configFormParams.includedVariables,
                        promptTemplate: checked.valueOf() as boolean,
                      },
                    });
                  }}
                />
                <Label htmlFor="promptTemplate">Prompt Template</Label>
              </Row>
              <Row className="items-center space-x-2">
                <Checkbox
                  id="inputBody"
                  variant="ghost"
                  checked={configFormParams.includedVariables.inputBody}
                  onCheckedChange={(checked) => {
                    updateConfigFormParams({
                      ...configFormParams,
                      includedVariables: {
                        ...configFormParams.includedVariables,
                        inputBody: checked.valueOf() as boolean,
                      },
                    });
                  }}
                />
                <Label htmlFor="inputBody">Input Body</Label>
              </Row>
              <Row className="items-center space-x-2">
                <Checkbox
                  id="outputBody"
                  variant="ghost"
                  checked={configFormParams.includedVariables.outputBody}
                  onCheckedChange={(checked) => {
                    updateConfigFormParams({
                      ...configFormParams,
                      includedVariables: {
                        ...configFormParams.includedVariables,
                        outputBody: checked.valueOf() as boolean,
                      },
                    });
                  }}
                />
                <Label htmlFor="outputBody">Output Body</Label>
              </Row>
            </Row>
          </div>
          <Row className="justify-end gap-5">
            <Row className="gap-2 items-center">
              <Label htmlFor="model">Model</Label>
              <Select
                defaultValue="gpt-4o"
                value={configFormParams.model}
                onValueChange={(value) =>
                  updateConfigFormParams({
                    model: value as "gpt-4o" | "gpt-4o-mini" | "gpt-3.5-turbo",
                  })
                }
              >
                <SelectTrigger className="w-[300px]">
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
            </Row>
            <Button
              variant="outline"
              onClick={() => {
                if (openTestPanel) {
                  console.log(
                    "Opening test panel via prop",
                    existingEvaluatorId ? "in edit mode" : "in create mode"
                  );
                  openTestPanel();
                } else {
                  console.log(
                    "Opening test panel via store",
                    existingEvaluatorId ? "in edit mode" : "in create mode"
                  );
                  evalPanelStore.openTestPanel();
                }
              }}
            >
              Open Test Panel
            </Button>
          </Row>
        </Col>
      </ScrollArea>
      <i className="text-xs text-gray-500">
        You will be charged for the LLM usage of this evaluator.
      </i>
      <Row className="justify-between mt-4">
        <Button
          onClick={() => {
            if (existingEvaluatorId) {
              jawn
                .PUT(`/v1/evaluator/{evaluatorId}`, {
                  params: {
                    path: {
                      evaluatorId: existingEvaluatorId,
                    },
                  },
                  body: {
                    llm_template: openAIFunction,
                    scoring_type: `LLM-${configFormParams.expectedValueType.toUpperCase()}`,
                    name: configFormParams.name,
                  },
                })
                .then((res) => {
                  if (res.data?.data) {
                    notification.setNotification(
                      "Evaluator updated successfully",
                      "success"
                    );
                  }
                });
            } else {
              jawn
                .POST("/v1/evaluator", {
                  body: {
                    llm_template: openAIFunction,
                    scoring_type: `LLM-${configFormParams.expectedValueType.toUpperCase()}`,
                    name: configFormParams.name,
                  },
                })
                .then((res) => {
                  if (res.data?.data) {
                    notification.setNotification(
                      "Evaluator created successfully",
                      "success"
                    );
                    invalidate();
                    onSubmit();
                  } else {
                    notification.setNotification(
                      "Failed to create evaluator",
                      "error"
                    );
                  }
                });
            }
          }}
        >
          {existingEvaluatorId ? "Update Evaluator" : "Create Evaluator"}
        </Button>
      </Row>
    </Col>
  );
};
