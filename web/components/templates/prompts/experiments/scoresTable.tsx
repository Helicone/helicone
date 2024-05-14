import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import ModelPill from "../../requestsV2/modelPill";
import { clsx } from "../../../shared/clsx";

type ScoreValue = string | number;

type ExperimentScores = {
  dataset: {
    scores: Record<string, ScoreValue>;
  };
  hypothesis: {
    scores: Record<string, ScoreValue>;
  };
};

export type ScoresProps = {
  scores: ExperimentScores;
};
const ScoresTable = ({ scores }: ScoresProps) => {
  const calculateChange = (datasetCost: number, hypothesisCost: number) => {
    const change = hypothesisCost - datasetCost;
    const percentageChange = +((change / datasetCost) * 100).toFixed(2);
    return {
      change: +change.toFixed(4),
      percentageChange,
    };
  };

  const getScoreValue = (score: ScoreValue, field: string) => {
    if (field === "dateCreated" && typeof score === "string") {
      return renderScoreValue(score);
    }
    if (field === "cost" && typeof score === "number") {
      return `$${score.toFixed(4)}`;
    }
    if (field === "model" && typeof score === "string") {
      return <ModelPill model={score} />;
    }
    return (score as any)[field];
  };

  const getScoreAttribute = (key: string) => {
    switch (key) {
      case "cost":
        return "Cost";
      case "model":
        return "Model";
      case "dateCreated":
        return "Date Created";
      default:
        return key;
    }
  };
  const renderComparisonCell = (
    field: string,
    scores: ExperimentScores,
    changeInfo: any
  ) => {
    switch (field) {
      case "dateCreated":
        return (
          <span
            className={clsx(
              scores.dataset.scores.dateCreated ===
                scores.hypothesis.scores.dateCreated
                ? "bg-gray-50 text-gray-700 ring-gray-200"
                : "bg-gray-50 text-gray-700 ring-gray-200",
              "w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset"
            )}
          >
            {scores.dataset.scores.dateCreated ===
            scores.hypothesis.scores.dateCreated
              ? "same"
              : "changed"}
          </span>
        );
      case "cost":
        const changeClass =
          changeInfo.change < 0
            ? "bg-green-50 text-green-700 ring-green-200"
            : changeInfo.change > 0
            ? "bg-red-50 text-red-700 ring-red-200"
            : "bg-gray-50 text-gray-700 ring-gray-200";
        return (
          <span
            className={clsx(
              changeClass,
              "w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset"
            )}
          >
            {`${changeInfo.change} (${changeInfo.percentageChange}%)`}
          </span>
        );
      case "model":
        return (
          <span
            className={clsx(
              scores.dataset.scores.model === scores.hypothesis.scores.model
                ? "bg-gray-50 text-gray-700 ring-gray-200"
                : "bg-gray-50 text-gray-700 ring-gray-200",
              "w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset"
            )}
          >
            {scores.dataset.scores.model === scores.hypothesis.scores.model
              ? "same"
              : "changed"}
          </span>
        );
      default:
        return null;
    }
  };

  const renderScoreValue = (value: any) => {
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === "string" && !isNaN(Date.parse(value))) {
      return new Date(value).toLocaleDateString();
    }

    return value;
  };
  const renderTableRows = (scores: ExperimentScores) => {
    if (!scores || !scores.dataset.scores) {
      return null;
    }

    const experimentScoresAttributes = [
      ...Object.keys(scores.dataset.scores).filter(
        (key) => key !== "customScores"
      ),
    ];

    return experimentScoresAttributes.map((field) => {
      const calculateChange = (datasetCost: number, hypothesisCost: number) => {
        const change = hypothesisCost - datasetCost;
        const percentageChange = ((change / datasetCost) * 100).toFixed(2);
        return {
          change: parseFloat(change.toFixed(4)),
          percentageChange,
        };
      };

      return (
        <TableRow key={field} className="w-full">
          <TableCell className="h-full items-start border-r border-gray-300 max-w-xs">
            <p className="text-black text-sm">{getScoreAttribute(field)}</p>
          </TableCell>
          <TableCell className="h-full border-l border-gray-300">
            <p className="text-black text-sm">
              {getScoreValue(scores.dataset.scores[field], field)}
            </p>
          </TableCell>
          <TableCell className="h-full border-l border-gray-300">
            <p className="text-black text-sm">
              {getScoreValue(scores.dataset.scores[field], field)}
            </p>
          </TableCell>
          <TableCell className="h-full border-l border-gray-300">
            {renderComparisonCell(
              field,
              scores,
              field === "cost" &&
                calculateChange(
                  scores.dataset.scores.cost as number,
                  scores.hypothesis.scores.cost as number
                )
            )}
          </TableCell>
        </TableRow>
      );
    });
  };
  return (
    <Table className="h-full w-full dark:border-gray-700 bg-white dark:bg-black p-4 border border-gray-300 rounded-lg">
      <TableHead className="border-b border-gray-300 w-full">
        <TableRow>
          <TableHeaderCell className="w-1/6">
            <p className="text-sm text-gray-500">Scores</p>
          </TableHeaderCell>
          <TableHeaderCell className="w-1/3 border-l border-gray-300">
            <p className="text-sm text-gray-500">Production with prompt</p>
          </TableHeaderCell>
          <TableHeaderCell className="w-1/3 border-l border-gray-300">
            <p className="text-sm text-gray-500">Experiment with prompt</p>
          </TableHeaderCell>
          <TableHeaderCell className="w-1/3 border-l border-gray-300">
            <p className="text-sm text-gray-500">Compare</p>
          </TableHeaderCell>
        </TableRow>
      </TableHead>

      <TableBody>{scores && renderTableRows(scores)}</TableBody>
    </Table>
  );
};

export default ScoresTable;
