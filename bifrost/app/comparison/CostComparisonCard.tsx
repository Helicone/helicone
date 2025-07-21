import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface CostComparisonCardProps {
  models: Array<{
    model: string;
    costs: {
      prompt_token: number;
      completion_token: number;
    };
  }>;
}

export default function CostComparisonCard({
  models,
}: CostComparisonCardProps) {
  if (!models || models.length < 2) return null;

  // Calculate which model is cheaper overall
  const model0TotalCost =
    models[0].costs.prompt_token + models[0].costs.completion_token;
  const model1TotalCost =
    models[1].costs.prompt_token + models[1].costs.completion_token;
  const cheaper = model0TotalCost < model1TotalCost ? 0 : 1;

  // Format dollar amounts with appropriate precision
  const formatCost = (cost: number) => {
    const costPerMillion = cost * 1000000;

    if (costPerMillion >= 100) {
      return `$${costPerMillion.toFixed(0)}`;
    } else if (costPerMillion >= 10) {
      return `$${costPerMillion.toFixed(1)}`;
    } else {
      return `$${costPerMillion.toFixed(2)}`;
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="mb-4 flex items-center text-lg font-semibold">
          <DollarSign className="mr-2 h-5 w-5 text-sky-500" />
          Cost Per Million Tokens
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {models.map((model, index) => {
            const isWinner = index === cheaper;
            const totalCost =
              model.costs.prompt_token + model.costs.completion_token;

            return (
              <div
                key={model.model}
                className={`rounded-lg border p-4 ${
                  isWinner ? "border-sky-200 bg-sky-50" : ""
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      index === 0 ? "bg-red-500" : "bg-blue-500"
                    }`}
                  />
                  <div className="text-base font-medium">
                    {model.model}
                    {isWinner && (
                      <span className="ml-2 text-xs font-medium text-sky-600">
                        cheaper
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Input</div>
                    <div className="text-lg font-bold">
                      {formatCost(model.costs.prompt_token)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Output</div>
                    <div className="text-lg font-bold">
                      {formatCost(model.costs.completion_token)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Total</div>
                    <div className="text-lg font-bold">
                      {formatCost(totalCost)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
