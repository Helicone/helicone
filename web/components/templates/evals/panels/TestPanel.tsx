import { Col, Row } from "@/components/layout/common";
import { TestEvaluator } from "@/components/templates/evals/CreateNewEvaluator/components/TestEvaluator";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { useEvalPanelStore } from "../store/evalPanelStore";
import { H3 } from "@/components/ui/typography";

export const TestPanel = () => {
  const { closeTestPanel } = useEvalPanelStore();

  return (
    <Col className="flex h-full flex-col overflow-hidden bg-background">
      <Row className="shrink-0 items-center justify-between border-b bg-muted/30 px-4 py-2">
        <H3 className="text-lg font-medium">Test Evaluator</H3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            closeTestPanel();
          }}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </Row>
      <div className="w-full flex-grow overflow-hidden">
        <TestEvaluator />
      </div>
    </Col>
  );
};
