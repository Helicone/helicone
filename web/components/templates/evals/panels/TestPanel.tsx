import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

import { Col, Row } from "@/components/layout/common";
import { useTestDataStore } from "../testing/testingStore";
import { PanelType } from "./types";
import { TestEvaluator } from "@/components/shared/CreateNewEvaluator/components/TestEvaluator";
import { testEvaluator } from "../testing/test";
import { useJawnClient } from "@/lib/clients/jawnHook";
export const TestPanel = ({
  setPanels,
  panels,
}: {
  setPanels: Dispatch<SetStateAction<PanelType[]>>;
  panels: PanelType[];
}) => {
  const jawn = useJawnClient();

  return (
    <Col className="h-full">
      <Row className="justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setPanels((prev) => {
              const newPanels = prev.filter((p) => p._type !== "test");
              if (!prev.includes({ _type: "main" })) {
                return [{ _type: "main" }, ...newPanels];
              }
              return newPanels;
            });
          }}
        >
          <XIcon className="w-4 h-4" />
        </Button>
      </Row>{" "}
      <div className="w-full px-10 overflow-y-auto">
        <TestEvaluator />
      </div>
    </Col>
  );
};
