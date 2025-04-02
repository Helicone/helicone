import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import useNotification from "@/components/shared/notification/useNotification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { H4, Muted } from "@/components/ui/typography";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { testEvaluator } from "@/components/templates/evals/testing/test";
import { TestInput } from "@/components/templates/evals/CreateNewEvaluator/types";
import { TestConfig } from "@/components/templates/evals/testing/types";

interface TestDrawerProps {
  evaluatorId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TestDrawer({ evaluatorId, isOpen, onClose }: TestDrawerProps) {
  const [testMode, setTestMode] = useState<"requestId" | "manual">("requestId");
  const [requestId, setRequestId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("inputBody");
  const [isLoading, setIsLoading] = useState(false);
  const notification = useNotification();
  const jawn = useJawnClient();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Test data state
  const [inputBody, setInputBody] = useState("");
  const [outputBody, setOutputBody] = useState("");

  // Fetch latest request ID on initial load
  useQuery({
    queryKey: ["latestRequest"],
    queryFn: async () => {
      if (testMode !== "requestId") return null;

      try {
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
          // Only set request ID if it's currently empty, preventing resets
          if (!requestId) {
            setRequestId(requests.data?.data[0].request_id);
          }
          return requests.data?.data[0].request_id;
        }
      } catch (error) {
        console.error("Failed to fetch latest request", error);
      }
      return null;
    },
    enabled: isOpen && testMode === "requestId" && !requestId,
    staleTime: Infinity, // Don't refetch automatically
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Load request data when ID changes
  useQuery({
    queryKey: ["requestData", requestId],
    queryFn: async () => {
      if (!requestId) return null;

      try {
        const request = await jawn.GET("/v1/request/{requestId}", {
          params: {
            path: {
              requestId,
            },
            query: {
              includeBody: true,
            },
          },
        });

        if (request.data?.data) {
          const reqBody = request.data.data.request_body;
          const respBody = request.data.data.response_body;

          setInputBody(JSON.stringify(reqBody || {}, null, 2));
          setOutputBody(JSON.stringify(respBody || {}, null, 2));

          return request.data.data;
        }
      } catch (error) {
        console.error("Failed to fetch request data", error);
        notification.setNotification("Failed to fetch request data", "error");
      }
      return null;
    },
    enabled: !!requestId && testMode === "requestId",
  });

  // Query to fetch evaluator details
  const evaluatorQuery = useQuery({
    queryKey: ["evaluatorDetails", evaluatorId],
    queryFn: async () => {
      if (!evaluatorId) return null;

      const response = await jawn.GET("/v1/evaluator/{evaluatorId}", {
        params: {
          path: {
            evaluatorId,
          },
        },
      });

      return response.data?.data;
    },
    enabled: !!evaluatorId && isOpen,
  });

  // Handle test execution
  const handleRunTest = async () => {
    if (!evaluatorQuery.data) {
      notification.setNotification("Evaluator details not loaded", "error");
      return;
    }

    const evaluator = evaluatorQuery.data;

    try {
      setIsLoading(true);
      setResult({ _type: "running" });

      // Create test config based on evaluator type (only LLM is needed)
      const testConfig: TestConfig = {
        _type: "llm" as const,
        evaluator_scoring_type: evaluator.scoring_type || "boolean",
        evaluator_llm_template:
          typeof evaluator.llm_template === "string"
            ? evaluator.llm_template
            : JSON.stringify(evaluator.llm_template || {}),
        evaluator_name: evaluator.name || "Test Evaluator",
      };

      // Create test input
      let testInput: TestInput;

      if (testMode === "requestId") {
        // For request ID mode, we need to load the request data first
        if (!requestId) {
          throw new Error("Request ID is required");
        }

        const request = await jawn.GET("/v1/request/{requestId}", {
          params: {
            path: {
              requestId,
            },
            query: {
              includeBody: true,
            },
          },
        });

        if (!request.data?.data) {
          throw new Error("Failed to fetch request data");
        }

        const reqBody = request.data.data.request_body;
        const respBody = request.data.data.response_body;

        testInput = {
          inputBody: JSON.stringify(reqBody || {}, null, 2),
          outputBody: JSON.stringify(respBody || {}, null, 2),
          inputs: { inputs: {}, autoInputs: {} },
          promptTemplate: "",
        };
      } else {
        // For manual mode, use the input/output from the form
        // Parse JSON to validate format
        JSON.parse(inputBody || "{}");
        JSON.parse(outputBody || "{}");

        testInput = {
          inputBody,
          outputBody,
          inputs: { inputs: {}, autoInputs: {} },
          promptTemplate: "",
        };
      }

      // Use the testEvaluator function for both modes
      const res = await testEvaluator(testConfig, jawn, testInput);

      try {
        // Simplest case: handle direct JSON structure response
        const rawResponse = res as any; // Cast to any to avoid type errors

        if (
          rawResponse &&
          typeof rawResponse === "object" &&
          !rawResponse._type && // Not our standard response format
          rawResponse.data !== undefined &&
          rawResponse.error === null
        ) {
          // Handle cases where score is null but it's not an error ({"data":{"score":null},"error":null})
          if (
            typeof rawResponse.data === "object" &&
            rawResponse.data !== null &&
            "score" in rawResponse.data &&
            rawResponse.data.score === null
          ) {
            setResult({
              _type: "completed",
              output: "No score determined",
              traces: ["Evaluator returned null score"],
            });
            return;
          }

          // This is likely a {"data": true/false, "error": null} response
          const responseValue = rawResponse.data;
          const isBoolean = typeof responseValue === "boolean";

          setResult({
            _type: "completed",
            output: isBoolean
              ? responseValue
                ? "True"
                : "False"
              : JSON.stringify(responseValue),
            traces: ["Processed raw API response"],
          });
          return;
        }
      } catch (e) {
        console.error("Error parsing test response:", e);
      }

      // Check if we got a specific error about score not found
      if (
        res &&
        res._type === "error" &&
        "error" in res &&
        typeof res.error === "string" &&
        res.error.includes("No score found in")
      ) {
        // Try to extract and use the score from the error message
        try {
          const jsonMatch = res.error.match(/No score found in (.+)$/);
          if (jsonMatch && jsonMatch[1]) {
            const extractedJson = JSON.parse(jsonMatch[1]);

            // If it's an object, try to find a score value
            if (typeof extractedJson === "object" && extractedJson !== null) {
              // First, look for any key that contains the evaluator name (ignoring case)
              const evaluatorNameLower = evaluator.name.toLowerCase();
              let matchingKey = Object.keys(extractedJson).find((key) =>
                key.toLowerCase().includes(evaluatorNameLower)
              );

              // If no match by name, just take the first value
              if (!matchingKey && Object.keys(extractedJson).length > 0) {
                matchingKey = Object.keys(extractedJson)[0];
              }

              if (matchingKey) {
                const scoreValue = extractedJson[matchingKey];

                // Handle both boolean and numeric values
                if (typeof scoreValue === "boolean") {
                  setResult({
                    _type: "completed",
                    output: scoreValue.toString(),
                    traces: [
                      `Extracted score from key "${matchingKey}": ${scoreValue}`,
                    ],
                  });
                  return;
                } else if (typeof scoreValue === "number") {
                  // For LLM-BOOLEAN, convert numeric values to boolean (non-zero = true)
                  if (
                    evaluator.scoring_type === "boolean" ||
                    evaluator.scoring_type === "LLM-BOOLEAN"
                  ) {
                    const boolValue = scoreValue !== 0;
                    setResult({
                      _type: "completed",
                      output: boolValue.toString(),
                      traces: [
                        `Converted numeric score ${scoreValue} to boolean: ${boolValue}`,
                      ],
                    });
                    return;
                  } else {
                    // For numeric evaluators, use the value directly
                    setResult({
                      _type: "completed",
                      output: scoreValue.toString(),
                      traces: [
                        `Extracted score from key "${matchingKey}": ${scoreValue}`,
                      ],
                    });
                    return;
                  }
                }
              }
            }
          }
        } catch (jsonError) {
          // If parsing fails, continue with the original error
          console.error("Failed to parse score from error:", jsonError);
        }
      }

      // Use the original result if we didn't extract a score
      setResult(res);

      // Scroll to results after a short delay to ensure rendering is complete
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    } catch (error) {
      console.error("Error testing evaluator:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object"
          ? JSON.stringify(error, null, 2)
          : String(error || "Unknown error");

      setResult({
        _type: "error",
        error: errorMessage,
      });

      notification.setNotification(
        error instanceof SyntaxError
          ? "Invalid JSON format in input or output body"
          : errorMessage,
        "error"
      );

      // Scroll to results after an error too
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setResult(null);
    }
  }, [isOpen]);

  // If the drawer is closed, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-[500px] h-full bg-background border-l shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Test Evaluator</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="inline-flex rounded-md border bg-muted/30 p-0 h-9 w-full">
            <button
              className={`flex-1 text-sm rounded-l-md px-4 py-2 ${
                testMode === "requestId"
                  ? "bg-background border-r shadow-sm"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setTestMode("requestId")}
            >
              Request ID
            </button>
            <button
              className={`flex-1 text-sm rounded-r-md px-4 py-2 ${
                testMode === "manual"
                  ? "bg-background shadow-sm"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => setTestMode("manual")}
            >
              Custom Input
            </button>
          </div>
        </div>

        {/* Scrollable Content Area - Explicit calc height considering the header + mode selector + button height */}
        <div
          className="overflow-y-auto flex-1"
          style={{ height: "calc(100% - 188px)" }}
        >
          {/* Request ID Input */}
          {testMode === "requestId" && (
            <div className="p-4 space-y-2">
              <label htmlFor="request-id" className="text-sm font-medium block">
                Request ID
              </label>
              <Input
                id="request-id"
                placeholder="Enter request ID"
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the ID of a request to test the evaluator against
              </p>
            </div>
          )}

          {/* Manual Input Interface */}
          {testMode === "manual" && (
            <div className="p-4 space-y-3">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="w-full grid grid-cols-2 bg-muted/30 p-0 h-9">
                  <TabsTrigger value="inputBody" className="text-xs">
                    Input Body
                  </TabsTrigger>
                  <TabsTrigger value="outputBody" className="text-xs">
                    Output Body
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="inputBody"
                  className="mt-2 border rounded-md bg-background overflow-hidden"
                >
                  <div className="h-[250px]">
                    <MarkdownEditor
                      className="text-sm h-full border-0"
                      text={inputBody}
                      setText={setInputBody}
                      language="json"
                      monaco={true}
                    />
                  </div>
                </TabsContent>

                <TabsContent
                  value="outputBody"
                  className="mt-2 border rounded-md bg-background overflow-hidden"
                >
                  <div className="h-[250px]">
                    <MarkdownEditor
                      className="text-sm h-full border-0"
                      text={outputBody}
                      setText={setOutputBody}
                      language="json"
                      monaco={true}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Results Section - Only shown when there are results */}
          {result && (
            <div className="p-4 border-t" ref={resultsRef}>
              <h3 className="text-sm font-medium mb-3">Test Results</h3>
              <div className="border rounded-md bg-background p-3 overflow-y-auto max-h-[180px]">
                {isLoading ? (
                  <div className="text-center py-4">
                    <Muted>Running test...</Muted>
                  </div>
                ) : result._type === "error" &&
                  result.error &&
                  result.error.includes("Unknown error - try again") ? (
                  <div className="bg-muted p-3 rounded-md flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <H4 className="text-sm">Score</H4>
                      <div className="text-lg font-semibold">True</div>
                    </div>
                  </div>
                ) : result._type === "error" ? (
                  <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <H4 className="text-sm text-destructive">Error</H4>
                      <pre className="text-xs mt-1 whitespace-pre-wrap">
                        {typeof result.error === "object"
                          ? JSON.stringify(result.error, null, 2)
                          : result.error}
                      </pre>
                    </div>
                  </div>
                ) : result._type === "completed" ? (
                  <div className="bg-muted p-3 rounded-md flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <H4 className="text-sm">Score</H4>
                      <div className="text-lg font-semibold">
                        {result.output}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted p-3 rounded-md flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <H4 className="text-sm">Score</H4>
                      <div className="text-lg font-semibold">
                        {typeof result.data === "boolean"
                          ? result.data
                            ? "True"
                            : "False"
                          : typeof result.data === "number"
                          ? result.data
                          : result.data?.score !== undefined
                          ? result.data.score
                          : JSON.stringify(result.data)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Button - Fixed position */}
        <div className="h-[68px] p-3 border-t bg-background flex-shrink-0">
          <Button
            onClick={handleRunTest}
            disabled={
              isLoading ||
              (testMode === "requestId" && !requestId) ||
              (testMode === "manual" && (!inputBody || !outputBody))
            }
            className="w-full gap-2"
          >
            <PlayCircle className="h-4 w-4" />
            {isLoading ? "Testing..." : "Run Test"}
          </Button>
        </div>
      </div>
    </div>
  );
}
