import { useEvaluators } from "@/components/templates/evals/EvaluatorHook";
import { Evaluator } from "@/components/templates/evals/details/types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { PiPlusBold } from "react-icons/pi";
import ThemedDrawer from "../../shared/themed/themedDrawer";

export default function EvalsPanel() {
  const { evaluators, deleteEvaluator } = useEvaluators();
  const [openSelector, setOpenSelector] = useState(false);

  const evaluatorsList = evaluators.data?.data?.data || [];

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="h-8 flex items-center justify-between">
        <h2 className="font-semibold text-secondary">Evals</h2>
        <div className="flex flex-row gap-2">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="outline"
                    size="square_icon"
                    asPill
                    onClick={() => setOpenSelector(true)}
                  >
                    <PiPlusBold className="w-4 h-4 text-secondary" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Eval</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* No Evaluators */}
      {!evaluatorsList?.length ? (
        <p className="text-sm text-slate-400 text-center text-balance">
          Measure the performance of your prompt with{" "}
          <span className="font-semibold">Evals</span>. Press the{" "}
          <span className="text-heliblue">
            <PiPlusBold className="inline-block" />
            &quot;Add Eval&quot;
          </span>{" "}
          button to choose or create one.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-900">
          {/* Evaluators */}
          {evaluatorsList?.map((evaluator: Evaluator) => (
            <div key={evaluator.id} className="flex flex-col py-1 first:pt-0">
              <div className="flex flex-d items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="font-medium flex flex-row items-center gap-1 text-heliblue">
                    <span>{evaluator.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">
                    ({evaluator.scoring_type})
                  </span>
                  <XIcon
                    className="w-3 h-3 cursor-pointer text-slate-500 hover:text-red-500"
                    onClick={() => deleteEvaluator.mutate(evaluator.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evaluator Selector Drawer */}
      <ThemedDrawer open={openSelector} setOpen={setOpenSelector}>
        <div className="h-full flex flex-col space-y-4 justify-between w-full">
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-xl">
                Select Evaluators ({evaluatorsList?.length ?? 0})
              </h2>
            </div>
            <p className="text-gray-500 text-sm pb-4">
              Select evaluators to add or create a new custom evaluator.
            </p>

            <ul className="flex flex-col items-center space-y-4 w-full pt-4 px-1 overflow-y-auto">
              {evaluatorsList?.map((evaluator: Evaluator) => (
                <li
                  key={evaluator.id}
                  className="w-full flex items-start cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 p-3 rounded-lg"
                  onClick={() => {
                    setOpenSelector(false);
                  }}
                >
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-heliblue">
                        {evaluator.name}
                      </span>
                      <span className="text-sm text-slate-500">
                        ({evaluator.scoring_type})
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              <li
                className="w-full flex items-start cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 p-3 rounded-lg"
                onClick={() => {
                  window.open("/evaluators", "_blank");
                  setOpenSelector(false);
                }}
              >
                <div className="flex flex-col w-full">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-heliblue">
                      Create New Custom Evaluator
                    </span>
                    <span className="text-sm text-slate-500">
                      (Opens in new tab)
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4 sticky bottom-0 py-4 bg-white dark:bg-slate-950">
            <Button
              variant={"secondary"}
              size={"sm"}
              onClick={() => setOpenSelector(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </ThemedDrawer>
    </div>
  );
}
