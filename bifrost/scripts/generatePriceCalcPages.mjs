import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { modelNames } from "../packages/cost";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, "../app/price-calc/models");

if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
}

modelNames.forEach((model) => {
  const providerName = "OpenAI"; // Replace with dynamic provider names if available
  const componentName =
    model
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("") + "PriceCalcPage";

  const pageContent = `
"use client";

import ModelPriceCalculator from "../ModelPriceCalculator";

export default function ${componentName}() {
  return (
    <div className="container mx-auto py-8">
      <ModelPriceCalculator model="${model}" provider="${providerName}" />
    </div>
  );
}
`;

  const filePath = path.join(pagesDir, `${model.replace(/\//g, "-")}.tsx`);
  fs.writeFileSync(filePath, pageContent.trim());
  console.log(`Generated page for model: ${model}`);
});
