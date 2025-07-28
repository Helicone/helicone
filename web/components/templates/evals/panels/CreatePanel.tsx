import { Col, Row } from "@/components/layout/common";
import { LLMEvaluatorConfigForm } from "@/components/templates/evals/CreateNewEvaluator/LLMEvaluatorConfigForm";
import { PythonEvaluatorConfigForm } from "@/components/templates/evals/CreateNewEvaluator/PythonEvaluatorConfigForm";
import { COMPOSITE_OPTIONS } from "@/components/templates/evals/testing/examples";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XIcon } from "lucide-react";
import { LastMileDevConfigForm } from "../CreateNewEvaluator/LastMileDevConfigForm";

import { devtools, persist } from "zustand/middleware";
import { create } from "zustand";
import { useEvalPanelStore } from "../store/evalPanelStore";
import { useEvalFormStore } from "../store/evalFormStore";
import { useEvalConfigStore } from "../store/evalConfigStore";
import { H3 } from "@/components/ui/typography";
import { useEffect } from "react";
import {
  useLLMEvaluatorSubmit,
  usePythonEvaluatorSubmit,
  useLastMileEvaluatorSubmit,
} from "../hooks/useEvaluatorSubmit";
import { useTestDataStore } from "../testing/testingStore";

export const useCreatePanelTabs = create<{
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}>()(
  devtools(
    persist(
      (set) => ({
        selectedTab: "llm-as-a-judge",
        setSelectedTab: (tab) => set({ selectedTab: tab }),
      }),
      {
        name: "create-panel-tabs",
      },
    ),
  ),
);

export const CreatePanel = () => {
  const { selectedTab, setSelectedTab } = useCreatePanelTabs();
  const { resetPanels, openTestPanel } = useEvalPanelStore();
  const { isSubmitting, setHideFormButtons } = useEvalFormStore();

  // Access test data store to update test config when tabs change
  const { setTestConfig } = useTestDataStore();

  // Get config state from the store
  const {
    llmConfig,
    llmTemplate,
    pythonName,
    pythonDescription,
    pythonCode,
    lastMileName,
    lastMileDescription,
    lastMileConfig,
  } = useEvalConfigStore();

  // Create mutation hooks for each evaluator type
  const llmSubmit = useLLMEvaluatorSubmit(() => resetPanels());
  const pythonSubmit = usePythonEvaluatorSubmit(() => resetPanels());
  const lastMileSubmit = useLastMileEvaluatorSubmit(() => resetPanels());

  // Hide the form buttons when this component mounts
  useEffect(() => {
    setHideFormButtons(true);
    return () => {
      // Show the form buttons when this component unmounts
      setHideFormButtons(false);
    };
  }, [setHideFormButtons]);

  // Update test config when selected tab changes
  useEffect(() => {
    // Set the appropriate test config based on the selected tab
    if (selectedTab === "llm-as-a-judge") {
      setTestConfig({
        _type: "llm",
        evaluator_llm_template: llmTemplate,
        evaluator_scoring_type: llmConfig.expectedValueType,
        evaluator_name: llmConfig.name || "evaluator",
      });
    } else if (selectedTab === "python") {
      setTestConfig({
        _type: "python",
        evaluator_name: pythonName || "Python Evaluator",
        code: pythonCode,
      });
    } else if (selectedTab === "lastmile") {
      setTestConfig({
        _type: "lastmile",
        evaluator_name: lastMileName || "LastMile Evaluator",
        config: lastMileConfig,
      });
    }
  }, [
    selectedTab,
    setTestConfig,
    llmTemplate,
    llmConfig,
    pythonName,
    pythonCode,
    lastMileName,
    lastMileConfig,
  ]);

  const handleTest = () => {
    // Update test data based on current tab before opening test panel
    if (selectedTab === "llm-as-a-judge") {
      setTestConfig({
        _type: "llm",
        evaluator_llm_template: llmTemplate,
        evaluator_scoring_type: llmConfig.expectedValueType,
        evaluator_name: llmConfig.name || "LLM Evaluator",
      });
    } else if (selectedTab === "python") {
      setTestConfig({
        _type: "python",
        evaluator_name: pythonName || "Python Evaluator",
        code: pythonCode,
      });
    } else if (selectedTab === "lastmile") {
      setTestConfig({
        _type: "lastmile",
        evaluator_name: lastMileName || "LastMile Evaluator",
        config: lastMileConfig,
      });
    }

    // Open the test panel after updating test data
    openTestPanel();
  };

  const handleCreate = () => {
    // Submit the appropriate form based on the selected tab
    if (selectedTab === "llm-as-a-judge") {
      llmSubmit.mutate({
        configFormParams: llmConfig,
        openAIFunction: llmTemplate,
      });
    } else if (selectedTab === "python") {
      pythonSubmit.mutate({
        name: pythonName,
        description: pythonDescription,
        code: pythonCode,
      });
    } else if (selectedTab === "lastmile") {
      lastMileSubmit.mutate({
        name: lastMileName,
        description: lastMileDescription,
        config: lastMileConfig,
      });
    }
  };

  return (
    <Col className="flex h-full flex-col overflow-hidden bg-background">
      <Row className="shrink-0 items-center justify-between border-b bg-muted/30 px-4 py-2">
        <H3 className="text-lg font-medium">Create new evaluator</H3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            resetPanels();
          }}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </Row>
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="flex flex-grow flex-col overflow-hidden"
      >
        <TabsList className="flex w-full justify-start space-x-2 bg-muted/30 px-4 py-2">
          <TabsTrigger value="llm-as-a-judge" className="text-xs">
            LLM-as-a-judge
          </TabsTrigger>
          <TabsTrigger value="python" className="text-xs">
            Python
          </TabsTrigger>
          <TabsTrigger value="lastmile" className="text-xs">
            LastMile AutoEval
          </TabsTrigger>
        </TabsList>
        <div className="flex flex-grow flex-col overflow-hidden">
          <TabsContent
            value="llm-as-a-judge"
            className="m-0 h-full p-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <LLMEvaluatorConfigForm
              onSubmit={() => {
                resetPanels();
              }}
              openTestPanel={() => {
                openTestPanel();
              }}
            />
          </TabsContent>
          <TabsContent
            value="python"
            className="m-0 h-full p-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <PythonEvaluatorConfigForm
              onSubmit={() => {
                resetPanels();
              }}
              openTestPanel={() => {
                openTestPanel();
              }}
              configFormParams={COMPOSITE_OPTIONS[0].preset}
              name={COMPOSITE_OPTIONS[0].name}
              key={COMPOSITE_OPTIONS[0].name + "python"}
            />
          </TabsContent>
          <TabsContent
            value="lastmile"
            className="m-0 h-full p-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <LastMileDevConfigForm
              onSubmit={() => {
                resetPanels();
              }}
              openTestPanel={() => {
                openTestPanel();
              }}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Sticky Footer */}
      <div className="flex shrink-0 items-center justify-between border-t bg-muted/10 p-4">
        <div>
          {/* Left side empty or could include form validation indicators */}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleTest}>
            Test Evaluator
          </Button>
          <Button
            variant="default"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleCreate}
            disabled={
              isSubmitting ||
              llmSubmit.isPending ||
              pythonSubmit.isPending ||
              lastMileSubmit.isPending
            }
          >
            {isSubmitting ||
            llmSubmit.isPending ||
            pythonSubmit.isPending ||
            lastMileSubmit.isPending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </span>
            ) : (
              "Create Evaluator"
            )}
          </Button>
        </div>
      </div>
    </Col>
  );
};
