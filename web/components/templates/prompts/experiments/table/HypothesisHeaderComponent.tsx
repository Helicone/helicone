import React from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@heroicons/react/24/outline";
import { Row } from "@/components/layout/common";

interface HypothesisHeaderComponentProps {
  hypothesisId: string;
  handleRunHypothesis: (hypothesisId: string, datasetRowIds: string[]) => void;
  inputRecordsData: any[];
}

export const HypothesisHeaderComponent: React.FC<
  HypothesisHeaderComponentProps
> = ({ hypothesisId, handleRunHypothesis, inputRecordsData }) => {
  return (
    <Row className="justify-between gap-3 items-center">
      <span>{hypothesisId}</span>
      <Button
        variant="ghost"
        onClick={() => {
          const datasetRowIds =
            inputRecordsData?.map((row) => row.dataset_row_id ?? "") ?? [];
          handleRunHypothesis(hypothesisId, datasetRowIds);
        }}
      >
        <PlayIcon className="w-4 h-4" />
      </Button>
    </Row>
  );
};
