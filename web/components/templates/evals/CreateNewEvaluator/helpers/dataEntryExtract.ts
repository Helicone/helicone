import { DataEntry, TestInput } from "../types";

export function dataEntryExtract({
  dataEntry,
  testInput,
}: {
  dataEntry: DataEntry;
  testInput: TestInput;
}) {
  if (dataEntry._type === "input-body") {
    if (dataEntry.content === "jsonify") {
      return JSON.stringify(testInput.inputBody);
    }
  }
}
