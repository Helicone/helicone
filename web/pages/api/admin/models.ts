import { NextApiRequest, NextApiResponse } from "next";
import {
  modelRegistry,
  Model,
  ModelVariant,
} from "@helicone-package/cost/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // Return current registry
    const models: Record<string, Model> = {};
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

  return res.status(405).json({ error: "Method not allowed" });
}
