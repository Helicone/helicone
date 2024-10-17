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
        [key: string]:
          | { percentage: number; count: number; average: number }
          | string;
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
                average: (
                  (values?.reduce(
                    (acc: number, curr: number) => acc + curr,
                    0
                  ) ?? 0) / (values?.length ?? 1)
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
      <div className="w-full overflow-auto bg-white">
        <table
          className="w-full border-spacing-0 bg-white text-sm table-fixed "
          style={{
            minWidth: `${
              scoresColumnWidth + totalOutputWidth + addExperimentWidth
            }px`,
          }}
        >
          <thead className="">
            <tr className="">
              <th
                className="text-left p-2 border-r border-b border-slate-200 bg-slate-50 text-slate-900 font-semibold"
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
              {sortedOutputColumns.map((col, colIndex) => (
                <th
                  key={col.field}
                  className={clsx(
                    "text-left p-2 border-r border-b border-slate-200 text-slate-900 font-semibold overflow-hidden whitespace-nowrap"
                    // colIndex === sortedOutputColumns.length - 1 && "border-r-0"
                  )}
                  style={{
                    width: `${columnWidths[col.field!] || col.width}px`,
                  }}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {col.headerComponentParams?.displayName}
                    {col.headerComponentParams?.displayName === "Original" && (
                      <Badge
                        className="text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] font-medium hover:bg-slate-100"
                        variant="outline"
                      >
                        Benchmark
                      </Badge>
                    )}
                  </div>
                </th>
              ))}
              <th
                className={clsx("border-slate-200")}
                style={{ width: `${addExperimentWidth}px` }}
              />
              <th className="flex-1 border-r border-slate-200 " />
            </tr>
          </thead>
          <tbody>
            {rowData.map((row, index) => {
              const isBoolean = row.score_key.endsWith("-hcone-bool");

              return (
                <tr key={row.score_key} className="text-slate-700 ">
                  <td
                    className={clsx(
                      "p-2 border-b border-r border-slate-200 bg-white flex justify-between w-full"
                      // index === rowData.length - 1 && "border-b-0"
                    )}
                    style={{ width: `${scoresColumnWidth}px` }}
                  >
                    {isBoolean
                      ? row.score_key.split("-hcone-bool")[0]
                      : row.score_key}
                    {isBoolean && <Badge>bool</Badge>}
                  </td>
                  {sortedOutputColumns.map((col, colIndex) => {
                    const value = row[col.field!];
                    return (
                      <td
                        key={col.field}
                        className={clsx(
                          "p-2 border-r border-slate-200 border-b",
                          // colIndex === sortedOutputColumns.length - 1 &&
                          //   "border-r-0",
                          index === rowData.length - 1 && "border-b-0"
                        )}
                        style={{
                          width: `${columnWidths[col.field!] || col.width}px`,
                        }}
                      >
                        {typeof value !== "string" && (
                          <div className="flex justify-between">
                            {isBoolean ? (
                              <span>{value.percentage}%</span>
                            ) : (
                              <span>avg: {value.average}</span>
                            )}

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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
);

ScoresTable.displayName = "ScoresTable";

export default ScoresTable;
