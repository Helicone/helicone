import { useState } from "react";
import { useOrg } from "@/components/layout/org/organizationContext";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CreatePanel } from "./panels/CreatePanel";
import { EditPanel } from "./panels/EditPanel";
import { MainPanel } from "./panels/mainPanel";
import { TestPanel } from "./panels/TestPanel";
import { PanelType } from "./panels/types";

const EvalsPage = () => {
  const org = useOrg();

  const [panels, setPanels] = useState<PanelType[]>([{ _type: "main" }]);

  if (org?.currentOrg?.tier === "free") {
    return (
      <div className="flex flex-col space-y-2 w-full h-screen items-center justify-center">
        <FeatureUpgradeCard
          title="Unlock Evaluators"
          description="The Free plan does not include the Evaluators feature, but getting access is easy."
          infoBoxText="Evaluate your prompts and models to drive improvements."
          documentationLink="https://docs.helicone.ai/features/sessions"
        />
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen">
      {panels.map((panel, index) => {
        return (
          <>
            <ResizablePanel
              key={`${panel._type}-${index}`}
              minSize={panel._type === "main" ? 0 : 25}
              defaultSize={50}
              maxSize={75}
              className="h-screen"
            >
              <div className="h-full">
                {panel._type === "main" ? (
                  <MainPanel
                    setPanels={setPanels}
                    panels={panels}
                    key={`${panel._type}-${index}`}
                  />
                ) : panel._type === "edit" ? (
                  <EditPanel
                    setPanels={setPanels}
                    panels={panels}
                    selectedEvaluatorId={panel.selectedEvaluatorId ?? ""}
                    key={`${panel._type}-${index}`}
                  />
                ) : panel._type === "create" ? (
                  <CreatePanel
                    setPanels={setPanels}
                    panels={panels}
                    key={`${panel._type}-${index}`}
                  />
                ) : panel._type === "test" ? (
                  <TestPanel
                    setPanels={setPanels}
                    panels={panels}
                    key={`${panel._type}-${index}`}
                  />
                ) : null}
              </div>
            </ResizablePanel>
            {index !== panels.length - 1 && <ResizableHandle withHandle />}
          </>
        );
      })}
    </ResizablePanelGroup>
  );
};

export default EvalsPage;
