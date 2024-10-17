import { Row } from "@/components/layout/common";
import { useOrg } from "@/components/layout/organizationContext";
import { CreateNewEvaluatorSheetContent } from "@/components/shared/CreateNewEvaluator/CreateNewEvaluatorSheetContent";
import useNotification from "@/components/shared/notification/useNotification";
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
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TrashIcon } from "lucide-react";
import { memo, useState } from "react";

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
        const evaluators = await jawn.POST(
          `/v1/experiment/{experimentId}/evaluators/run`,
          {
            params: {
              path: {
                experimentId: experimentId,
              },
            },
          }
        );
      },
    });

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

            {allEvaluators.data?.data?.data?.map((evaluator) => (
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

        <div className="grid grid-cols-8 gap-2 items-center text-xs mr-auto">
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
        <Button
          size="sm_sleek"
          variant={"outline"}
          onClick={() => runEvaluators.mutate()}
        >
          Run Evaluators
        </Button>
      </Row>
    );
  }
);

ScoresEvaluatorsConfig.displayName = "ScoresEvaluatorsConfig";

export default ScoresEvaluatorsConfig;
