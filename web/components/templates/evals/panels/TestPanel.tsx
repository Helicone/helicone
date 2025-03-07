import { Col, Row } from "@/components/layout/common";
import { TestEvaluator } from "@/components/templates/evals/CreateNewEvaluator/components/TestEvaluator";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { useEffect } from "react";
import { useEvalPanelStore } from "../store/evalPanelStore";

export const TestPanel = () => {
  const { closeTestPanel } = useEvalPanelStore();

  // Log when the test panel is mounted to help with debugging
  useEffect(() => {
    console.log("TestPanel mounted");
    return () => {
      console.log("TestPanel unmounted");
    };
  }, []);

  return (
    <Col className="h-full">
      <Row className="justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log("Closing test panel");
            closeTestPanel();
          }}
        >
          <XIcon className="w-4 h-4" />
        </Button>
      </Row>
      <div className="w-full px-10 overflow-y-auto">
        <TestEvaluator />
      </div>
    </Col>
  );
};
