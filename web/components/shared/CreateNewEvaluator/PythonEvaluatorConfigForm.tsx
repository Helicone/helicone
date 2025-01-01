import { Button } from "@/components/ui/button";
import { useJawnClient } from "@/lib/clients/jawnHook";

import { Col, Row } from "@/components/layout/common";
import React, { useState } from "react";
import MarkdownEditor from "../markdownEditor";
import useNotification from "../notification/useNotification";
import { TestEvaluator } from "./components/TestEvaluator";
import { CompositeOption } from "./EvaluatorTypeDropdown";

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
}> = ({ configFormParams }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const notification = useNotification();

  const [text, setText] = useState<string>(configFormParams.code);

  const jawn = useJawnClient();

  return (
    <Col className="h-full flex flex-col gap-10">
      <Col className="h-full flex flex-col gap-5">
        <MarkdownEditor
          text={text}
          setText={setText}
          language={"python"}
          monaco={true}
        />

        <TestEvaluator
          defaultTest={configFormParams.testInput}
          test={async () => {
            const result = await jawn.POST("/v1/evaluator/python/test", {
              body: {
                code: text,
                testInput: configFormParams.testInput,
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
      </Col>

      <Row>
        <Button
          variant={"secondary"}
          className="w-full"
          onClick={async () => {}}
        >
          Save
        </Button>
      </Row>
    </Col>
  );
};
