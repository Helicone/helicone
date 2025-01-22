import { Variable } from "@/types/prompt-state";

export const populateVariables = ({
  inputsFromBackend,
  validVariablesWithIndices,
  onVariableChange,
}: {
  inputsFromBackend: Record<string, string>;
  validVariablesWithIndices: { variable: Variable; originalIndex: number }[];
  onVariableChange: (index: number, value: string) => void;
}) => {
  for (const [key, value] of Object.entries(inputsFromBackend ?? {})) {
    const originalIndex = validVariablesWithIndices.find(
      ({ variable }) => variable.name === key
    )?.originalIndex;

    console.log(originalIndex, " ORIGINAL INDEX");
    if (originalIndex !== undefined && originalIndex !== -1) {
      onVariableChange(originalIndex, value);
    }
  }
};
