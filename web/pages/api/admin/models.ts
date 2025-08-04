import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import {
  modelRegistry,
  BaseModel,
  ModelVariant,
  RegistryUpdater,
} from "@helicone-package/cost/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // Return current registry
    const models: Record<string, BaseModel> = {};
    const variants: Record<string, ModelVariant> = {};

    // Extract models and their variants
    Object.entries(modelRegistry.models).forEach(([modelId, model]) => {
      models[modelId] = model;

      // Extract variants if they exist
      if (model.variants) {
        Object.entries(model.variants).forEach(([variantId, variant]) => {
          variants[variantId] = variant;
        });
      }
    });

    return res.status(200).json({
      models,
      variants,
    });
  }

  if (req.method === "PUT") {
    // Only allow updates in development mode
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({
        error:
          "Model updates are only available in development mode. Please run locally to make changes.",
        isDevelopment: false,
      });
    }

    try {
      const { models: updatedModels } = req.body as {
        models: Record<string, BaseModel>;
      };

      // Use the package's registry updater
      const registryDir = path.join(
        process.cwd(),
        "../packages/cost/models/registry",
      );
      const updater = new RegistryUpdater(registryDir);
      
      await updater.updateRegistry(updatedModels);

      return res.status(200).json({
        success: true,
        message:
          "Registry updated successfully. Changes saved to source files.",
        isDevelopment: true,
      });
    } catch (error) {
      console.error("Error updating registry:", error);
      return res.status(500).json({ error: "Failed to update registry" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}