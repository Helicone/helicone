import { Col } from "@/components/layout/common";
import { useTestDataStore } from "@/components/templates/evals/testing/testingStore";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { H3, Muted } from "@/components/ui/typography";
import { InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";
import useNotification from "../../../shared/notification/useNotification";
import { useEvalConfigStore } from "../store/evalConfigStore";
import { DataEntry, LastMileConfigForm } from "./types";

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

export const LastMileDevConfigForm: React.FC<{
  onSubmit: () => void;
  existingEvaluatorId?: string;
  openTestPanel?: () => void;
  preset?: LastMileConfigForm;
}> = ({ existingEvaluatorId, preset }) => {
  const notification = useNotification();

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
                    readOnly={!!existingEvaluatorId}
                    disabled={!!existingEvaluatorId}
                    onChange={(e) => {
                      if (!!existingEvaluatorId) return; // Skip if editing existing evaluator

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
                  {existingEvaluatorId && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Evaluator names cannot be changed after creation
                    </div>
                  )}
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
    </Col>
  );
};
