import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CreatePanel } from "./panels/CreatePanel";
import { EditPanel } from "./panels/EditPanel";
import { MainPanel } from "./panels/mainPanel";
import { TestPanel } from "./panels/TestPanel";
import EvalsPreview from "../featurePreview/evalsPreview";
import { useHasAccess } from "@/hooks/useHasAccess";
import AuthHeader from "@/components/shared/authHeader";
import React from "react";
import { useEvalPanelStore } from "./store/evalPanelStore";
import { useOrg } from "@/components/layout/org/organizationContext";

const EvalsPage = () => {
  const hasAccess = useHasAccess("evals");
  const org = useOrg();
  const { panels } = useEvalPanelStore();

  if (!org?.currentOrg?.tier) {
    return null;
  }

  if (!hasAccess) {
    return (
      <>
        <AuthHeader title={null} />
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <EvalsPreview />
        </div>
      </>
    );
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-screen overflow-hidden"
    >
      {panels.map((panel, index) => {
        return (
          <React.Fragment key={`panel-fragment-${panel._type}-${index}`}>
            <ResizablePanel
              key={`panel-${panel._type}-${index}`}
              minSize={panel._type === "main" ? 0 : 25}
              defaultSize={50}
              maxSize={75}
              className="h-screen overflow-hidden"
            >
              <div className="h-full overflow-hidden">
                {panel._type === "main" ? (
                  <MainPanel />
                ) : panel._type === "edit" ? (
                  <EditPanel
                    selectedEvaluatorId={panel.selectedEvaluatorId ?? ""}
                  />
                ) : panel._type === "create" ? (
                  <CreatePanel />
                ) : panel._type === "test" ? (
                  <TestPanel />
                ) : null}
              </div>
            </ResizablePanel>
            {index !== panels.length - 1 && <ResizableHandle withHandle />}
          </React.Fragment>
        );
      })}
    </ResizablePanelGroup>
  );
};

export default EvalsPage;
