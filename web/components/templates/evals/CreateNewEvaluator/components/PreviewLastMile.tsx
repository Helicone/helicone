import { Col } from "@/components/layout/common";
import { DataEntry, LastMileConfigForm, TestInput } from "../types";
import { Label } from "@/components/ui/label";
import { useMemo } from "react";
import getNormalizedRequest from "@/components/templates/requestsV2/builder/requestBuilder";

export function RenderDataEntry(dataEntry: DataEntry) {
  return <div>{dataEntry._type}</div>;
}

export function PreviewLastMile({
  testDataConfig,
  testInput,
}: {
  testDataConfig: LastMileConfigForm;
  testInput: TestInput;
}) {
  // const NormalizedRequest = useMemo(() => {
  //   return getNormalizedRequest({

  //   });
  // }, [testInput.inputBody]);
  return (
    <div>
      <Col>
        <Label>Input</Label>

        {JSON.stringify(testDataConfig.input)}
        <Label>Output</Label>
        {JSON.stringify(testDataConfig.output)}
        <Label>Prompt Template</Label>
        <Label>Ground Truth</Label>
        {"groundTruth" in testDataConfig && (
          <div>
            <Label>Ground Truth</Label>
            {JSON.stringify(testDataConfig.groundTruth)}
          </div>
        )}
      </Col>
    </div>
  );
}
