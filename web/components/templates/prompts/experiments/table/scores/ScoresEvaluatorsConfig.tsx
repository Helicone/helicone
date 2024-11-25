import { Col, Row } from "@/components/layout/common";
import { CreateNewEvaluatorSheetContent } from "@/components/shared/CreateNewEvaluator/CreateNewEvaluatorSheetContent";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemRawNotText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { useExperimentScores } from "@/services/hooks/prompts/experiment-scores";
import { Loader2, TrashIcon } from "lucide-react";
import { memo, useState } from "react";

const ScoresEvaluatorsConfig = memo(
  ({ experimentId }: { experimentId: string }) => {
    const {
      evaluators,
      addEvaluator,
      removeEvaluator,
      runEvaluators,
      allEvaluators,
    } = useExperimentScores(experimentId);

    const [open, setOpen] = useState<boolean>(false);

    return (
      <Row className="gap-2 items-center p-1 w-full">
        <Select
          value={"default"}
          onValueChange={(value) => {
            if (value === "helicone-new-custom") {
              // addEvaluator.mutate(value);/
              setOpen(true);
            } else {
              addEvaluator.mutate(value);
            }
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem className="cursor-default hidden" value={"default"}>
              Add an evaluator
            </SelectItem>

            <SelectItem
              className="cursor-default"
              value={"helicone-new-custom"}
            >
              Create New Custom Evaluator
            </SelectItem>

            {allEvaluators?.data?.data?.map((evaluator) => (
              <SelectItemRawNotText
                key={evaluator.id}
                value={evaluator.id}
                className=""
              >
                <div className="flex flex-row items-center justify-between w-full gap-5">
                  <span>
                    + {evaluator.name} ({evaluator.scoring_type})
                  </span>
                </div>
              </SelectItemRawNotText>
            ))}
          </SelectContent>
        </Select>

        <Sheet open={open} onOpenChange={setOpen}>
          <CreateNewEvaluatorSheetContent
            onSubmit={(evaluatorId) => {
              addEvaluator.mutate(evaluatorId);
              setOpen(false);
            }}
            hideButton={true}
          />
        </Sheet>

        <div className="grid grid-cols-5 gap-2 items-center text-xs mr-auto">
          {evaluators?.data?.data?.map((evaluator, index) => {
            return (
              <Row
                key={`evaluator-${evaluator.id}-${index}`}
                className="gap-2 items-center border border-slate-200 dark:border-slate-700 rounded-sm p-2 bg-white dark:bg-neutral-950 "
              >
                {evaluator.name}
                <TrashIcon
                  className="w-3 h-3 text-red-500 cursor-pointer"
                  onClick={() => removeEvaluator.mutate(evaluator.id)}
                />
              </Row>
            );
          })}
        </div>
        <Col className="items-end">
          <div className="flex items-center gap-2">
            <Button
              size="sm_sleek"
              variant={"outline"}
              onClick={() => runEvaluators.mutate()}
              disabled={runEvaluators.isLoading}
            >
              {runEvaluators.isLoading ? "Running..." : "Run Evaluators"}
            </Button>
            {runEvaluators.isLoading && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </div>
          {runEvaluators.isSuccess && (
            <span className="text-xs text-slate-500">
              Evaluators ran successfully
            </span>
          )}
          {runEvaluators.isError && (
            <span className="text-xs text-red-500">
              Error running evaluators
            </span>
          )}
        </Col>
      </Row>
    );
  }
);

ScoresEvaluatorsConfig.displayName = "ScoresEvaluatorsConfig";

export default ScoresEvaluatorsConfig;
