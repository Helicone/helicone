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
      }
    )
  )
);

export const CreatePanel = () => {
  const { selectedTab, setSelectedTab } = useCreatePanelTabs();
  const { resetPanels, openTestPanel } = useEvalPanelStore();

  return (
    <Col>
      <Row className="justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            resetPanels();
          }}
        >
          <XIcon className="w-4 h-4" />
        </Button>
      </Row>
      <Tabs
        className="w-full px-10"
        defaultValue="llm-as-a-judge"
        value={selectedTab}
        onValueChange={(value) => {
          setSelectedTab(value);
        }}
      >
        <Row className="justify-between">
          <h1 className="text-xl font-bold">Create new evaluator</h1>
          <TabsList>
            <TabsTrigger value="llm-as-a-judge">LLM-as-a-judge</TabsTrigger>
            <TabsTrigger value="python">
              Python <span className="text-xs text-gray-500 px-3"></span>
            </TabsTrigger>
            <TabsTrigger value="lastmile">
              LastMile AutoEval{" "}
              <span className="text-xs text-gray-500 px-3"></span>
            </TabsTrigger>
            <TabsTrigger value="typescript" disabled>
              Typescript{" "}
              <span className="text-xs text-gray-500 px-3">(soon)</span>
            </TabsTrigger>
          </TabsList>
        </Row>
        <TabsContent value="llm-as-a-judge">
          <div className="flex-grow overflow-hidden">
            <LLMEvaluatorConfigForm
              onSubmit={() => {
                resetPanels();
              }}
              openTestPanel={() => {
                console.log("Opening test panel from LLM evaluator");
                openTestPanel();
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="python">
          <PythonEvaluatorConfigForm
            onSubmit={() => {
              resetPanels();
            }}
            openTestPanel={() => {
              console.log("Opening test panel from Python evaluator");
              openTestPanel();
            }}
            configFormParams={COMPOSITE_OPTIONS[0].preset}
            name={COMPOSITE_OPTIONS[0].name}
            key={COMPOSITE_OPTIONS[0].name + "python"}
          />
        </TabsContent>
        <TabsContent value="lastmile">
          <LastMileDevConfigForm
            onSubmit={() => {
              resetPanels();
            }}
            openTestPanel={() => {
              console.log("Opening test panel from LastMile evaluator");
              openTestPanel();
            }}
          />
        </TabsContent>
      </Tabs>
    </Col>
  );
};
