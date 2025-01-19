import { Button } from "@/components/ui/button";

import { Col, Row } from "@/components/layout/common";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { testEvaluator } from "@/components/templates/evals/testing/test";
import { useTestDataStore } from "@/components/templates/evals/testing/testingStore";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJawnClient } from "@/lib/clients/jawnHook";
import clsx from "clsx";
import MarkdownEditor from "../../../../shared/markdownEditor";
import { EvaluatorTestResult } from "../types";
import { PreviewLastMile } from "./PreviewLastMile";
import { useQuery } from "@tanstack/react-query";
import { HeliconeRequest } from "@/lib/api/request/request";
import { Label } from "@/components/ui/label";

export function TestEvaluator() {
  const { testConfig, setTestConfig, testInput, setTestInput } =
    useTestDataStore();

  const [promptTemplate, setPromptTemplate] = useState<string | undefined>(
    testInput?.promptTemplate ?? ""
  );
  const [result, setResult] = useState<EvaluatorTestResult>(null);
  const [activeTab, setActiveTab] = useState("inputs");

  const jawn = useJawnClient();

  const [requestId, setRequestId] = useState<string | undefined>(undefined);

  useQuery({
    queryKey: ["testInputs", requestId],
    queryFn: async () => {
      if (!requestId) {
        const requests = await jawn.POST("/v1/request/query-clickhouse", {
          body: {
            filter: "all",
            limit: 1,
            sort: {
              created_at: "desc",
            },
          },
        });
        if (requests.data?.data && requests.data?.data.length > 0) {
          setRequestId(requests.data?.data[0].request_id);
        }
        return;
      }

      const request = await jawn.GET("/v1/request/{requestId}", {
        params: {
          path: {
            requestId: requestId,
          },
          query: {
            includeBody: true,
          },
        },
      });

      setTestInput({
        inputBody: JSON.stringify(
          request.data?.data?.request_body ?? {},
          undefined,
          4
        ),
        inputs: {
          inputs: {},
          autoInputs: {},
        },
        outputBody: JSON.stringify(
          request.data?.data?.response_body ?? {},
          undefined,
          4
        ),
        promptTemplate: "",
      });
    },
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  return (
    <div>
      <Row className="gap-5 items-center justify-end">
        <Label className="whitespace-nowrap">Request Id: </Label>
        <Input
          placeholder="Request Id"
          className="w-fit"
          value={requestId}
          onChange={(e) => {
            setRequestId(e.target.value);
          }}
        ></Input>
      </Row>
      <Row className="justify-between gap-10">
        <Col className="h-full flex flex-col gap-2 w-full">
          <Tabs
            defaultValue="inputs"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList>
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              {promptTemplate !== undefined && (
                <TabsTrigger value="prompt">Prompt Template</TabsTrigger>
              )}
              <TabsTrigger value="inputBody">Input Body</TabsTrigger>
              <TabsTrigger value="outputBody">Output Body</TabsTrigger>
            </TabsList>

            <TabsContent value="inputs" className="space-y-4 mt-4">
              {Object.entries(testInput?.inputs?.inputs ?? []).map(
                ([key, value], i) => (
                  <div key={`input-${i}`} className="flex items-center gap-2">
                    <Input
                      value={key}
                      onChange={(e) => {
                        const newKey = e.target.value;
                        setTestInput((prev) => {
                          if (!prev) return prev;

                          const newInputs = { ...prev.inputs.inputs };
                          delete newInputs[key];
                          newInputs[newKey] = value;
                          return {
                            ...prev,
                            inputs: {
                              ...prev.inputs,
                              inputs: newInputs,
                              autoInputs: prev.inputs.autoInputs,
                            },
                          };
                        });
                      }}
                      className="max-w-[200px]"
                    />
                    <span>:</span>
                    <Input
                      value={value}
                      onChange={(e) => {
                        setTestInput((prev) => {
                          if (!prev) return prev;
                          const newInputs = {
                            ...prev.inputs.inputs,
                            [key]: e.target.value,
                          };
                          return {
                            ...prev,
                            inputs: {
                              ...prev.inputs,
                              inputs: newInputs,
                              autoInputs: prev.inputs.autoInputs,
                            },
                          };
                        });
                      }}
                      className="max-w-[300px]"
                    />
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setTestInput((prev) => {
                          if (!prev) return prev;
                          const newInputs = {
                            ...prev.inputs.inputs,
                          };
                          delete newInputs[key];
                          return {
                            ...prev,
                            inputs: {
                              inputs: newInputs,
                              autoInputs: prev.inputs.autoInputs,
                            },
                          };
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                )
              )}
              <div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setTestInput((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        inputs: {
                          inputs: { ...prev.inputs.inputs, "": "" },
                          autoInputs: prev.inputs.autoInputs,
                        },
                      };
                    });
                  }}
                >
                  + Add Input
                </Button>
              </div>
            </TabsContent>

            {promptTemplate !== undefined && (
              <TabsContent value="prompt" className="space-y-4 mt-4">
                <MarkdownEditor
                  className="border rounded-lg text-sm"
                  text={promptTemplate}
                  setText={setPromptTemplate}
                  language="json"
                  monaco={false}
                />
              </TabsContent>
            )}

            <TabsContent value="inputBody" className="space-y-4 mt-4">
              <MarkdownEditor
                className="border rounded-lg text-sm"
                text={testInput?.inputBody ?? ""}
                setText={(text) => {
                  setTestInput((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      inputBody: text,
                    };
                  });
                }}
                language="json"
                monaco={false}
              />
            </TabsContent>

            <TabsContent value="outputBody" className="space-y-4 mt-4">
              <MarkdownEditor
                className="border rounded-lg text-sm"
                text={testInput?.outputBody ?? ""}
                setText={(text) => {
                  setTestInput((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      outputBody: text,
                    };
                  });
                }}
                language="json"
                monaco={false}
              />
            </TabsContent>
          </Tabs>
        </Col>
      </Row>

      {testConfig?._type === "llm" && (
        <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
          <CollapsibleTrigger>
            <Row className="items-center gap-2">
              Preview Function{" "}
              <ChevronDown
                className={clsx("w-4 h-4 transition-transform", {
                  "rotate-180": previewOpen,
                })}
              />
            </Row>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <MarkdownEditor
              className="border rounded-lg text-sm"
              text={
                testConfig?._type === "llm"
                  ? testConfig?.evaluator_llm_template
                  : ""
              }
              setText={() => {}}
              disabled
              language="json"
              monaco={false}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      {testConfig?._type === "lastmile" && testInput && (
        <PreviewLastMile
          testDataConfig={testConfig.config}
          testInput={testInput}
        />
      )}
      <Col className="gap-2">
        <h2 className="text-lg font-medium">Output</h2>

        <div className="flex flex-col gap-2 min-h-[100px] bg-gray-300 p-2 rounded-md w-full">
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
        </div>
      </Col>
      <Row className="justify-end gap-10 py-4">
        <Button
          onClick={async () => {
            if (!testConfig) return;
            setResult({ _type: "running" });
            const rez = await testEvaluator(testConfig, jawn);
            setResult(rez);
          }}
        >
          Test (Run)
        </Button>
      </Row>
    </div>
  );
}
