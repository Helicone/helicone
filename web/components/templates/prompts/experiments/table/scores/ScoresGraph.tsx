import { useMemo } from "react";
// import { clsx } from "@/components/shared/clsx";
// import { Badge } from "@/components/ui/badge";
// import { InfoIcon } from "lucide-react";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
import { PromptVersion } from "./ScoresGraphContainer";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, Legend } from "recharts";

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
      const promptVersionScores = scores[promptVersion.id]?.data;
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

  const chartConfig = useMemo(() => {
    return {
      ...Object.fromEntries(
        scoreCriterias.map((score, index) => [
          score,
          { label: score, color: `oklch(var(--chart-${(index % 5) + 1}))` },
        ])
      ),
    } satisfies ChartConfig;
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

  return (
    <div className="w-full h-[300px] overflow-auto bg-white dark:bg-neutral-950">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
            top: 20,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            padding={{ left: 12 }}
            dataKey="promptVersionLabel"
            type="category"
            // tickLine={false}
            // axisLine={false}
            tickMargin={8}
            // tickFormatter={(value) => value.slice(0, 3)}
          />
          <Legend />
          <ChartTooltip cursor={true} content={<ChartTooltipContent label />} />
          {scoreCriterias.map((score) => (
            <Line
              style={{ cursor: "pointer" }}
              key={score}
              dataKey={score}
              type="linear"
              stroke={chartConfig[score].color}
              strokeWidth={2}
              dot={{
                fill: chartConfig[score].color,
                opacity: 1,
              }}
              onClick={() => {
                console.log("clicked", score);
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
