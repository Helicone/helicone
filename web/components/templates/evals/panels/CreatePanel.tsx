import { Col, Row } from "@/components/layout/common";
import { LLMEvaluatorConfigForm } from "@/components/templates/evals/CreateNewEvaluator/LLMEvaluatorConfigForm";
import { PythonEvaluatorConfigForm } from "@/components/templates/evals/CreateNewEvaluator/PythonEvaluatorConfigForm";
import { COMPOSITE_OPTIONS } from "@/components/templates/evals/testing/examples";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XIcon } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { PanelType } from "./types";
import { LastMileDevConfigForm } from "../CreateNewEvaluator/LastMileDevConfigForm";

import { devtools, persist } from "zustand/middleware";
import { create } from "zustand";

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

export const CreatePanel = ({
  setPanels,
  panels,
}: {
  setPanels: Dispatch<SetStateAction<PanelType[]>>;
  panels: PanelType[];
}) => {
  const { selectedTab, setSelectedTab } = useCreatePanelTabs();
  return (
    <Col>
      <Row className="justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setPanels((prev) => [{ _type: "main" }]);
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
            {/* <TabsTrigger value="lastmile">
              LastMile.Dev <span className="text-xs text-gray-500 px-3"></span>
            </TabsTrigger>
             */}
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
                setPanels((prev) => [{ _type: "main" }]);
              }}
              openTestPanel={() => {
                setPanels((prev) => [{ _type: "create" }, { _type: "test" }]);
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="python">
          <PythonEvaluatorConfigForm
            onSubmit={() => {
              setPanels((prev) => prev.filter((p) => p._type !== "create"));
            }}
            openTestPanel={() => {
              setPanels((prev) => [{ _type: "create" }, { _type: "test" }]);
            }}
            configFormParams={COMPOSITE_OPTIONS[0].preset}
            name={COMPOSITE_OPTIONS[0].name}
            key={COMPOSITE_OPTIONS[0].name + "python"}
          />
        </TabsContent>
        <TabsContent value="lastmile">
          <LastMileDevConfigForm
            onSubmit={() => {
              setPanels((prev) => prev.filter((p) => p._type !== "create"));
            }}
            openTestPanel={() => {
              setPanels((prev) => [{ _type: "create" }, { _type: "test" }]);
            }}
          />
        </TabsContent>
      </Tabs>
    </Col>
  );
};
