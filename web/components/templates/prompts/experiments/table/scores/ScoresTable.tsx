import { memo, useMemo } from "react";
import { clsx } from "@/components/shared/clsx";
import { ColDef } from "ag-grid-community";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ScoresEvaluatorsConfig from "./ScoresEvaluatorsConfig";

const ScoresTable = memo(
  ({
    columnDefs,
    columnWidths,
    columnOrder,
    experimentId,
  }: {
    columnDefs: ColDef[];
    columnWidths: { [key: string]: number };
    columnOrder: string[];
    experimentId: string;
  }) => {
    // const scoreCriterias = [
    //   "Sentiment",
    //   "Accuracy",
    //   "Contain words",
    //   "Shorter than 50 characters",
    //   "Is English",
    // ];

    const {
      outputColumns,
      inputColumns,
      addExperimentWidth,
      scores: scoreCriterias,
    } = columnDefs.reduce(
      (acc, col) => {
        if (
          col.headerComponentParams?.badgeText === "Output" &&
          col.field !== "messages"
        ) {
          acc.outputColumns.push(col);
          const scores = col.headerComponentParams?.hypothesis.runs
            ?.map((run: any) =>
              run?.scores ? Object.keys(run.scores as Record<string, any>) : []
            )
            .flat() as string[];
          console.log("scores", scores);
          if (scores && scores.length > 0) {
            acc.scores = Array.from(new Set([...acc.scores, ...scores]));
          }
        } else if (
          col.headerComponentParams?.badgeText === "Input" ||
          ["rowNumber", "messages"].includes(col.field!)
        ) {
          acc.inputColumns.push(col);
        } else if (col.headerName === "Add Experiment") {
          acc.addExperimentWidth = col.width || 150;
        }
        return acc;
      },
      {
        outputColumns: [] as ColDef[],
        inputColumns: [] as ColDef[],
        scores: [] as string[],
        addExperimentWidth: 150,
      }
    );

    const {
      rowData,
      totalOutputWidth,
      scoresColumnWidth,
      sortedOutputColumns,
    } = useMemo(() => {
      const getColumnWidth = (col: ColDef) =>
        columnWidths[col.field!] || (col.width as number);
      const rowData: {
        score_key: string;
        [key: string]: { percentage: number; count: number } | string;
      }[] = scoreCriterias.map((score) => ({
        score_key: score,
        ...Object.fromEntries(
          outputColumns.map((col) => [
            col.field!,
            (() => {
              const values = col.headerComponentParams?.hypothesis.runs
                ?.map((run: any) => run.scores?.[score]?.value)
                .filter((value: any) => value !== undefined);
              return {
                percentage: (
                  ((1.0 *
                    (values?.reduce(
                      (acc: number, curr: number) => acc + curr,
                      0
                    ) ?? 0)) /
                    (col.headerComponentParams?.hypothesis.runs?.length ?? 1)) *
                  100.0
                ).toFixed(2),
                count: values?.length ?? 0,
              };
            })(),
          ])
        ),
      }));

      const totalOutputWidth = outputColumns.reduce(
        (sum, col) => sum + getColumnWidth(col),
        0
      );
      const scoresColumnWidth = inputColumns.reduce(
        (sum, col) => sum + getColumnWidth(col),
        0
      );
      const sortedOutputColumns = outputColumns.sort(
        (a, b) => columnOrder.indexOf(a.field!) - columnOrder.indexOf(b.field!)
      );

      return {
        rowData,
        totalOutputWidth,
        scoresColumnWidth,
        sortedOutputColumns,
      };
    }, [
      scoreCriterias,
      outputColumns,
      inputColumns,
      columnWidths,
      columnOrder,
    ]);

    return (
      <div className="overflow-auto">
        <ScoresEvaluatorsConfig experimentId={experimentId} />
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
                className="text-left p-2 border-y border-slate-200 bg-slate-50 text-slate-900 font-semibold"
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
              />
              <th className="flex-1 border-t border-r border-slate-200 rounded-tr-lg" />
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
                {sortedOutputColumns.map((col, colIndex) => {
                  const value = row[col.field!];
                  return (
                    <td
                      key={col.field}
                      className={clsx(
                        "p-2 border-b border-r border-slate-200",
                        colIndex === 0 && "border-l"
                      )}
                      style={{
                        width: `${columnWidths[col.field!] || col.width}px`,
                      }}
                    >
                      {typeof value !== "string" && (
                        <div className="flex justify-between">
                          <span>{value.percentage}%</span>
                          {value.count > 0 && (
                            <span>
                              {value.count}/
                              {
                                col.headerComponentParams?.hypothesis.runs
                                  ?.length
                              }
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td
                  className={
                    index === rowData.length - 1
                      ? "border-b border-slate-200"
                      : "border-b-0"
                  }
                  style={{ minWidth: `${addExperimentWidth}px` }}
                />
                <td
                  className={clsx(
                    "border-r border-slate-200",
                    index === rowData.length - 1 && "border-b rounded-br-lg"
                  )}
                />
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
