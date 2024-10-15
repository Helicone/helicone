import fs from "fs";
import path from "path";
import { providers } from "../packages/cost/providers/mappings";

const baseDir = path.join(__dirname, "../app/price-calc/provider");

// Ensure the models directory exists
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

const defaultAuthor = "Helicone Team";
const defaultImageUrl = "/static/pricing/default-cover.webp"; // Adjust the path as necessary

// Function to sanitize component names
function sanitizeComponentName(name: string): string {
  let sanitized = name
    .split(/[-/]/)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ""))
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  // If the first character is a digit, prefix with 'Model'
  if (/^\d/.test(sanitized)) {
    sanitized = "Model" + sanitized;
  }

  return sanitized;
}

// Function to generate metadata content
function generateMetadata(model: string, provider: string): string {
  const title = `${model} Price Calculator`;
  const description = `Calculate the cost of using ${model} by ${provider}.`;
  const metadata = {
    title,
    title1: title,
    title2: title,
    description,
    images: defaultImageUrl,
    time: "5 minute read", // Adjust as necessary
    author: defaultAuthor,
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
  };
  return JSON.stringify(metadata, null, 2);
}

// Iterate through providers and their models
for (const provider of providers) {
  const providerName = provider.provider.toLowerCase(); // Convert provider name to lowercase
  const costs = provider.costs || [];

  // Create provider directory
  const providerDir = path.join(baseDir, providerName);
  if (!fs.existsSync(providerDir)) {
    fs.mkdirSync(providerDir, { recursive: true });
  }

  for (const modelCost of costs) {
    const model = modelCost.model.value;

    // Sanitize the model name for filesystem compatibility
    const sanitizedModel = model.replace(/[\/\\]/g, "-");

    // Create the path: /provider/providername/model/modelname
    const modelFolderPath = path.join(providerDir, "model", sanitizedModel);

    // Ensure the model's folder exists
    if (!fs.existsSync(modelFolderPath)) {
      fs.mkdirSync(modelFolderPath, { recursive: true });
    }

    const pageFilePath = path.join(modelFolderPath, "page.tsx");
    const metadataFilePath = path.join(modelFolderPath, "metadata.json");

    // Generate and write page content (always overwrite)
    const pageContent = `
"use client";

import ModelPriceCalculator from "@/app/price-calc/ModelPriceCalculator";

export default function ${sanitizeComponentName(model)}PriceCalcPage() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="${model}" provider="${providerName}" />
    </div>
  );
}
`.trim();

    fs.writeFileSync(pageFilePath, pageContent);
    console.log(
      `Generated page for model: ${model} (Provider: ${providerName})`
    );

    // Generate and write metadata content (always overwrite)
    const metadataContent = generateMetadata(model, providerName);
    fs.writeFileSync(metadataFilePath, metadataContent);
    console.log(
      `Generated metadata for model: ${model} (Provider: ${providerName})`
    );
  }
}
