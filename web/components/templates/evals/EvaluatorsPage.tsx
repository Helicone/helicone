import { useMemo, useState } from "react";
import { useOrg } from "@/components/layout/org/organizationContext";
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
import EvalsPreview from "../featurePreview/evalsPreview";
import { useHasAccess } from "@/hooks/useHasAccess";

const EvalsPage = () => {
  const hasAccess = useHasAccess("evals");

  const [panels, setPanels] = useState<PanelType[]>([{ _type: "main" }]);

  if (!hasAccess) {
    return (
      <div className="mt-[16px] flex justify-center items-center min-h-[calc(100vh-200px)]">
        <EvalsPreview />
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
