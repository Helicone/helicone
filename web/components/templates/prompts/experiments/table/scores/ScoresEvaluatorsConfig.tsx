import { Col, Row } from "@/components/layout/common";
import { ONBOARDING_STEPS } from "@/components/layout/onboardingContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemRawNotText,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useExperimentScores } from "@/services/hooks/prompts/experiment-scores";
import { CheckIcon, Loader2, TriangleAlertIcon, XIcon } from "lucide-react";
import { memo, useEffect, useState } from "react";

const ScoresEvaluatorsConfig = memo(
  ({ experimentId }: { experimentId: string }) => {
    const {
      evaluators,
      addEvaluator,
      removeEvaluator,
      runEvaluators,
      allEvaluators,
      shouldRunEvaluators,
    } = useExperimentScores(experimentId);

    const [value, setValue] = useState<string>("");

    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);

    useEffect(() => {
      if (runEvaluators.isSuccess) {
        setShowSuccess(true);
        const timer = setTimeout(() => setShowSuccess(false), 3000);
        return () => clearTimeout(timer);
      }
    }, [runEvaluators.isSuccess]);

    useEffect(() => {
      if (runEvaluators.isError) {
        setShowError(true);
        const timer = setTimeout(() => setShowError(false), 3000);
        return () => clearTimeout(timer);
      }
    }, [runEvaluators.isError]);

    const [selectOpen, setSelectOpen] = useState(false);

    return (
      <Row className={cn("w-full items-center gap-2", "mx-6")}>
        <Select
          open={selectOpen}
          onOpenChange={setSelectOpen}
          value={value}
          onValueChange={(value) => {
            if (value === "helicone-new-custom") {
              window.open("/evaluators", "_blank");
            } else {
              addEvaluator.mutate(value);
              setValue("");
            }
          }}
        >
          <SelectTrigger
            className="relative w-[200px]"
            data-onboarding-step={
              ONBOARDING_STEPS.EXPERIMENTS_CLICK_ADD_EVAL.stepNumber
            }
          >
            <SelectValue placeholder="Select an evaluator" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem
              className="cursor-default gap-2 px-2 text-xs"
              value={"helicone-new-custom"}
            >
              Create New Custom Evaluator
            </SelectItem>

            {/* <SelectSeparator /> */}
            <SelectGroup>
              {allEvaluators?.data?.data &&
                allEvaluators.data.data.filter(
                  (evaluator) =>
                    !evaluators?.data?.data?.filter(
                      (e) => e.id === evaluator.id,
                    ).length,
                )?.length > 0 && (
                  <SelectLabel className="px-2 py-1 text-xs font-medium text-slate-500">
                    Existing Evaluators
                  </SelectLabel>
                )}

              {allEvaluators?.data?.data
                ?.filter(
                  (evaluator) =>
                    !evaluators?.data?.data?.filter(
                      (e) => e.id === evaluator.id,
                    ).length,
                )
                .map((evaluator) => (
                  <SelectItemRawNotText
                    key={evaluator.id}
                    value={evaluator.id}
                    className="px-2 text-xs"
                    showIndicator={false}
                  >
                    {evaluator.name} ({evaluator.scoring_type})
                  </SelectItemRawNotText>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <ScrollArea className="flex-1">
          <div className="flex items-start justify-start gap-2">
            {evaluators?.data?.data?.map((evaluator, index) => {
              return (
                <Badge
                  key={`evaluator-${evaluator.id}-${index}`}
                  variant="helicone"
                  className="cursor-pointer items-center gap-1 whitespace-nowrap text-nowrap text-xs"
                  onClick={() => {
                    removeEvaluator.mutate(evaluator.id);
                  }}
                >
                  <XIcon
                    className="h-3 w-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEvaluator.mutate(evaluator.id);
                    }}
                  />
                  <span className="leading-tight">{evaluator.name}</span>
                </Badge>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <Col className="items-end">
          <div className="flex items-center gap-2">
            {shouldRunEvaluators.data && (
              <Badge
                variant="helicone"
                className="gap-2 border-yellow-200 bg-yellow-50 text-xs text-yellow-500 dark:border-yellow-800 dark:bg-yellow-950"
              >
                <TriangleAlertIcon className="h-3 w-3" />
                <span>For latest scores, re-run evaluators</span>
              </Badge>
            )}
            {showSuccess && (
              <Badge
                variant="helicone"
                className="gap-2 border-green-200 bg-green-50 text-xs text-green-500 dark:border-green-800 dark:bg-green-950"
              >
                <CheckIcon className="h-3 w-3" />
                <span>Evaluators ran successfully</span>
              </Badge>
            )}
            {showError && (
              <Badge
                variant="helicone"
                className="gap-2 border-red-200 bg-red-50 text-xs text-red-500 dark:border-red-800 dark:bg-red-950"
              >
                <TriangleAlertIcon className="h-3 w-3" />
                <span>Error running evaluators</span>
              </Badge>
            )}
            <Button
              size="sm"
              variant={"outline"}
              onClick={() => runEvaluators.mutate()}
              disabled={runEvaluators.isPending}
              className="text-xs"
            >
              {runEvaluators.isPending ? "Running..." : "Run Evaluators"}
              {runEvaluators.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </Button>
          </div>
        </Col>
      </Row>
    );
  },
);

ScoresEvaluatorsConfig.displayName = "ScoresEvaluatorsConfig";

export default ScoresEvaluatorsConfig;
