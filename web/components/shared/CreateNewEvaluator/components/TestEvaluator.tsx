import { Button } from "@/components/ui/button";

import { Col, Row } from "@/components/layout/common";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { EvaluatorTestResult, TestInput } from "../types";
import MarkdownEditor from "../../markdownEditor";
import { ScrollBar } from "@/components/ui/scroll-area";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface TestEvaluatorProps {
  defaultTest: TestInput;
  test: (testInputs: TestInput) => Promise<EvaluatorTestResult>;
}

export function TestEvaluator(props: TestEvaluatorProps) {
  const [testInput, setTestInput] = useState<string>(
    props.defaultTest.inputBody
  );
  const [testOutput, setTestOutput] = useState<string>(
    props.defaultTest.outputBody
  );

  const [inputs, setInputs] = useState<Record<string, string>>(
    props.defaultTest.inputs.inputs
  );

  const [promptTemplate, setPromptTemplate] = useState<string | undefined>(
    props.defaultTest.prompt
  );
  const [result, setResult] = useState<EvaluatorTestResult>(null);

  return (
    <div>
      <Row className="justify-between gap-10">
        {result ? (
          <Collapsible defaultOpen={true}>
            <CollapsibleTrigger className="flex items-center gap-2">
              Ouput
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              {result?._type === "running" && <div>Running...</div>}
              {result?._type === "completed" && (
                <div>
                  <div className="font-mono whitespace-pre-wrap bg-gray-100 p-2 rounded-md">
                    {result.output}
                  </div>
                  {result.traces.join("\n").trim().length > 0 && (
                    <>
                      <div>Traces:</div>
                      <div className="font-mono whitespace-pre-wrap bg-gray-100 p-2 rounded-md">
                        {result.traces.join("\n")}
                      </div>
                    </>
                  )}
                </div>
              )}
              {result?._type === "error" && <div>{result.error}</div>}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div></div>
        )}
        <Button
          onClick={async () => {
            setResult({ _type: "running" });
            const rez = await props.test({
              inputBody: testInput,
              inputs: {
                inputs,
                autoInputs: {},
              },
              outputBody: testOutput,
              prompt: "",
            });
            setResult(rez);
          }}
        >
          Test (Run)
        </Button>
      </Row>
      <Row className="justify-between gap-10">
        <Col className="h-full flex flex-col gap-2 w-full ">
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4" />
              Test Data
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <Collapsible defaultOpen={true}>
                <CollapsibleTrigger className="flex items-center gap-2 ml-2">
                  inputs
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  {Object.entries(inputs).map(([key, value], i) => (
                    <div key={`input-${i}`} className="flex items-center gap-2">
                      <Input
                        value={key}
                        onChange={(e) => {
                          const newKey = e.target.value;
                          setInputs((prev) => {
                            const newInputs = { ...prev };
                            delete newInputs[key];
                            newInputs[newKey] = value;
                            return newInputs;
                          });
                        }}
                        className="max-w-[200px]"
                      />
                      <span>:</span>
                      <Input
                        value={value}
                        onChange={(e) => {
                          setInputs((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }));
                        }}
                        className="max-w-[300px]"
                      />
                      <Button
                        variant={"ghost"}
                        onClick={() =>
                          setInputs((prev) => {
                            const newInputs = { ...prev };
                            delete newInputs[key];
                            return newInputs;
                          })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                  <div>
                    <Button
                      variant={"ghost"}
                      onClick={() => {
                        setInputs((prev) => ({ ...prev, "": "" }));
                      }}
                    >
                      + Add Input
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              {promptTemplate !== undefined && (
                <Collapsible defaultOpen={true}>
                  <CollapsibleTrigger className="flex items-center gap-2 ml-2">
                    Prompt template
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <MarkdownEditor
                      className="border rounded-lg text-sm"
                      text={promptTemplate}
                      setText={setPromptTemplate}
                      language="json"
                      monaco={false}
                    />
                  </CollapsibleContent>
                </Collapsible>
              )}
              <Collapsible defaultOpen={true}>
                <CollapsibleTrigger className="flex items-center gap-2 ml-2">
                  input body
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <MarkdownEditor
                    className="border rounded-lg text-sm"
                    text={testInput}
                    setText={setTestInput}
                    language="json"
                    monaco={false}
                  />
                </CollapsibleContent>
              </Collapsible>
              <Collapsible defaultOpen={true}>
                <CollapsibleTrigger className="flex items-center gap-2 ml-2">
                  output body
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <MarkdownEditor
                    className="border rounded-lg text-sm"
                    text={testOutput}
                    setText={setTestOutput}
                    language="json"
                    monaco={false}
                  />
                </CollapsibleContent>
              </Collapsible>
            </CollapsibleContent>
          </Collapsible>
        </Col>
      </Row>
    </div>
  );
}
