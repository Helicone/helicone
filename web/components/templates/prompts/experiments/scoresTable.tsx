import ModelPill from "../../requestsV2/modelPill";
import { clsx } from "../../../shared/clsx";
import { SimpleTable } from "../../../shared/table/simpleTable";

type Score = {
  valueType: string;
  value: number | string;
};

type ExperimentScores = {
  dataset: {
    scores: Record<string, Score>;
  };
  hypothesis: {
    scores: Record<string, Score>;
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

  const getScoreValue = (score: Score, field: string) => {
    if (field === "dateCreated" && score.valueType === "string") {
      return renderScoreValue(score.value);
    }
    if (
      field === "cost" &&
      score.valueType === "number" &&
      typeof score.value === "number"
    ) {
      return `$${score.value.toFixed(4)}`;
    }
    if (
      field === "latency" &&
      score.valueType === "number" &&
      typeof score.value === "number"
    ) {
      return `${(+score.value / 1000).toFixed(2)}s`;
    }
    if (score.valueType === "boolean") {
      return score.value === 1 ? "True" : "False";
    }
    if (
      field === "model" &&
      score.valueType === "string" &&
      typeof score.value === "string"
    ) {
      return <ModelPill model={score.value} />;
    }
    return score.value;
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
            {formatDate(scores.dataset.scores.dateCreated.value as string) ===
            formatDate(scores.hypothesis.scores.dateCreated.value as string)
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
        return scores.dataset.scores[field].valueType === "boolean" ? (
          <span
            className={clsx(
              "bg-gray-50 text-gray-700 ring-gray-200",
              "w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset"
            )}
          >
            {scores.dataset.scores[field].value ===
            scores.hypothesis.scores[field].value
              ? "same"
              : "changed"}
          </span>
        ) : (
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

    const experimentScoresAttributes = Object.keys(scores.dataset.scores);

    return experimentScoresAttributes.map((field) => {
      const datasetScore = scores.dataset.scores[field];
      const hypothesisScore = scores.hypothesis.scores[field];
      const comparisonCell =
        field !== "model" && field !== "dateCreated"
          ? hypothesisScore
            ? renderComparisonCell(
                field,
                scores,
                calculateChange(
                  datasetScore.value as number,
                  hypothesisScore.value as number
                )
              )
            : "N/A"
          : renderComparisonCell(field, scores, null);

      return {
        score_key: getScoreAttribute(field),
        dataset: getScoreValue(datasetScore, field),
        hypothesis: hypothesisScore
          ? getScoreValue(hypothesisScore, field)
          : "N/A",
        compare: hypothesisScore ? comparisonCell : "N/A",
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
