import { Col, Row } from "@/components/layout/common";
import { useInvalidateEvaluators } from "@/components/templates/evals/EvaluatorHook";
import { Button } from "@/components/ui/button";
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
import React, { useEffect, useState } from "react";
import useNotification from "../../../shared/notification/useNotification";
import { useTestDataStore } from "../testing/testingStore";
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
    <>
      <Label className="whitespace-nowrap">{label}</Label>
      <div className="grid grid-cols-3 items-center gap-10">
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
            <SelectValue placeholder="Select data entry type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system-prompt">System Prompt</SelectItem>
            <SelectItem value="prompt-input">Prompt Input</SelectItem>
            <SelectItem value="input-body">Input Body</SelectItem>
            <SelectItem value="output-body">Output Body</SelectItem>
          </SelectContent>
        </Select>
        {defaultValue._type === "prompt-input" && (
          <Input
            placeholder="Input Key"
            value={defaultValue.inputKey}
            onChange={(e) => {
              onChange({ ...defaultValue, inputKey: e.target.value });
            }}
          />
        )}
        {defaultValue._type === "input-body" && (
          <Select
            value={defaultValue.content}
            onValueChange={(value) => {
              onChange({
                ...defaultValue,
                content: value as "jsonify" | "message",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select input body type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="message">Message</SelectItem>
              <SelectItem value="jsonify">JSONify</SelectItem>
            </SelectContent>
          </Select>
        )}
        {defaultValue._type === "output-body" && (
          <Select
            value={defaultValue.content}
            onValueChange={(value) => {
              onChange({
                ...defaultValue,
                content: value as "jsonify" | "message",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select input body type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jsonify">JSONify</SelectItem>
              <SelectItem value="message">Message</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </>
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
  const { invalidate } = useInvalidateEvaluators();

  const { setTestConfig: setTestData } = useTestDataStore();

  const [evaluatorType, setEvaluatorType] = useState<LastMileConfigForm>(
    preset || DEFAULT_RELEVANCE_TYPE
  );

  useEffect(() => {
    setTestData((prev) => {
      if (!prev) return null;
      return {
        _type: "lastmile",
        evaluator_name: evaluatorType.name,
        config: evaluatorType,
      };
    });
  }, [setTestData, evaluatorType]);

  // Initialize with preset if available
  useEffect(() => {
    if (preset) {
      setEvaluatorType(preset);
    }
  }, [preset]);

  return (
    <Col className="h-full flex flex-col gap-2">
      <div>
        <a
          href="https://docs.lastmileai.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600"
        >
          Last Mile AI Documentation
        </a>
      </div>
      <Label>Evaluator Name</Label>
      <Input
        placeholder="Name"
        value={evaluatorType.name}
        onChange={(e) =>
          setEvaluatorType({ ...evaluatorType, name: e.target.value })
        }
      />
      <Label>Evaluator Type</Label>
      <Select
        value={evaluatorType._type}
        onValueChange={(value) => {
          setEvaluatorType(DEFAULT_MAP[value as keyof typeof DEFAULT_MAP]);
        }}
      >
        <SelectTrigger className="w-fit">
          <SelectValue placeholder="Select evaluator type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">Relevance</SelectItem>
          <SelectItem value="context_relevance">Context Relevance</SelectItem>
          <SelectItem value="faithfulness">Faithfulness</SelectItem>
        </SelectContent>
      </Select>
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
            setEvaluatorType({ ...evaluatorType, output: value });
          }}
        />
      )}
      {evaluatorType._type === "faithfulness" && evaluatorType.groundTruth && (
        <SelectDataEntryType
          label="Ground Truth"
          defaultValue={evaluatorType.groundTruth}
          onChange={(value) => {
            setEvaluatorType({ ...evaluatorType, groundTruth: value });
          }}
        />
      )}

      <i className="text-xs text-gray-500">
        You will be charged for the LLM usage of this evaluator.
      </i>
      <Row className="justify-between mt-4">
        <Button
          onClick={() => {
            if (!evaluatorType.name) {
              notification.setNotification(
                "Evaluator name is required",
                "error"
              );
              return;
            }
            if (existingEvaluatorId) {
              jawn
                .PUT(`/v1/evaluator/{evaluatorId}`, {
                  params: {
                    path: {
                      evaluatorId: existingEvaluatorId,
                    },
                  },
                  body: {
                    llm_template: null,
                    last_mile_config: evaluatorType,
                    scoring_type: `LASTMILE`,
                    name: evaluatorType.name,
                  },
                })
                .then((res) => {
                  if (res.data?.data) {
                    notification.setNotification(
                      "Evaluator updated successfully",
                      "success"
                    );
                    invalidate();
                  }
                });
            } else {
              jawn
                .POST("/v1/evaluator", {
                  body: {
                    last_mile_config: evaluatorType,
                    scoring_type: `LASTMILE`,
                    name: evaluatorType.name,
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
        <Button
          variant="outline"
          onClick={() => {
            openTestPanel?.();
          }}
        >
          Test
        </Button>
      </Row>
    </Col>
  );
};
