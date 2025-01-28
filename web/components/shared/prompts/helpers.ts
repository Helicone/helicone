import { StateVariable } from "@/types/prompt-state";

interface AutoPromptInput {
  role: string;
  content: string;
}

export const populateVariables = ({
  inputsFromBackend,
  validVariablesWithIndices,
  onVariableChange,
  autoPromptInputs,
}: {
  inputsFromBackend: Record<string, string>;
  validVariablesWithIndices: { variable: StateVariable; originalIndex: number }[];
  onVariableChange: (index: number, value: string) => void;
  autoPromptInputs?: AutoPromptInput[];
}) => {
  // First handle regular inputs
  for (const [key, value] of Object.entries(inputsFromBackend ?? {})) {
    const originalIndex = validVariablesWithIndices.find(
      ({ variable }) => variable.name === key
    )?.originalIndex;

    if (originalIndex !== undefined && originalIndex !== -1) {
      onVariableChange(originalIndex, value);
    }
  }

  // Then handle message variables from auto prompt inputs
  if (autoPromptInputs?.length) {
    validVariablesWithIndices.forEach(({ variable, originalIndex }) => {
      // Check if the variable name matches message_${number} pattern
      const messageMatch = variable.name.match(/^message_(\d+)$/);
      if (messageMatch) {
        const idx = parseInt(messageMatch[1]);
        const autoPromptValue = autoPromptInputs[idx];
        if (autoPromptValue) {
          onVariableChange(originalIndex, JSON.stringify(autoPromptValue));
        }
      }
    });
  }
};
