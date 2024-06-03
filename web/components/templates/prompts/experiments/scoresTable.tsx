import ModelPill from "../../requestsV2/modelPill";
import { clsx } from "../../../shared/clsx";
import { SimpleTable } from "../../../shared/table/simpleTable";

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
  const calculateChange = (datasetScore: number, hypothesisScore: number) => {
    const change = hypothesisScore - datasetScore;
    const percentageChange = (() => {
      if (datasetScore === 0) {
        return hypothesisScore !== 0 ? 100 : 0;
      }
      return (change / Math.abs(datasetScore)) * 100;
    })();

    return {
      change: parseFloat(change.toFixed(4)),
      percentageChange: parseFloat(percentageChange.toFixed(2)),
    };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getScoreValue = (score: ScoreValue, field: string) => {
    if (field === "dateCreated" && typeof score === "string") {
      return renderScoreValue(score);
    }
    if (field === "cost" && typeof score === "number") {
      return `$${score.toFixed(4)}`;
    }
    if (field === "latency" && typeof score === "number") {
      return `${(+score / 1000).toFixed(2)}s`;
    }
    if (field === "model" && typeof score === "string") {
      return <ModelPill model={score} />;
    }
    return score;
  };

  const getScoreAttribute = (key: string) => {
    switch (key) {
      case "cost":
        return "Cost";
      case "model":
        return "Model";
      case "dateCreated":
        return "Date Created";
      case "latency":
        return "Latency";
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
            {formatDate(scores.dataset.scores.dateCreated as string) ===
            formatDate(scores.hypothesis.scores.dateCreated as string)
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
            {`${changeInfo.change > 0 ? "+" : ""}${changeInfo.change} (${
              changeInfo.percentageChange
            }%)`}
          </span>
        );
      case "latency":
        const changeLatencyClass =
          changeInfo.change < 0
            ? "bg-green-50 text-green-700 ring-green-200"
            : changeInfo.change > 0
            ? "bg-red-50 text-red-700 ring-red-200"
            : "bg-gray-50 text-gray-700 ring-gray-200";
        return (
          <span
            className={clsx(
              changeLatencyClass,
              "w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset"
            )}
          >
            {`${changeInfo.change > 0 ? "+" : ""}${(
              changeInfo.change / 1000
            ).toFixed(2)} (${changeInfo.percentageChange}%)`}
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
        return (
          <span
            className={clsx(
              "bg-gray-50 text-gray-700 ring-gray-200",
              "w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset"
            )}
          >
            {`${changeInfo.change > 0 ? "+" : ""}${changeInfo.change} (${
              changeInfo.percentageChange
            }%)`}
          </span>
        );
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

  const getTableData = (scores: ExperimentScores) => {
    if (!scores || !scores.dataset.scores) {
      return [];
    }

    const experimentScoresAttributes = Object.keys(
      scores.dataset.scores
    ).filter((key) => key !== "customScores");

    return experimentScoresAttributes.map((field) => {
      const comparisonCell =
        field !== "model" && field !== "dateCreated"
          ? renderComparisonCell(
              field,
              scores,
              calculateChange(
                scores.dataset.scores[field] as number,
                scores.hypothesis.scores[field] as number
              )
            )
          : renderComparisonCell(field, scores, null);

      return {
        score_key: getScoreAttribute(field),
        dataset: getScoreValue(scores.dataset.scores[field], field),
        hypothesis: getScoreValue(scores.hypothesis.scores[field], field),
        compare: comparisonCell,
      };
    });
  };
  return (
    <>
      <div className="flex items-center space-x-4">
        <h1 className="font-semibold text-2xl text-black dark:text-white">
          Overview
        </h1>
      </div>
      <SimpleTable
        data={getTableData(scores) || []}
        columns={[
          {
            key: "score_key",
            header: "",
            render: (score) => (
              <div className="text-gray-500 dark:text-white font-semibold  flex items-center">
                {score.score_key}
              </div>
            ),
          },
          {
            key: "dataset",
            header: "Original prompt",
            render: (score) => (
              <div className="text-black">{score.dataset}</div>
            ),
          },
          {
            key: "hypothesis",
            header: "Experiment prompt",
            render: (score) => (
              <div className="text-black">{score.hypothesis}</div>
            ),
          },
          {
            key: "compare",
            header: "Compare",
            render: (score) => (
              <div className="text-black">{score.compare}</div>
            ),
          },
        ]}
      />
    </>
  );
};

export default ScoresTable;
