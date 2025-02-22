import ExperimentInputSelector from "@/components/templates/prompts/experiments/experimentInputSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useInputs } from "@/services/hooks/prompts/inputs";
import { StateVariable } from "@/types/prompt-state";
import { isValidVariableName } from "@/utils/variables";
import { useMutation } from "@tanstack/react-query";
import { memo, useState } from "react";
import { PiChatBold, PiDatabaseBold, PiShuffleBold } from "react-icons/pi";
import GlassHeader from "../universal/GlassHeader";
import { populateVariables } from "./helpers";

interface VariableItemProps {
  variable: StateVariable;
  originalIndex: number;
  onVariableChange: (index: number, value: string) => void;
}

interface VariablesPanelProps {
  variables: StateVariable[];
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
    <div className="flex flex-col">
      {/* Header */}
      <GlassHeader className="h-14 px-4">
        <h2 className="font-semibold text-secondary">Inputs</h2>
        <div className="flex flex-row gap-2">
          <TooltipProvider delayDuration={100}>
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
          <TooltipProvider delayDuration={100}>
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
      </GlassHeader>

      {/* No Variables */}
      {validVariablesWithIndices.length === 0 ? (
        <p className="text-sm text-slate-400 text-center text-balance px-4">
          Make your prompt dynamic with{" "}
          <span className="font-semibold">Inputs</span>. Type{" "}
          <span className="text-heliblue">{`{{name}}`}</span> or highlight a
          value in a message and press <span className="text-heliblue">⌘E</span>
          .
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-900 px-4">
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
            <span>{variable.idx !== undefined && <PiChatBold />}</span>
          </div>
        </div>
        <Input
          variant="helicone"
          value={variable.value}
          disabled={variable.idx !== undefined}
          onChange={(e) => onVariableChange(originalIndex, e.target.value)}
          placeholder={
            variable.idx
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
