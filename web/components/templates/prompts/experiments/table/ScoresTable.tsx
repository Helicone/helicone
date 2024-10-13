import { memo, useState } from "react";
import { clsx } from "@/components/shared/clsx";
import { ColDef } from "ag-grid-community";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, TrashIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/organizationContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemRawNotText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Row } from "@/components/layout/common";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { CreateNewEvaluator } from "@/components/shared/CreateNewEvaluator/CreateNewEvaluator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EvaluatorTypeDropdown } from "@/components/shared/CreateNewEvaluator/EvaluatorTypeDropdown";
import { EvaluatorConfigForm } from "@/components/shared/CreateNewEvaluator/EvaluatorConfigForm";
import { CreateNewEvaluatorSheetContent } from "@/components/shared/CreateNewEvaluator/CreateNewEvaluatorSheetContent";

const ScoresTable = memo(
  ({
    columnDefs,
    wrapText,
    columnWidths,
    columnOrder,
    experimentId,
  }: {
    columnDefs: ColDef[];
    wrapText: boolean;
    columnWidths: { [key: string]: number };
    columnOrder: string[];
    experimentId: string;
  }) => {
    const scoreCriterias = [
      "Sentiment",
      "Accuracy",
      "Contain words",
      "Shorter than 50 characters",
      "Is English",
    ];

    // Filter output columns (excluding 'Messages' which is an input)
    const outputColumns = columnDefs.filter(
      (col) =>
        col.headerComponentParams?.badgeText === "Output" &&
        col.field !== "messages"
    );

    // Filter input columns (including 'Messages' and rowNumber)
    const inputColumns = columnDefs.filter(
      (col) =>
        col.headerComponentParams?.badgeText === "Input" ||
        col.field === "rowNumber" ||
        col.field === "messages"
    );

    const rowData = scoreCriterias.map((score) => {
      const row: any = {
        score_key: score,
      };
      outputColumns.forEach((col) => {
        // make this random from 50 to 100
        row[col.field!] = Math.floor(Math.random() * 50) + 50; // Placeholder value, replace with actual score calculation
      });
      return row;
    });

    // Calculate total width of output columns
    const totalOutputWidth = outputColumns.reduce(
      (sum, col) => sum + (columnWidths[col.field!] || (col.width as number)),
      0
    );

    // Calculate the width of the Scores column as the sum of all input columns (including Messages)
    const scoresColumnWidth = inputColumns.reduce(
      (sum, col) => sum + (columnWidths[col.field!] || (col.width as number)),
      0
    );

    // Find the "Add Experiment" column width
    const addExperimentColumn = columnDefs.find(
      (col) => col.headerName === "Add Experiment"
    );
    const addExperimentWidth = addExperimentColumn?.width || 150; // Default to 150 if not found

    // Sort outputColumns based on columnOrder
    const sortedOutputColumns = [...outputColumns].sort((a, b) => {
      return columnOrder.indexOf(a.field!) - columnOrder.indexOf(b.field!);
    });

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
        const evaluators = await jawn.POST("/v1/evaluator/query");
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
      <div className="overflow-auto ">
        <Row className="gap-2 items-center bg-white p-1 w-full">
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
        <table
          className="w-full border-separate border-spacing-0 bg-white rounded-lg text-sm table-fixed"
          style={{
            minWidth: `${
              scoresColumnWidth + totalOutputWidth + addExperimentWidth
            }px`,
          }}
        >
          <thead className="rounded-t-lg">
            <tr className="rounded-t-lg">
              <th
                className="text-left p-2 border border-slate-200 bg-slate-50 rounded-tl-lg text-slate-900 font-semibold"
                style={{ width: `${scoresColumnWidth}px` }}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  Scores
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="w-4 h-4 text-slate-500 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        The Scores table shows the average of the individual
                        scores from the inputs listed below.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              {sortedOutputColumns.map((col) => (
                <th
                  key={col.field}
                  className="text-left p-2 border border-slate-200 text-slate-900 font-semibold overflow-hidden whitespace-nowrap"
                  style={{
                    width: `${columnWidths[col.field!] || col.width}px`,
                  }}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {col.headerComponentParams?.displayName}
                    {col.headerComponentParams?.displayName === "Original" && (
                      <Badge
                        className="text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md font-medium hover:bg-slate-100"
                        variant="outline"
                      >
                        Benchmark
                      </Badge>
                    )}
                  </div>
                </th>
              ))}
              <th
                className={clsx("border-t border-slate-200")}
                style={{ width: `${addExperimentWidth}px` }}
              >
                {/* Leave this header empty or add a title if needed */}
              </th>
              <th className="flex-1 border-t border-r border-slate-200 rounded-tr-lg"></th>
            </tr>
          </thead>
          <tbody>
            {rowData.map((row, index) => (
              <tr key={row.score_key} className="text-slate-700">
                <td
                  className={clsx(
                    "p-2 border-b border-r border-slate-200 bg-slate-50",
                    index === rowData.length - 1 && "rounded-bl-lg"
                  )}
                  style={{ width: `${scoresColumnWidth}px` }}
                >
                  {row.score_key}
                </td>
                {sortedOutputColumns.map((col, index) => (
                  <td
                    key={col.field}
                    className={clsx(
                      "p-2 border-b border-r border-slate-200",
                      index === 0 && "border-l"
                    )}
                    style={{
                      width: `${columnWidths[col.field!] || col.width}px`,
                    }}
                  >
                    {row[col.field!]}%
                  </td>
                ))}
                <td
                  className={
                    index === rowData.length - 1
                      ? "border-b border-slate-200"
                      : "border-b-0"
                  }
                  style={{ minWidth: `${addExperimentWidth}px` }}
                >
                  {/* Leave this cell empty or add content if needed */}
                </td>
                <td
                  className={clsx(
                    "border-r border-slate-200",
                    index === rowData.length - 1 && "border-b rounded-br-lg"
                  )}
                ></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

ScoresTable.displayName = "ScoresTable";

export default ScoresTable;
