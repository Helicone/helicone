import { DataEntry, LastMileConfigForm, TestInput } from "../types";

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
  return (
    <div>
      fdkj
      {testDataConfig._type === "faithfulness" && (
        <div>{testDataConfig.groundTruth._type}</div>
      )}
    </div>
  );
}
