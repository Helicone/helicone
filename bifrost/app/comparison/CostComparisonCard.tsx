import { Card, CardContent } from "@/components/ui/card";

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
  return (
    <Card className="mb-8">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Cost Per Million Tokens</h3>
            <p className="text-sm text-gray-500">USD per 1M tokens</p>
          </div>
        </div>
        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8">
          {models.map((model, index) => {
            const isWinner =
              model.costs.prompt_token < models[1 - index].costs.prompt_token;
            return (
              <div
                key={model.model}
                className="space-y-2 md:space-y-4 p-4 rounded-lg"
              >
                <div
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    isWinner
                      ? "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-red-500/10"
                      : ""
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      index === 0 ? "bg-red-500" : "bg-blue-500"
                    }`}
                  />
                  <div
                    className={`text-sm font-medium ${
                      isWinner ? "font-bold text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {model.model}
                    {isWinner && (
                      <span className="text-xs font-semibold text-purple-500 ml-1">
                        WINNER
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div className="p-3 md:p-4 border rounded-lg">
                    <div className="text-xs md:text-sm text-gray-500">
                      Input
                    </div>
                    <div className="text-lg md:text-xl font-bold">
                      ${(model.costs.prompt_token * 1000000).toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 md:p-4 border rounded-lg">
                    <div className="text-xs md:text-sm text-gray-500">
                      Output
                    </div>
                    <div className="text-lg md:text-xl font-bold">
                      ${(model.costs.completion_token * 1000000).toFixed(2)}
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
