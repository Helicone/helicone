import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
import MarkdownEditor from "../../../../shared/markdownEditor";
import { EvaluatorTestResult } from "../types";
import { H4, Muted } from "@/components/ui/typography";
import { AlertCircle, CheckCircle2, PlayCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function TestEvaluator() {
  const { testConfig, setTestConfig, testInput, setTestInput } =
    useTestDataStore();

  const [promptTemplate, setPromptTemplate] = useState<string | undefined>(
    testInput?.promptTemplate ?? ""
  );
  const [result, setResult] = useState<EvaluatorTestResult>(null);
  const [activeTab, setActiveTab] = useState("inputBody");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Input Area */}
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-4">
          {/* Request ID Input */}
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap text-sm font-medium">
              Request ID
            </Label>
            <Input
              placeholder="Enter request ID"
              className="flex-grow"
              value={requestId}
              onChange={(e) => {
                setRequestId(e.target.value);
              }}
            />
          </div>

          {/* Test Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Test Input</h3>
            </div>

            <Tabs
              defaultValue="inputBody"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-4 bg-muted/30 p-0 h-9">
                <TabsTrigger value="inputBody" className="text-xs">
                  Input Body
                </TabsTrigger>
                <TabsTrigger value="outputBody" className="text-xs">
                  Output Body
                </TabsTrigger>
                <TabsTrigger value="inputs" className="text-xs">
                  Input Variables
                </TabsTrigger>
                {promptTemplate !== undefined && (
                  <TabsTrigger value="prompt" className="text-xs">
                    Prompt Template
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent
                value="inputs"
                className="mt-2 space-y-2 border rounded-md p-3 bg-background"
              >
                {Object.entries(testInput?.inputs?.inputs ?? []).length ===
                0 ? (
                  <div className="text-center py-2">
                    <Muted>No input variables defined</Muted>
                    <Button
                      variant="outline"
                      size="sm"
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
                      className="mt-2"
                    >
                      + Add Input Variable
                    </Button>
                  </div>
                ) : (
                  <>
                    {Object.entries(testInput?.inputs?.inputs ?? []).map(
                      ([key, value], i) => (
                        <div
                          key={`input-${i}`}
                          className="flex items-center gap-2"
                        >
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
                            placeholder="Variable name"
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
                            className="flex-grow"
                            placeholder="Value"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
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
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="sm"
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
                      className="mt-1"
                    >
                      + Add Input Variable
                    </Button>
                  </>
                )}
              </TabsContent>

              {promptTemplate !== undefined && (
                <TabsContent
                  value="prompt"
                  className="mt-2 border rounded-md bg-background"
                >
                  <MarkdownEditor
                    className="text-sm min-h-[300px] border-0"
                    text={promptTemplate}
                    setText={setPromptTemplate}
                    language="json"
                    monaco={false}
                  />
                </TabsContent>
              )}

              <TabsContent
                value="inputBody"
                className="mt-2 border rounded-md bg-background"
              >
                <MarkdownEditor
                  className="text-sm min-h-[300px] border-0"
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

              <TabsContent
                value="outputBody"
                className="mt-2 border rounded-md bg-background"
              >
                <MarkdownEditor
                  className="text-sm min-h-[300px] border-0"
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
          </div>
        </div>
      </ScrollArea>

      {/* Fixed Results Section */}
      <div className="shrink-0 border-t bg-muted/10">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Test Results</h3>
            <Button
              onClick={async () => {
                if (!testConfig) return;
                setLoading(true);
                setResult({ _type: "running" });
                try {
                  const res = await testEvaluator(testConfig, jawn, testInput);
                  setResult(res);
                } catch (e) {
                  setResult({
                    _type: "error",
                    error: e instanceof Error ? e.message : "Unknown error",
                  });
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              size="sm"
              className="gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              {loading ? "Running..." : "Run Test"}
            </Button>
          </div>

          <div className="max-h-[180px] overflow-y-auto border rounded-md bg-background p-3">
            {result === null ? (
              <div className="text-center py-4">
                <Muted>Run a test to see results</Muted>
              </div>
            ) : result._type === "running" ? (
              <div className="text-center py-4">
                <Muted>Running test...</Muted>
              </div>
            ) : result._type === "error" ? (
              <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <H4 className="text-sm text-destructive">Error</H4>
                  <pre className="text-xs mt-1 whitespace-pre-wrap">
                    {result.error}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-md flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <H4 className="text-sm">Score</H4>
                    <div className="text-lg font-semibold">{result.output}</div>
                  </div>
                </div>

                {result.traces && result.traces.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-2 text-sm">
                      <span>View Execution Traces</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {result.traces.map((trace, i) => (
                        <div key={i} className="rounded-md border p-2">
                          <pre className="text-xs whitespace-pre-wrap">
                            {trace}
                          </pre>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
