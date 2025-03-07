import { Col } from "@/components/layout/common";
import { useInvalidateEvaluators } from "@/components/templates/evals/EvaluatorHook";
import { useTestDataStore } from "@/components/templates/evals/testing/testingStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useEffect, useState } from "react";
import useNotification from "../../../shared/notification/useNotification";
import { DataEntry, LastMileConfigForm } from "./types";
import { H3, Muted } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useEvalFormStore } from "../store/evalFormStore";
import { useEvalConfigStore } from "../store/evalConfigStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

function SelectDataEntryType({
  label,
  defaultValue,
  onChange,
}: {
  label: string;
  defaultValue: DataEntry;
  onChange: (value: DataEntry) => void;
}) {
  const { setTestConfig: setTestData } = useTestDataStore();
  useEffect(() => {
    setTestData((prev) => {
      if (!prev) return null;
      return {
        _type: "lastmile",
        evaluator_name: "",
        config: DEFAULT_RELEVANCE_TYPE,
      };
    });
  }, [setTestData]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-medium">{label}</Label>
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {label === "Input"
              ? "Select the source of input data for evaluation"
              : label === "Output"
              ? "Select the source of output data for evaluation"
              : "Select the source of ground truth data for comparison"}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select
            value={defaultValue._type}
            onValueChange={(value) => {
              if (value === "prompt-input") {
                onChange({ _type: "prompt-input", inputKey: "" });
              } else if (value === "input-body") {
                onChange({ _type: "input-body", content: "message" });
              } else if (value === "output-body") {
                onChange({ _type: "output-body", content: "message" });
              } else if (value === "system-prompt") {
                onChange({ _type: "system-prompt" });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prompt-input">Prompt Input</SelectItem>
              <SelectItem value="input-body">Input Body</SelectItem>
              <SelectItem value="output-body">Output Body</SelectItem>
              <SelectItem value="system-prompt">System Prompt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {defaultValue._type === "prompt-input" && (
          <div>
            <Input
              placeholder="Input Key"
              value={defaultValue.inputKey}
              onChange={(e) => {
                onChange({
                  _type: "prompt-input",
                  inputKey: e.target.value,
                });
              }}
            />
          </div>
        )}

        {(defaultValue._type === "input-body" ||
          defaultValue._type === "output-body") && (
          <div>
            <Select
              value={defaultValue.content}
              onValueChange={(value) => {
                onChange({
                  ...defaultValue,
                  content: value as "message" | "jsonify",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="message">Message</SelectItem>
                <SelectItem value="jsonify">Jsonify</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

const DEFAULT_FAITHFULNESS_TYPE: LastMileConfigForm = {
  _type: "faithfulness",
  groundTruth: {
    _type: "system-prompt",
  },
  name: "",
  input: {
    _type: "system-prompt",
  },
  output: {
    _type: "output-body",
    content: "message",
  },
};

const DEFAULT_RELEVANCE_TYPE: LastMileConfigForm = {
  _type: "relevance",
  name: "",
  input: {
    _type: "system-prompt",
  },
  output: {
    _type: "output-body",
    content: "message",
  },
};

const DEFAULT_CONTEXT_RELEVANCE_TYPE: LastMileConfigForm = {
  _type: "context_relevance",
  name: "",
  input: {
    _type: "system-prompt",
  },
  output: {
    _type: "output-body",
    content: "message",
  },
};

const DEFAULT_MAP = {
  faithfulness: DEFAULT_FAITHFULNESS_TYPE,
  relevance: DEFAULT_RELEVANCE_TYPE,
  context_relevance: DEFAULT_CONTEXT_RELEVANCE_TYPE,
};

export const LastMileDevConfigForm: React.FC<{
  onSubmit: () => void;
  existingEvaluatorId?: string;
  openTestPanel?: () => void;
  preset?: LastMileConfigForm;
}> = ({ existingEvaluatorId, onSubmit, openTestPanel, preset }) => {
  const notification = useNotification();
  const jawn = useJawnClient();
  const invalidateEvaluators = useInvalidateEvaluators();
  const { isSubmitting, hideFormButtons } = useEvalFormStore();
  const { setTestConfig: setTestData } = useTestDataStore();

  // Use the config store
  const {
    lastMileName,
    setLastMileName,
    lastMileDescription,
    setLastMileDescription,
    lastMileConfig,
    setLastMileConfig,
  } = useEvalConfigStore();

  // Local state for form values
  const [evaluatorName, setEvaluatorName] = useState(lastMileName || "");
  const [evaluatorDescription, setEvaluatorDescription] = useState(
    lastMileDescription || ""
  );
  const [evaluatorType, setEvaluatorType] = useState<LastMileConfigForm>(
    lastMileConfig || preset || DEFAULT_RELEVANCE_TYPE
  );

  // Update the store when local state changes
  useEffect(() => {
    setLastMileName(evaluatorName);
    setLastMileDescription(evaluatorDescription);
    setLastMileConfig(evaluatorType);
  }, [
    evaluatorName,
    evaluatorDescription,
    evaluatorType,
    setLastMileName,
    setLastMileDescription,
    setLastMileConfig,
  ]);

  const handleSubmit = async () => {
    // We don't need to set isSubmitting here as it's handled by the mutation hook
    try {
      if (existingEvaluatorId) {
        const result = await jawn.PUT("/v1/evaluator/{evaluatorId}", {
          params: {
            path: {
              evaluatorId: existingEvaluatorId,
            },
          },
          body: {
            name: evaluatorName,
            description: evaluatorDescription,
            last_mile_config: evaluatorType,
            scoring_type: "LAST_MILE",
          },
        });
        if (!result.data?.data) {
          notification.setNotification("Failed to update evaluator", "error");
        } else {
          notification.setNotification(
            "Evaluator updated successfully",
            "success"
          );
          invalidateEvaluators.invalidate();
          onSubmit();
        }
      } else {
        const result = await jawn.POST("/v1/evaluator", {
          body: {
            name: evaluatorName,
            description: evaluatorDescription,
            last_mile_config: evaluatorType,
            scoring_type: "LAST_MILE",
          },
        });
        if (!result.data?.data) {
          notification.setNotification("Failed to create evaluator", "error");
        } else {
          notification.setNotification(
            "Evaluator created successfully",
            "success"
          );
          invalidateEvaluators.invalidate();
          onSubmit();
        }
      }
    } catch (error) {
      console.error("Error submitting LastMile evaluator:", error);
      notification.setNotification("An error occurred", "error");
    }
  };

  return (
    <Col className="h-full flex flex-col overflow-hidden">
      <ScrollArea
        className="flex-grow overflow-y-auto"
        type="always"
        scrollHideDelay={0}
      >
        <div className="px-4 py-4">
          <Col className="space-y-4">
            {/* Basic Information Section */}
            <div className="space-y-3">
              <div className="border-b pb-1 mb-3">
                <div className="flex items-baseline gap-2">
                  <H3 className="text-lg">Basic Information</H3>
                  <Muted className="text-sm">
                    Define your LastMile evaluator&apos;s name and type
                  </Muted>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Evaluator Name
                    </Label>
                    <a
                      href="https://docs.lastmileai.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 text-xs"
                    >
                      LastMile AI Documentation
                    </a>
                  </div>
                  <Input
                    id="name"
                    placeholder="Enter evaluator name"
                    value={evaluatorName}
                    onChange={(e) => {
                      if (!/[^a-zA-Z0-9\s]+/g.test(e.target.value)) {
                        setEvaluatorName(e.target.value);
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="type" className="text-sm font-medium">
                      Evaluator Type
                    </Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Choose the type of LastMile evaluator
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={evaluatorType._type}
                    onValueChange={(value) => {
                      if (value === "relevance") {
                        setEvaluatorType({
                          ...DEFAULT_RELEVANCE_TYPE,
                          name: evaluatorName,
                        });
                      } else if (value === "context_relevance") {
                        setEvaluatorType({
                          ...DEFAULT_CONTEXT_RELEVANCE_TYPE,
                          name: evaluatorName,
                        });
                      } else if (value === "faithfulness") {
                        setEvaluatorType({
                          ...DEFAULT_FAITHFULNESS_TYPE,
                          name: evaluatorName,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select evaluator type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="context_relevance">
                        Context Relevance
                      </SelectItem>
                      <SelectItem value="faithfulness">Faithfulness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="my-1" />

            {/* Configuration Section */}
            <div className="space-y-3">
              <div className="border-b pb-1 mb-3">
                <div className="flex items-baseline gap-2">
                  <H3 className="text-lg">Configuration</H3>
                  <Muted className="text-sm">
                    Configure the data sources for your evaluator
                  </Muted>
                </div>
              </div>

              <div className="space-y-4 p-3 bg-muted/10 rounded-md">
                {evaluatorType.input && (
                  <SelectDataEntryType
                    label="Input"
                    defaultValue={evaluatorType.input}
                    onChange={(value) => {
                      setEvaluatorType({
                        ...evaluatorType,
                        input: value,
                      });
                    }}
                  />
                )}

                {evaluatorType.output && (
                  <SelectDataEntryType
                    label="Output"
                    defaultValue={evaluatorType.output}
                    onChange={(value) => {
                      setEvaluatorType({
                        ...evaluatorType,
                        output: value,
                      });
                    }}
                  />
                )}

                {evaluatorType._type === "faithfulness" &&
                  evaluatorType.groundTruth && (
                    <SelectDataEntryType
                      label="Ground Truth"
                      defaultValue={evaluatorType.groundTruth}
                      onChange={(value) => {
                        setEvaluatorType({
                          ...evaluatorType,
                          groundTruth: value,
                        });
                      }}
                    />
                  )}
              </div>
            </div>
          </Col>
        </div>
      </ScrollArea>

      {!hideFormButtons && (
        <div className="shrink-0 border-t bg-muted/10 p-4 flex justify-end">
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitting}
            data-create-evaluator="true"
          >
            {isSubmitting ? (
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
                {existingEvaluatorId ? "Updating..." : "Creating..."}
              </span>
            ) : existingEvaluatorId ? (
              "Update Evaluator"
            ) : (
              "Create Evaluator"
            )}
          </Button>
        </div>
      )}
    </Col>
  );
};
