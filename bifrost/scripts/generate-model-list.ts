/**
 * Script to generate a JSON file containing all model IDs for sitemap generation.
 * This runs before the build to extract model data from the cost package.
 * The generated JSON is then used by next-sitemap.config.js to include model pages in the sitemap.
 */

import { providers } from "../../packages/cost/providers/mappings";
import * as fs from "fs";
import * as path from "path";

interface ModelEntry {
  id: string;
  provider: string;
}

function generateModelList(): void {
  const modelEntries: ModelEntry[] = [];
  const seenModelIds = new Set<string>();

  for (const provider of providers) {
    if (!provider.costs) continue;

    for (const cost of provider.costs) {
      const modelId = cost.model.value;

      // Only add unique model IDs (some models appear with multiple providers)
      if (!seenModelIds.has(modelId)) {
        seenModelIds.add(modelId);
        modelEntries.push({
          id: modelId,
          provider: provider.provider,
        });
      }
    }
  }

  // Sort by model ID for consistent output
  modelEntries.sort((a, b) => a.id.localeCompare(b.id));

  const output = {
    generatedAt: new Date().toISOString(),
    totalModels: modelEntries.length,
    models: modelEntries.map((entry) => entry.id),
  };

  const outputPath = path.join(process.cwd(), "generated", "model-list.json");

  // Ensure the generated directory exists
  const generatedDir = path.dirname(outputPath);
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`Generated model list with ${modelEntries.length} models at ${outputPath}`);
}

generateModelList();
