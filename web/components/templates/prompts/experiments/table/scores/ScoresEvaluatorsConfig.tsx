import { Col, Row } from "@/components/layout/common";
import useOnboardingContext, {
  ONBOARDING_STEPS,
} from "@/components/layout/onboardingContext";
import { useOrg } from "@/components/layout/organizationContext";
import { CreateNewEvaluatorSheetContent } from "@/components/shared/CreateNewEvaluator/CreateNewEvaluatorSheetContent";
import useNotification from "@/components/shared/notification/useNotification";
import { OnboardingPopoverContent } from "@/components/templates/onboarding/OnboardingPopover";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemRawNotText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, TrashIcon } from "lucide-react";
import { memo, useEffect, useState } from "react";

const ScoresEvaluatorsConfig = memo(
  ({ experimentId }: { experimentId: string }) => {
    const org = useOrg();
    const evaluators = useQuery({
      queryKey: ["evaluators", org?.currentOrg?.id],
      queryFn: async (query) => {
        const currentOrgId = query.queryKey[1];
        const jawn = getJawnClient(currentOrgId);
        const evaluators = await jawn.GET(
          "/v1/experiment/{experimentId}/evaluators",
          {
            params: {
              path: {
                experimentId: experimentId,
              },
            },
          }
        );
        return evaluators;
      },
    });

    const notification = useNotification();

    const addEvaluator = useMutation({
      mutationFn: async (evaluatorId: string) => {
        const jawn = getJawnClient(org?.currentOrg?.id);
        const evaluator = await jawn.POST(
          "/v1/experiment/{experimentId}/evaluators",
          {
            params: {
              path: {
                experimentId: experimentId,
              },
            },
            body: {
              evaluatorId: evaluatorId,
            },
          }
        );
        if (!evaluator.response.ok) {
          notification.setNotification(
            `Failed to add evaluator: ${evaluator.response.statusText}`,
            "error"
          );
        }
      },
      onSuccess: () => {
        evaluators.refetch();
        allEvaluators.refetch();
      },
    });

    const allEvaluators = useQuery({
      queryKey: ["all-evaluators", org?.currentOrg?.id],
      queryFn: async (query) => {
        const currentOrgId = query.queryKey[1];

        const jawn = getJawnClient(currentOrgId);
        const evaluators = await jawn.POST("/v1/evaluator/query", {
          body: {},
        });
        return evaluators;
      },
    });

    const removeEvaluator = useMutation({
      mutationFn: async (evaluatorId: string) => {
        const jawn = getJawnClient(org?.currentOrg?.id);
        const evaluator = await jawn.DELETE(
          "/v1/experiment/{experimentId}/evaluators/{evaluatorId}",
          {
            params: {
              path: {
                experimentId: experimentId,
                evaluatorId: evaluatorId,
              },
            },
          }
        );
      },
      onSuccess: () => {
        evaluators.refetch();
        allEvaluators.refetch();
      },
    });

    const runEvaluators = useMutation({
      mutationFn: async () => {
        const jawn = getJawnClient(org?.currentOrg?.id);
        return await jawn.POST(`/v1/experiment/{experimentId}/evaluators/run`, {
          params: {
            path: {
              experimentId: experimentId,
            },
          },
        });
      },
    });

    const {
      isOnboardingVisible,
      currentStep,
      setCurrentStep,
      setOnClickElement,
    } = useOnboardingContext();

    const [open, setOpen] = useState<boolean>(false);
    const [selectOpen, setSelectOpen] = useState<boolean>(false);

    useEffect(() => {
      if (
        isOnboardingVisible &&
        currentStep === ONBOARDING_STEPS.EXPERIMENTS_CLICK_ADD_EVAL.stepNumber
      ) {
        setOnClickElement(() => () => {
          setCurrentStep(ONBOARDING_STEPS.EXPERIMENTS_SPECIFIC_EVAL.stepNumber);
          setSelectOpen(true);
        });
      }
    }, [isOnboardingVisible, currentStep, setOnClickElement]);

    return (
      <Row className="gap-2 items-center p-1 w-full">
        <Select
          open={selectOpen}
          onOpenChange={setSelectOpen}
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
          <SelectTrigger
            className="w-[200px] relative"
            data-onboarding-step={
              ONBOARDING_STEPS.EXPERIMENTS_CLICK_ADD_EVAL.stepNumber
            }
          >
            <SelectValue />
            {isOnboardingVisible &&
              currentStep ===
                ONBOARDING_STEPS.EXPERIMENTS_CLICK_ADD_EVAL.stepNumber && (
                <div className="absolute right-1/2 top-1/2 translate-x-2 -translate-y-1/2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                  </span>
                </div>
              )}
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

            {allEvaluators.data?.data?.data?.map((evaluator) => (
              <Popover
                key={evaluator.id}
                open={
                  isOnboardingVisible &&
                  currentStep ===
                    ONBOARDING_STEPS.EXPERIMENTS_SPECIFIC_EVAL.stepNumber
                }
              >
                <PopoverTrigger asChild>
                  <SelectItemRawNotText
                    key={evaluator.id}
                    value={evaluator.id}
                    className=""
                    data-onboarding-step={
                      ONBOARDING_STEPS.EXPERIMENTS_SPECIFIC_EVAL.stepNumber
                    }
                  >
                    <div className="flex flex-row items-center justify-between w-full gap-5">
                      <span>
                        + {evaluator.name} ({evaluator.scoring_type})
                      </span>
                    </div>
                  </SelectItemRawNotText>
                </PopoverTrigger>
                <OnboardingPopoverContent
                  onboardingStep="EXPERIMENTS_SPECIFIC_EVAL"
                  align="start"
                  side="right"
                  next={() => addEvaluator.mutate(evaluator.id)}
                />
              </Popover>
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
          {evaluators.data?.data?.data?.map((evaluator, index) => {
            return (
              <Row
                key={`evaluator-${evaluator.id}-${index}`}
                className="gap-2 items-center border border-slate-200 rounded-sm p-2 bg-white"
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
            <Popover
              open={
                isOnboardingVisible &&
                currentStep === ONBOARDING_STEPS.EXPERIMENTS_RUN_EVAL.stepNumber
              }
            >
              <PopoverTrigger asChild>
                <Button
                  size="sm_sleek"
                  variant={"outline"}
                  onClick={() => runEvaluators.mutate()}
                  disabled={runEvaluators.isLoading}
                  data-onboarding-step={
                    ONBOARDING_STEPS.EXPERIMENTS_RUN_EVAL.stepNumber
                  }
                >
                  {runEvaluators.isLoading ? "Running..." : "Run Evaluators"}
                </Button>
              </PopoverTrigger>
              <OnboardingPopoverContent
                onboardingStep="EXPERIMENTS_RUN_EVAL"
                align="end"
                side="bottom"
                next={() => runEvaluators.mutate()}
              />
            </Popover>
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
