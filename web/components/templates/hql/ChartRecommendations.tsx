import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { P, Small, Muted } from "@/components/ui/typography";
import {
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
  Globe,
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
} from "lucide-react";
import { ChartSuggestion } from "./utils/chartUtils";

interface ChartRecommendationsProps {
  suggestions: ChartSuggestion[];
  onSelectSuggestion: (suggestion: ChartSuggestion) => void;
  selectedSuggestion?: ChartSuggestion;
}

const CATEGORY_ICONS = {
  performance: TrendingUp,
  cost: DollarSign,
  usage: Activity,
  errors: AlertCircle,
  geographic: Globe,
};

const CATEGORY_COLORS = {
  performance:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cost: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  usage:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  errors: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  geographic:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const CHART_TYPE_ICONS = {
  line: LineChart,
  "multi-line": LineChart,
  bar: BarChart3,
  "stacked-bar": BarChart3,
  pie: PieChart,
  scatter: ScatterChart,
  histogram: BarChart3,
  "box-plot": BarChart3,
};

export function ChartRecommendations({
  suggestions,
  onSelectSuggestion,
  selectedSuggestion,
}: ChartRecommendationsProps) {
  if (suggestions.length === 0) {
    return (
      <div className="p-4 text-center">
        <Muted>No chart recommendations available for this data</Muted>
      </div>
    );
  }

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce(
    (groups, suggestion) => {
      const category = suggestion.category;
      if (!groups[category]) groups[category] = [];
      groups[category].push(suggestion);
      return groups;
    },
    {} as Record<string, ChartSuggestion[]>,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <P className="font-medium">Recommended Charts</P>
        <Badge variant="secondary" className="text-xs">
          {suggestions.length} suggestions
        </Badge>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedSuggestions).map(
          ([category, categorySuggestions]) => {
            const CategoryIcon =
              CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <CategoryIcon className="h-4 w-4" />
                  <Small className="font-medium capitalize">{category}</Small>
                  <Badge
                    variant="outline"
                    className={`text-xs ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}`}
                  >
                    {categorySuggestions.length}
                  </Badge>
                </div>

                <div className="grid gap-2">
                  {categorySuggestions.map((suggestion, index) => {
                    const ChartIcon =
                      CHART_TYPE_ICONS[
                        suggestion.type as keyof typeof CHART_TYPE_ICONS
                      ] || BarChart3;
                    const isSelected =
                      selectedSuggestion?.title === suggestion.title;

                    return (
                      <Button
                        key={index}
                        variant={isSelected ? "default" : "outline"}
                        className={`h-auto justify-start p-3 text-left ${
                          isSelected ? "" : "hover:bg-muted/50"
                        }`}
                        onClick={() => onSelectSuggestion(suggestion)}
                      >
                        <div className="flex w-full items-start gap-3">
                          <ChartIcon className="mt-0.5 h-4 w-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <P
                                className={`truncate font-medium ${
                                  isSelected ? "text-primary-foreground" : ""
                                }`}
                              >
                                {suggestion.title}
                              </P>
                              <Badge
                                variant={isSelected ? "secondary" : "outline"}
                                className="ml-2 shrink-0 text-xs"
                              >
                                {suggestion.type.replace("-", " ")}
                              </Badge>
                            </div>
                            <Small
                              className={`block ${
                                isSelected
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {suggestion.description}
                            </Small>
                            <div className="mt-2 flex items-center gap-4">
                              <Small
                                className={`${
                                  isSelected
                                    ? "text-primary-foreground/60"
                                    : "text-muted-foreground"
                                }`}
                              >
                                X: {suggestion.xAxis}
                              </Small>
                              <Small
                                className={`${
                                  isSelected
                                    ? "text-primary-foreground/60"
                                    : "text-muted-foreground"
                                }`}
                              >
                                Y: {suggestion.yAxis}
                              </Small>
                              {suggestion.aggregation && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    isSelected
                                      ? "border-primary-foreground/20 text-primary-foreground/80"
                                      : ""
                                  }`}
                                >
                                  {suggestion.aggregation.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          },
        )}
      </div>

      <div className="border-t border-border pt-2">
        <Small className="text-muted-foreground">
          💡 Charts are automatically suggested based on your data columns.
          Select any suggestion to generate the visualization.
        </Small>
      </div>
    </div>
  );
}
