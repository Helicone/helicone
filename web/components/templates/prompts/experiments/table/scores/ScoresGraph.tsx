import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useExperimentScores } from "@/services/hooks/prompts/experiment-scores";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { useExperimentTable } from "../hooks/useExperimentTable";
import { PromptVersion } from "./PromptVersion";

const ScoresGraph = ({
  promptVersions,
  experimentId,
  scores,
}: {
  promptVersions: PromptVersion[];
  experimentId: string;
  scores: Record<
    string,
    {
      data: Record<
        string,
        {
          value: any;
          valueType: string;
        }
      >;
      error: string | null;
    }
  >;
}) => {
  const { outputColumns, scores: scoreCriterias } = promptVersions.reduce(
    (acc, promptVersion) => {
      const promptVersionScores = scores[promptVersion?.id]?.data;
      if (promptVersionScores) {
        acc.scores = Array.from(
          new Set([...acc.scores, ...Object.keys(promptVersionScores)])
        ).filter((key) => !key.includes("dateCreated")); // Exclude dateCreated from scores
      }
      return acc;
    },
    {
      outputColumns: promptVersions,
      scores: [] as string[],
    }
  );

  const { getScoreColorMapping } = useExperimentScores(experimentId);

  const chartConfig = useMemo(() => {
    return getScoreColorMapping(scoreCriterias);
  }, [scoreCriterias]);

  const chartData = useMemo(() => {
    return promptVersions.map((promptVersion) => {
      const getMinMaxValues = (scoreKey: string) => {
        const values = promptVersions
          .map((pv) => scores[pv.id]?.data[scoreKey]?.value)
          .filter((v) => v !== undefined && v !== null);
        return {
          min: Math.min(...values),
          max: Math.max(...values),
        };
      };

      return {
        promptVersionLabel:
          promptVersion.metadata.label ??
          `v${promptVersion.major_version}.${promptVersion.minor_version}`,
        ...Object.fromEntries(
          scoreCriterias.flatMap((score) => {
            const promptVersionScores = scores[promptVersion.id]?.data;
            const value = promptVersionScores?.[score]?.value;
            const valueType = promptVersionScores?.[score]?.valueType;

            if (!promptVersionScores || scores[promptVersion.id]?.error) {
              return [
                [score, 0],
                [`${score}_original`, 0],
              ];
            }

            let normalizedValue;
            if (valueType === "boolean" || score.endsWith("-hcone-bool")) {
              normalizedValue = value ? 100 : 0;
            } else if (valueType === "number") {
              const { min, max } = getMinMaxValues(score);
              if (min === max) {
                normalizedValue = value === min ? 100 : 0;
              } else {
                normalizedValue = ((value - min) / (max - min)) * 100;
              }
            } else if (valueType === "string") {
              normalizedValue = 0;
            }

            return [
              [score, normalizedValue],
              [`${score}_original`, value],
            ];
          })
        ),
      };
    });
  }, [promptVersions, scoreCriterias, scores]);

  const queryClient = useQueryClient();

  const { selectedScoreKey } = useExperimentTable(experimentId);

  return (
    <div className={cn("w-full h-[300px] overflow-auto px-8")}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
            top: 20,
          }}
          onClick={() => {
            queryClient.setQueryData(["selectedScoreKey", experimentId], null);
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            padding={{ left: 12, right: 24 }}
            dataKey="promptVersionLabel"
            type="category"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            // tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartLegend
            layout="horizontal"
            verticalAlign="top"
            align="left"
            height={36}
            // iconType="square"
            // iconSize={10}
            content={
              <ChartLegendContent
                selectedScoreKey={selectedScoreKey ?? ""}
                key=""
              />
            }
          />
          <ChartTooltip cursor={true} content={<ChartTooltipContent />} />
          {scoreCriterias.map((score) => (
            <Line
              style={{ cursor: "pointer" }}
              key={score}
              dataKey={score}
              type="linear"
              stroke={
                selectedScoreKey
                  ? selectedScoreKey === score
                    ? chartConfig[score].color
                    : "gray"
                  : chartConfig[score].color
              }
              strokeOpacity={
                selectedScoreKey ? (selectedScoreKey === score ? 1 : 0.5) : 1
              }
              strokeWidth={2}
              dot={{
                fill: selectedScoreKey
                  ? selectedScoreKey === score
                    ? chartConfig[score].color
                    : "gray"
                  : chartConfig[score].color,
                opacity: 1,
              }}
              onClick={(_e, event) => {
                event.stopPropagation();
                queryClient.setQueryData(
                  ["selectedScoreKey", experimentId],
                  score
                );
              }}
              name={score.replace("-hcone-bool", "")}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
};

export default ScoresGraph;
