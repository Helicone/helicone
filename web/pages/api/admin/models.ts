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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Return current registry
    return res.status(200).json({
      models: modelRegistry.models,
      variants: modelRegistry.variants,
    });
  }

  if (req.method === "PUT") {
    // Only allow updates in development mode
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ 
        error: "Model updates are only available in development mode. Please run locally to make changes.",
        isDevelopment: false
      });
    }

    try {
      const { models: updatedModels } = req.body;

      // Generate the new TypeScript file content
      const fileContent = generateRegistryFile(updatedModels);

      // Write to the file
      await fs.writeFile(REGISTRY_PATH, fileContent, "utf-8");

      return res.status(200).json({ 
        success: true,
        message: "Registry updated successfully. Changes saved to source files.",
        isDevelopment: true
      });
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

  content += `} satisfies Record<string, BaseModel>;\n\n`;
  content += `export type BaseModelId = keyof typeof baseModels;\n`;

  return content;
}

function formatModelObject(model: BaseModel): string {
  return `{
  id: "${model.id}",
  creator: "${model.creator}",${
    model.disabled ? `\n  disabled: ${model.disabled},` : ""
  }
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
          data.cost.prompt_cache_write_token_1hr !== undefined
            ? `,\n        prompt_cache_write_token_1hr: ${data.cost.prompt_cache_write_token_1hr}`
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
      }${
        data.rateLimit ? `,\n      rateLimit: {` + 
          (data.rateLimit.tpm !== undefined ? `\n        tpm: ${data.rateLimit.tpm}` : "") +
          (data.rateLimit.rpm !== undefined ? `${data.rateLimit.tpm !== undefined ? ',' : ''}\n        rpm: ${data.rateLimit.rpm}` : "") +
          (data.rateLimit.tpd !== undefined ? `${(data.rateLimit.tpm !== undefined || data.rateLimit.rpm !== undefined) ? ',' : ''}\n        tpd: ${data.rateLimit.tpd}` : "") +
          (data.rateLimit.rpd !== undefined ? `,\n        rpd: ${data.rateLimit.rpd}` : "") +
          (data.rateLimit.imagesPerMinute !== undefined ? `,\n        imagesPerMinute: ${data.rateLimit.imagesPerMinute}` : "") +
        `\n      }` : ""
      }
    }`,
    )
    .join(",")}
  },
  slug: "${model.slug}"
}`;
}
