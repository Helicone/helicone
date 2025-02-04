import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Variable } from "@/types/prompt-state";
import { isValidVariableName } from "@/utils/variables";
import { populateVariables } from "./helpers";
import { useInputs } from "@/services/hooks/prompts/inputs";
import ExperimentInputSelector from "@/components/templates/prompts/experiments/experimentInputSelector";
import { memo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useJawnClient } from "@/lib/clients/jawnHook";

import { PiChatBold, PiShuffleBold, PiDatabaseBold } from "react-icons/pi";
import { Input } from "@/components/ui/input";

interface VariableItemProps {
  variable: Variable;
  originalIndex: number;
  onVariableChange: (index: number, value: string) => void;
}

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
  const jawn = useJawnClient();
  // - Filter Valid Variables
  const validVariablesWithIndices = variables
    .map((v, i) => ({ variable: v, originalIndex: i }))
    .filter(({ variable }) => isValidVariableName(variable.name));

  const { inputs, isLoading, refetch } = useInputs(promptVersionId);
  const hasInputs = inputs && inputs.length > 0;

  const getRandomInput = useMutation({
    mutationFn: async () => {
      return await jawn.POST(
        "/v1/prompt/version/{promptVersionId}/inputs/query",
        {
          params: {
            path: {
              promptVersionId: promptVersionId ?? "unknown",
            },
          },
          body: {
            limit: 1,
            random: true,
          },
        }
      );
    },
  });

  const importRandom = async () => {
    const res = await getRandomInput.mutateAsync();
    const randomInput = res.data?.data?.[0];
    if (!randomInput) return;

    populateVariables({
      inputsFromBackend: randomInput.inputs ?? {},
      autoPromptInputs: randomInput.auto_prompt_inputs as {
        role: string;
        content: string;
      }[],
      validVariablesWithIndices,
      onVariableChange,
    });
  };

  const [openInputSelector, setOpenInputSelector] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="h-8 flex items-center justify-between">
        <h2 className="font-semibold text-secondary">Variables</h2>
        <div className="flex flex-row gap-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant={"outline"}
                    size={"square_icon"}
                    asPill
                    disabled={!hasInputs}
                    onClick={() => setOpenInputSelector(true)}
                  >
                    <PiDatabaseBold className="w-4 h-4 text-secondary" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {hasInputs
                    ? "Import specific values from Production"
                    : "No production data available"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant={"outline"}
                    size={"square_icon"}
                    asPill
                    onClick={importRandom}
                    disabled={!hasInputs}
                  >
                    <PiShuffleBold className="w-4 h-4 text-secondary" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {hasInputs
                    ? "Import random values from Production"
                    : "No production data available"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* No Variables */}
      {validVariablesWithIndices.length === 0 ? (
        <p className="text-sm text-slate-400 text-center text-balance">
          Make your prompt dynamic with variables. Type{" "}
          <span className="text-heliblue">{`{{name}}`}</span> or highlight a
          value in a message and press ⌘ E.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-900">
          {/* Variables */}
          {validVariablesWithIndices.map(({ variable, originalIndex }) => (
            <VariableItem
              key={`${variable.name}-${originalIndex}`}
              variable={variable}
              originalIndex={originalIndex}
              onVariableChange={onVariableChange}
            />
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
            autoPromptInputs: row.autoInputs as {
              role: string;
              content: string;
            }[],
            validVariablesWithIndices,
            onVariableChange,
          });
        }}
        selectJustOne
      />
    </div>
  );
}

const VariableItem = memo(
  ({ variable, originalIndex, onVariableChange }: VariableItemProps) => (
    <div className="flex flex-col py-1 first:pt-0">
      <div className="flex flex-d items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <div
            className={`font-medium flex flex-row items-center gap-1 ${
              variable.value ? "text-heliblue" : "text-red-500"
            }`}
          >
            <span>{variable.name}</span>
            <span>{variable.isMessage && <PiChatBold />}</span>
          </div>
        </div>
        <Input
          variant="helicone"
          value={variable.value}
          disabled={variable.isMessage}
          onChange={(e) => onVariableChange(originalIndex, e.target.value)}
          placeholder={
            variable.isMessage
              ? "Import variable value from production..."
              : `Enter default value for {{${variable.name}}}...`
          }
          className="w-[32rem]"
        />
      </div>
    </div>
  )
);

VariableItem.displayName = "VariableItem";
