import { useEffect, useState } from "react";
import ScoresTable from "./ScoresTable";
import { ColDef } from "ag-grid-community";

const ScoresTableContainer = ({
  columnDefs,
  columnWidths,
  columnOrder,
  experimentId,
  fetchExperimentHypothesisScores,
}: {
  columnDefs: ColDef[];
  columnWidths: { [key: string]: number };
  columnOrder: string[];
  experimentId: string;
  fetchExperimentHypothesisScores: (
    hypothesisId: string
  ) => Promise<Record<string, any>>;
}) => {
  const [scores, setScores] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      const hypothesisIds = columnDefs
        .filter(
          (col) =>
            col.headerComponentParams?.badgeText === "Output" &&
            col.field !== "messages"
        )
        .map((col) => col.headerComponentParams?.hypothesisId);

      const scoresData: Record<string, Record<string, any>> = {};
      await Promise.all(
        hypothesisIds.map(async (id) => {
          if (id) {
            scoresData[id] = await fetchExperimentHypothesisScores(id);
          }
        })
      );

      setScores(scoresData);
      setLoading(false);
    };

    fetchScores();
  }, [columnDefs, fetchExperimentHypothesisScores]);

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }
  console.log("scores", scores);

  return (
    <ScoresTable
      columnDefs={columnDefs}
      columnWidths={columnWidths}
      columnOrder={columnOrder}
      experimentId={experimentId}
      scores={scores}
    />
  );
};

export default ScoresTableContainer;
