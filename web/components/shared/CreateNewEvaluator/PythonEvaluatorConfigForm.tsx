import { Button } from "@/components/ui/button";
import { useJawnClient } from "@/lib/clients/jawnHook";

import { Col, Row } from "@/components/layout/common";
import React, { useState } from "react";
import MarkdownEditor from "../markdownEditor";
import useNotification from "../notification/useNotification";
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

  const jawn = useJawnClient();
  const [text, setText] = useState<string>(configFormParams.code);

  const [result, setResult] = useState<
    | {
        output: string;
        traces: string[];
        statusCode?: number;
        _type: "completed";
      }
    | {
        _type: "running";
      }
    | {
        _type: "error";
        error: string;
      }
    | null
  >(null);
  return (
    <Col className="h-full flex flex-col">
      <MarkdownEditor
        text={text}
        setText={setText}
        language={"python"}
        monaco={true}
      />
      <div>
        {" "}
        {result?._type === "running" && <div>Running...</div>}
        {result?._type === "completed" && (
          <div>
            <div>{result.output}</div>
            <div>{result.traces.join("\n")}</div>
          </div>
        )}
        {result?._type === "error" && <div>{result.error}</div>}
      </div>
      <Row className="justify-between">
        <Button
          variant="outline"
          onClick={async () => {
            setResult({ _type: "running" });
            const result = await jawn.POST("/v1/evaluator/python/test", {
              body: {
                code: text,
                requestBodyString: configFormParams.testInput,
                responseString: configFormParams.testOutput,
              },
            });
            if (result?.data?.data) {
              setResult({
                ...(result?.data?.data ?? {}),
                _type: "completed",
              });
            } else {
              setResult({
                _type: "error",
                error: result?.data?.error ?? "Unknown error",
              });
            }
          }}
        >
          Test
        </Button>

        <Button>Submit</Button>
      </Row>
    </Col>
  );
};
