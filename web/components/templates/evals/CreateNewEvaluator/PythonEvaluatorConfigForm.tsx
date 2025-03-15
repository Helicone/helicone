import { Col } from "@/components/layout/common";
import { useInvalidateEvaluators } from "@/components/templates/evals/EvaluatorHook";
import { useTestDataStore } from "@/components/templates/evals/testing/testingStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useEffect } from "react";
import MarkdownEditor from "@/components/shared/markdownEditor";
import useNotification from "../../../shared/notification/useNotification";
import { useEvalPanelStore } from "../store/evalPanelStore";
import { CompositeOption, TestFunction } from "../testing/types";
import { useEvalFormStore } from "../store/evalFormStore";
import { useEvalConfigStore } from "../store/evalConfigStore";
import { H3, Muted } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";

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
  const jawn = useJawnClient();
  const invalidateEvaluators = useInvalidateEvaluators();
  const { setTestConfig } = useTestDataStore();
  const { isSubmitting, hideFormButtons } = useEvalFormStore();

  // Use the config store
  const {
    pythonName,
    setPythonName,
    pythonDescription,
    setPythonDescription,
    pythonCode,
    setPythonCode,
  } = useEvalConfigStore();

  // Initialize the store with default values if needed
  useEffect(() => {
    if (!pythonName && defaultName) {
      setPythonName(defaultName);
    }
    if (!pythonDescription && configFormParams.description) {
      setPythonDescription(configFormParams.description);
    }
    if (!pythonCode && configFormParams.code) {
      setPythonCode(configFormParams.code);
    }
  }, [
    defaultName,
    configFormParams,
    pythonName,
    setPythonName,
    pythonDescription,
    setPythonDescription,
    pythonCode,
    setPythonCode,
  ]);

  const evalPanelStore = useEvalPanelStore();

  useEffect(() => {
    setTestConfig({
      _type: "python",
      evaluator_name: pythonName,
      code: pythonCode,
    });
  }, [pythonName, pythonCode, setTestConfig]);

  const handleSubmit = async () => {
    // We don't need to set isSubmitting here as it's handled by the mutation hook
    try {
      if (existingEvaluatorId) {
        const result = await jawn.PUT("/v1/evaluator/{evaluatorId}", {
          params: {
            path: {
              evaluatorId: existingEvaluatorId,
            },
          },
          body: {
            name: pythonName,
            description: pythonDescription,
            code_template: { code: pythonCode },
            scoring_type: "PYTHON",
          },
        });
        if (!result.data?.data) {
          notification.setNotification("Failed to update evaluator", "error");
        } else {
          notification.setNotification(
            "Evaluator updated successfully",
            "success"
          );
          invalidateEvaluators.invalidate();
          onSubmit();
        }
      } else {
        const result = await jawn.POST("/v1/evaluator", {
          body: {
            name: pythonName,
            description: pythonDescription,
            code_template: {
              code: pythonCode,
            },
            scoring_type: "PYTHON",
          },
        });
        if (!result.data?.data) {
          notification.setNotification("Failed to create evaluator", "error");
        } else {
          notification.setNotification(
            "Evaluator created successfully",
            "success"
          );
          invalidateEvaluators.invalidate();
          onSubmit();
        }
      }
    } catch (error) {
      console.error("Error submitting Python evaluator:", error);
      notification.setNotification("An error occurred", "error");
    }
  };

  const handleTest = () => {
    const testFunction = async () => {
      const result = await jawn.POST("/v1/evaluator/python/test", {
        body: {
          code: pythonCode,
          testInput: configFormParams.testInput!,
        },
      });
      if (result?.data?.data) {
        return {
          ...(result?.data?.data ?? {}),
          _type: "completed" as const,
        };
      } else {
        return {
          _type: "error" as const,
          error: result?.data?.error ?? "Unknown error - try again",
        };
      }
    };

    if (openTestPanel) {
      openTestPanel(testFunction);
    } else {
      // Set test data first
      setTestConfig({
        _type: "python",
        evaluator_name: pythonName,
        code: pythonCode,
      });
      // Then open the test panel
      evalPanelStore.openTestPanel();
    }
  };

  return (
    <Col className="h-full flex flex-col overflow-hidden">
      <ScrollArea className="flex-grow overflow-y-auto">
        <div className="px-4 py-4">
          <Col className="space-y-6">
            <div>
              <div className="flex items-baseline gap-2">
                <H3 className="text-lg">Basic Information</H3>
                <Muted className="text-sm">
                  Define your evaluator&apos;s name and purpose
                </Muted>
              </div>
              <Separator className="my-2" />
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Evaluator Name</Label>
                  <Input
                    id="name"
                    value={pythonName}
                    onChange={(e) => setPythonName(e.target.value)}
                    placeholder="Enter a name for your evaluator"
                    readOnly={!!existingEvaluatorId}
                    disabled={!!existingEvaluatorId}
                  />
                  {existingEvaluatorId && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Evaluator names cannot be changed after creation
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={pythonDescription}
                    onChange={(e) => setPythonDescription(e.target.value)}
                    placeholder="Describe what your evaluator does"
                    className="min-h-[100px]"
                  />
                  <Muted className="text-xs">
                    Descriptions are used by the LLM to understand what the
                    evaluator does.
                  </Muted>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <H3 className="text-lg">Python Code</H3>
                <Muted className="text-sm">
                  Write your evaluator&apos;s Python code
                </Muted>
              </div>
              <Separator className="my-2" />

              <MarkdownEditor
                text={pythonCode}
                setText={setPythonCode}
                language={"python"}
                monaco={true}
                className="min-h-[300px] border rounded-md"
              />
            </div>
          </Col>
        </div>
      </ScrollArea>
    </Col>
  );
};
