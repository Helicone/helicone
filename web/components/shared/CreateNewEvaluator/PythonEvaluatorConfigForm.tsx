import { Button } from "@/components/ui/button";
import { useJawnClient } from "@/lib/clients/jawnHook";

import { Col, Row } from "@/components/layout/common";
import React, { useState } from "react";
import MarkdownEditor from "../markdownEditor";
import useNotification from "../notification/useNotification";
import { TestEvaluator } from "./components/TestEvaluator";
import { CompositeOption } from "./EvaluatorTypeDropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  onSubmit: (evaluatorId: string) => void;
  existingEvaluatorId?: string;
}> = ({
  configFormParams,
  onSubmit,
  name: defaultName,
  existingEvaluatorId,
}) => {
  const notification = useNotification();

  const [text, setText] = useState<string>(configFormParams.code);

  const jawn = useJawnClient();
  const [name, setName] = useState<string>(defaultName);

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

        {configFormParams.testInput && (
          <TestEvaluator
            defaultTest={configFormParams.testInput}
            test={async () => {
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
            }}
          />
        )}
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
                    onSubmit(res.data.data.id);
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
