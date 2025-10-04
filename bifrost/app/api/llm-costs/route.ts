import { NextRequest } from "next/server";
import { providers } from "@helicone-package/cost/providers/mappings";

// Handle GET requests for LLM cost data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const providerFilter = searchParams.get("provider")?.toLowerCase();
    const modelFilter = searchParams.get("model")?.toLowerCase();
    const format = searchParams.get("format") || "json";

    const costData: any[] = [];

    providers.forEach((provider) => {
      // Filter by provider if specified
      if (
        providerFilter &&
        provider.provider.toLowerCase() !== providerFilter
      ) {
        return;
      }

      if (!provider.costs) {
        return;
      }

      provider.costs.forEach((modelCost) => {
        // Filter by model if specified (check against the model value, not operator)
        if (
          modelFilter &&
          !modelCost.model.value.toLowerCase().includes(modelFilter)
        ) {
          return;
        }

        // Convert costs to per 1M tokens (costs are stored per token, so multiply by 1M)
        const inputCostPer1M = parseFloat(
          (modelCost.cost.prompt_token * 1000000).toFixed(8),
        );
        const outputCostPer1M = parseFloat(
          (modelCost.cost.completion_token * 1000000).toFixed(8),
        );

        const entry: any = {
          provider: provider.provider,
          model: modelCost.model.value,
          operator: modelCost.model.operator,
          input_cost_per_1m: inputCostPer1M,
          output_cost_per_1m: outputCostPer1M,
        };

        // Add optional cost fields if they exist
        if (modelCost.cost.prompt_cache_write_token) {
          entry.prompt_cache_write_per_1m = parseFloat(
            (modelCost.cost.prompt_cache_write_token * 1000000).toFixed(8),
          );
        }
        if (modelCost.cost.prompt_cache_read_token) {
          entry.prompt_cache_read_per_1m = parseFloat(
            (modelCost.cost.prompt_cache_read_token * 1000000).toFixed(8),
          );
        }
        if (modelCost.cost.prompt_audio_token) {
          entry.prompt_audio_per_1m = parseFloat(
            (modelCost.cost.prompt_audio_token * 1000000).toFixed(8),
          );
        }
        if (modelCost.cost.completion_audio_token) {
          entry.completion_audio_per_1m = parseFloat(
            (modelCost.cost.completion_audio_token * 1000000).toFixed(8),
          );
        }
        if (modelCost.cost.per_image) {
          entry.per_image = parseFloat(modelCost.cost.per_image.toFixed(8));
        }
        if (modelCost.cost.per_call) {
          entry.per_call = parseFloat(modelCost.cost.per_call.toFixed(8));
        }

        // Add additional metadata if available
        if (modelCost.showInPlayground !== undefined) {
          entry.show_in_playground = modelCost.showInPlayground;
        }
        if (modelCost.targetUrl) {
          entry.target_url = modelCost.targetUrl;
        }
        if (modelCost.dateRange) {
          entry.date_range = modelCost.dateRange;
        }

        costData.push(entry);
      });
    });

    // Sort by provider, then by model
    costData.sort((a, b) => {
      if (a.provider !== b.provider) {
        return a.provider.localeCompare(b.provider);
      }
      return a.model.localeCompare(b.model);
    });

    // Handle different output formats
    if (format === "csv") {
      // Build CSV headers dynamically based on available fields
      const allKeys = new Set<string>();
      costData.forEach((item) => {
        Object.keys(item).forEach((key) => allKeys.add(key));
      });
      const headers = Array.from(allKeys);

      const csvHeaders = headers.join(",") + "\n";
      const csvRows = costData
        .map((data) =>
          headers
            .map((header) => {
              const value = data[header];
              // Handle complex objects like date_range
              if (typeof value === "object" && value !== null) {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
              }
              // Handle strings that might contain commas
              if (typeof value === "string" && value.includes(",")) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value ?? "";
            })
            .join(","),
        )
        .join("\n");

      return new Response(csvHeaders + csvRows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="llm-costs-per-1m.csv"',
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Default JSON response
    return new Response(
      JSON.stringify(
        {
          metadata: {
            total_models: costData.length,
            note: "All costs are per 1 million tokens unless otherwise specified",
            operators_explained: {
              equals: "Model name must match exactly",
              startsWith: "Model name must start with the specified value",
              includes: "Model name must contain the specified value",
            },
          },
          data: costData,
        },
        null,
        2,
      ),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    );
  } catch (error) {
    console.error("Error in LLM costs API:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error while fetching cost data",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
