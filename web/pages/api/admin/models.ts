import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";
import { modelRegistry } from "@helicone-package/cost/models";
import type {
  ResolvedModel,
  BaseModel,
  ModelVariant,
} from "@helicone-package/cost/models";

const REGISTRY_PATH = path.join(
  process.cwd(),
  "../packages/cost/models/registry/base-models.ts",
);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Return current registry
    return res.status(200).json({
      models: modelRegistry.models,
      variants: modelRegistry.variants,
    });
  }

  if (req.method === "PUT") {
    try {
      const { models: updatedModels } = req.body;

      // Generate the new TypeScript file content
      const fileContent = generateRegistryFile(updatedModels);

      // Write to the file
      await fs.writeFile(REGISTRY_PATH, fileContent, "utf-8");

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating registry:", error);
      return res.status(500).json({ error: "Failed to update registry" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

function generateRegistryFile(models: Record<string, BaseModel>): string {
  const timestamp = new Date().toISOString();
  const modelCount = Object.keys(models).length;

  let content = `/**
 * Base model definitions
 * Auto-generated on: ${timestamp}
 * Total base models: ${modelCount}
 */

import type { BaseModel } from "../types";

export const baseModels = {\n`;

  // Sort models by ID for consistent output
  const sortedModels = Object.entries(models).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  for (const [modelId, model] of sortedModels) {
    content += `  "${modelId}": ${formatModelObject(model)},\n`;
  }

  content += `} satisfies Record<string, BaseModel>;\n`;

  return content;
}

function formatModelObject(model: BaseModel): string {
  return `{
  id: "${model.id}",
  creator: "${model.creator}",
  metadata: {
    displayName: "${model.metadata.displayName}",
    description: "${model.metadata.description}",
    contextWindow: ${model.metadata.contextWindow},${
      model.metadata.maxOutputTokens
        ? `\n    maxOutputTokens: ${model.metadata.maxOutputTokens},`
        : ""
    }
    releaseDate: "${model.metadata.releaseDate}"${
      model.metadata.deprecatedDate
        ? `,\n    deprecatedDate: "${model.metadata.deprecatedDate}"`
        : ""
    }
  },
  providers: {${Object.entries(model.providers)
    .map(
      ([provider, data]) => `
    ${provider}: {
      provider: "${provider}",
      available: ${data.available},
      cost: {
        prompt_token: ${data.cost.prompt_token},
        completion_token: ${data.cost.completion_token}${
          data.cost.prompt_cache_write_token !== undefined
            ? `,\n        prompt_cache_write_token: ${data.cost.prompt_cache_write_token}`
            : ""
        }${
          data.cost.prompt_cache_read_token !== undefined
            ? `,\n        prompt_cache_read_token: ${data.cost.prompt_cache_read_token}`
            : ""
        }${
          data.cost.prompt_audio_token !== undefined
            ? `,\n        prompt_audio_token: ${data.cost.prompt_audio_token}`
            : ""
        }${
          data.cost.completion_audio_token !== undefined
            ? `,\n        completion_audio_token: ${data.cost.completion_audio_token}`
            : ""
        }${
          data.cost.per_image !== undefined
            ? `,\n        per_image: ${data.cost.per_image}`
            : ""
        }${
          data.cost.per_call !== undefined
            ? `,\n        per_call: ${data.cost.per_call}`
            : ""
        }
      }${
        data.modelString ? `,\n      modelString: "${data.modelString}"` : ""
      }${data.endpoint ? `,\n      endpoint: "${data.endpoint}"` : ""}${
        data.notes ? `,\n      notes: "${data.notes}"` : ""
      }
    }`,
    )
    .join(",")}
  },
  slug: "${model.slug}"
}`;
}

export default withAdminAuth(handler);
