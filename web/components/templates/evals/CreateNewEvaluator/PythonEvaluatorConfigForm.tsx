import { Col, Row } from "@/components/layout/common";
import { useInvalidateEvaluators } from "@/components/templates/evals/EvaluatorHook";
import { useTestDataStore } from "@/components/templates/evals/testing/testingStore";
import {
  CompositeOption,
  TestFunction,
} from "@/components/templates/evals/testing/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useJawnClient } from "@/lib/clients/jawnHook";
import React, { useEffect, useState } from "react";
import MarkdownEditor from "../../../shared/markdownEditor";
import useNotification from "../../../shared/notification/useNotification";

const modelOptions = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"];

export type EvaluatorConfigFormPreset = {
  name: string;
  description: string;
  expectedValueType: "boolean" | "choice" | "range";
  choiceScores?: Array<{ score: number; description: string }>;
  rangeMin?: number;
  rangeMax?: number;
  model: (typeof modelOptions)[number];
};

export const PythonEvaluatorConfigForm: React.FC<{
  configFormParams: CompositeOption["preset"];
  name: string;
  existingEvaluatorId?: string;
  onSubmit: () => void;
  openTestPanel?: (testFunction: TestFunction) => void;
}> = ({
  configFormParams,
  name: defaultName,
  existingEvaluatorId,
  openTestPanel,
  onSubmit,
}) => {
  const notification = useNotification();
  const { invalidate } = useInvalidateEvaluators();

  const [text, setText] = useState<string>(configFormParams.code);
  const { setTestConfig: setTestData } = useTestDataStore();

  const jawn = useJawnClient();
  const [name, setName] = useState<string>(defaultName);
  useEffect(() => {
    setTestData({
      _type: "python",
      code: text,
      evaluator_name: name,
    });
  }, [text, configFormParams.testInput, setTestData, name]);

  return (
    <Col className="h-full flex flex-col gap-10">
      <Col className="h-full flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Enter evaluator name"
            value={name}
            onChange={(e) => {
              if (!/[^a-zA-Z0-9\s]+/g.test(e.target.value)) {
                setName(e.target.value);
              } else {
                notification.setNotification(
                  "Evaluator name can only contain letters and numbers.",
                  "error"
                );
              }
            }}
          />
        </div>
        <MarkdownEditor
          text={text}
          setText={setText}
          language={"python"}
          monaco={true}
        />

        <Button
          onClick={() =>
            openTestPanel &&
            openTestPanel(async () => {
              const result = await jawn.POST("/v1/evaluator/python/test", {
                body: {
                  code: text,
                  testInput: configFormParams.testInput!,
                },
              });
              if (result?.data?.data) {
                return {
                  ...(result?.data?.data ?? {}),
                  _type: "completed",
                };
              } else {
                return {
                  _type: "error",
                  error: result?.data?.error ?? "Unknown error - try again",
                };
              }
            })
          }
        >
          Test
        </Button>
      </Col>

      <Row>
        <Button
          variant={"secondary"}
          className="w-full"
          onClick={async () => {
            if (existingEvaluatorId) {
              jawn
                .PUT(`/v1/evaluator/{evaluatorId}`, {
                  params: {
                    path: {
                      evaluatorId: existingEvaluatorId,
                    },
                  },
                  body: {
                    code_template: {
                      code: text,
                    },
                    scoring_type: `PYTHON`,
                    name: name,
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
                    code_template: {
                      code: text,
                    },
                    scoring_type: `PYTHON`,
                    name: name,
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
