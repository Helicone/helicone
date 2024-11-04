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
    scores,
  }: {
    columnDefs: ColDef[];
    columnWidths: { [key: string]: number };
    columnOrder: string[];
    experimentId: string;
    scores: Record<
      string,
      {
        data: {
          runsCount: number;
          scores: Record<
            string,
            {
              value: any;
              valueType: string;
            }
          >;
        } | null;
        error: string | null;
      }
    >;
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
          const hypothesisScores =
            scores[col.headerComponentParams?.hypothesisId]?.data?.scores;
          if (hypothesisScores) {
            acc.scores = Array.from(
              new Set([...acc.scores, ...Object.keys(hypothesisScores)])
            ).filter((key) => !key.includes("dateCreated")); // Exclude dateCreated from scores
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
      }[] = scoreCriterias.map((score, index) => ({
        score_key: score,
        ...Object.fromEntries(
          outputColumns.map((col) => [
            col.field!,
            (() => {
              const hypothesisScores =
                scores[col.headerComponentParams?.hypothesisId]?.data?.scores;
              const runsCount =
                scores[col.headerComponentParams?.hypothesisId]?.data
                  ?.runsCount;
              const value = hypothesisScores?.[score]?.value;
              const valueType = hypothesisScores?.[score]?.valueType;

              if (
                !hypothesisScores ||
                scores[col.headerComponentParams?.hypothesisId]?.error
              ) {
                return {
                  percentage: 0,
                  average: 0,
                  count: 0,
                };
              }

              if (valueType === "boolean") {
                return {
                  percentage: value ? 100 : 0,
                  average: value ? 1 : 0,
                  count: runsCount ?? 1,
                };
              } else if (valueType === "number") {
                return {
                  percentage: (value * 100).toFixed(2),
                  average:
                    value.toString().length > 3
                      ? value.toFixed(5)
                      : value.toFixed(2),
                  count: runsCount ?? 1,
                };
              } else if (valueType === "string") {
                return {
                  percentage: 0,
                  average: value,
                  count: runsCount ?? 1,
                };
              }

              return {
                percentage: 0,
                average: 0,
                count: 0,
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
                              <span>
                                {typeof value.average !== "string" &&
                                value.count > 0 &&
                                value.average > 0
                                  ? `avg: ${value.average}`
                                  : value.average < 0
                                  ? "No data"
                                  : value.average}
                              </span>
                            )}

                            {value.count > 0 && (
                              <span>
                                {value.count}/
                                {col.headerComponentParams?.runs?.length}
                              </span>
                            )}
                          </div>
                        )}
                        {typeof value === "string" && <span>{value}</span>}
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
