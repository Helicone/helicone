import { Row } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Variable } from "@/types/prompt-state";
import { isValidVariableName } from "@/utils/variables";
import { ImportIcon, ShuffleIcon } from "lucide-react";
import { populateVariables } from "./helpers";
import { usePromptInputs } from "./hooks";
import ExperimentInputSelector from "@/components/templates/prompts/experiments/experimentInputSelector";
import { useState } from "react";

interface VariablesPanelProps {
  variables: Variable[];
  onVariableChange: (index: number, value: string) => void;
  promptVersionId: string;
}

export default function VariablesPanel({
  variables,
  onVariableChange,
  promptVersionId,
}: VariablesPanelProps) {
  // - Filter Valid Variables
  const validVariablesWithIndices = variables
    .map((v, i) => ({ variable: v, originalIndex: i }))
    .filter(({ variable }) => isValidVariableName(variable.name));

  const { getRandomInput, hasInputs } = usePromptInputs(promptVersionId);

  const importRandom = async () => {
    const res = await getRandomInput.mutateAsync();
    populateVariables({
      inputsFromBackend: res.data?.data?.[0]?.inputs ?? {},
      validVariablesWithIndices,
      onVariableChange,
    });
  };

  const [openInputSelector, setOpenInputSelector] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">Variables</h2>

        <Row className="gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant={"secondary"}
                    size={"sm_sleek"}
                    asPill
                    disabled={!hasInputs}
                    onClick={() => setOpenInputSelector(true)}
                  >
                    <ImportIcon className="w-4 h-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {hasInputs
                    ? "Import from Production"
                    : "No production data available"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant={"secondary"}
                    size={"sm_sleek"}
                    asPill
                    onClick={importRandom}
                    disabled={!hasInputs}
                  >
                    <ShuffleIcon className="w-4 h-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {hasInputs
                    ? "Randomized from production data"
                    : "No production data available"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Row>
      </div>

      {/* No Variables */}
      {validVariablesWithIndices.length === 0 ? (
        <p className="text-sm text-slate-400 text-center text-balance">
          Make your prompt dynamic with variables. Type{" "}
          <span className="text-heliblue">{`{{name}}`}</span> or highlight a
          value in a message and press ⌘ E.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100">
          {/* Variables */}
          {validVariablesWithIndices.map(({ variable, originalIndex }) => (
            <div
              key={`${variable.name}-${originalIndex}`}
              className="flex flex-col py-2 first:pt-0"
            >
              <div className="flex flex-d items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      variable.value ? "text-heliblue" : "text-red-500"
                    }`}
                  >
                    {variable.name}
                  </span>
                </div>
                <input
                  value={variable.value}
                  onChange={(e) =>
                    onVariableChange(originalIndex, e.target.value)
                  }
                  placeholder={`Enter default value for {{${variable.name}}}...`}
                  className="w-[32rem] border border-slate-100 focus:ring-1 focus:ring-heliblue hover:shadow-md rounded-md px-2 py-1"
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <ExperimentInputSelector
        open={openInputSelector}
        setOpen={setOpenInputSelector}
        promptVersionId={promptVersionId}
        onSuccess={() => {}}
        handleAddRows={(rows) => {
          const row = rows[0];

          populateVariables({
            inputsFromBackend: row.inputs,
            validVariablesWithIndices,
            onVariableChange,
          });
        }}
        selectJustOne
      />
    </div>
  );
}
