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
      <div className="flex h-8 items-center justify-between">
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
                    <PiPlusBold className="h-4 w-4 text-secondary" />
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
        <p className="text-balance text-center text-sm text-slate-400">
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
              <div className="flex-d flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex flex-row items-center gap-1 font-medium text-heliblue">
                    <span>{evaluator.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">
                    ({evaluator.scoring_type})
                  </span>
                  <XIcon
                    className="h-3 w-3 cursor-pointer text-slate-500 hover:text-red-500"
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
        <div className="flex h-full w-full flex-col justify-between space-y-4">
          <div className="flex w-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Select Evaluators ({evaluatorsList?.length ?? 0})
              </h2>
            </div>
            <p className="pb-4 text-sm text-gray-500">
              Select evaluators to add or create a new custom evaluator.
            </p>

            <ul className="flex w-full flex-col items-center space-y-4 overflow-y-auto px-1 pt-4">
              {evaluatorsList?.map((evaluator: Evaluator) => (
                <li
                  key={evaluator.id}
                  className="flex w-full cursor-pointer items-start rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-900"
                  onClick={() => {
                    setOpenSelector(false);
                  }}
                >
                  <div className="flex w-full flex-col">
                    <div className="flex items-center justify-between">
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
                className="flex w-full cursor-pointer items-start rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-900"
                onClick={() => {
                  window.open("/evaluators", "_blank");
                  setOpenSelector(false);
                }}
              >
                <div className="flex w-full flex-col">
                  <div className="flex items-center justify-between">
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

          <div className="sticky bottom-0 flex justify-end space-x-4 bg-white py-4 dark:bg-slate-950">
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
