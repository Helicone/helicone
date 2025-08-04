/**
 * Minimal Model Registry Updater
 * Simply rewrites all registry files from provided models
 */

import * as fs from "fs/promises";
import * as path from "path";
import type { BaseModel, ModelRegistry } from "./types";

export class RegistryUpdater {
  private registryDir: string;

  constructor(registryDir?: string) {
    this.registryDir = registryDir || path.join(__dirname, "registry");
  }

  async updateRegistry(models: Record<string, BaseModel>): Promise<void> {
    // Check which creators already have their own files
    const existingFiles = await fs.readdir(this.registryDir);
    const creatorFiles = new Set(
      existingFiles
        .filter(
          (f) =>
            f.endsWith(".ts") &&
            f !== "base-models.ts" &&
            f !== "index.ts" &&
            f !== "others.ts"
        )
        .map((f) => f.replace(".ts", ""))
    );

    // Group models
    const fileMap: Record<string, Record<string, BaseModel>> = {};

    Object.entries(models).forEach(([id, model]) => {
      const creatorLower = model.creator.toLowerCase();
      const fileName = creatorFiles.has(creatorLower)
        ? `${creatorLower}.ts`
        : "others.ts";

      fileMap[fileName] = fileMap[fileName] || {};
      fileMap[fileName][id] = model;
    });

    // Write all files
    const files = await Promise.all(
      Object.entries(fileMap).map(async ([fileName, models]) => {
        const creator =
          fileName === "others.ts" ? "Other" : Object.values(models)[0].creator;
        const exportName =
          fileName === "others.ts"
            ? "otherModels"
            : `${fileName.replace(".ts", "")}Models`;

        await this.writeFile(fileName, creator, models, exportName);
        return { fileName, exportName };
      })
    );

    // Write base-models.ts
    await this.writeBaseModels(files);
  }

  async getCurrentRegistry(): Promise<ModelRegistry> {
    const { modelRegistry } = await import("./registry");
    return modelRegistry;
  }

  private async writeFile(
    fileName: string,
    creator: string,
    models: Record<string, BaseModel>,
    exportName: string
  ): Promise<void> {
    const sortedModels = Object.fromEntries(
      Object.entries(models).sort(([a], [b]) => a.localeCompare(b))
    );

    const content = `/**
 * ${creator} model definitions
 * Auto-generated on: ${new Date().toISOString()}
 */

import type { BaseModel } from "../types";

export const ${exportName} = ${JSON.stringify(sortedModels, null, 2).replace(
      /"([^"]+)":/g,
      (_, key) =>
        /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? `${key}:` : `"${key}":`
    )} satisfies Record<string, BaseModel>;
`;

    await fs.writeFile(path.join(this.registryDir, fileName), content);
  }

  private async writeBaseModels(
    files: { fileName: string; exportName: string }[]
  ): Promise<void> {
    files.sort((a, b) => a.fileName.localeCompare(b.fileName));

    const content = `/**
 * Base model definitions
 * Auto-generated on: ${new Date().toISOString()}
 */

import type { BaseModel } from "../types";

${files
  .map(
    ({ fileName, exportName }) =>
      `import { ${exportName} } from "./${fileName.replace(".ts", "")}";`
  )
  .join("\n")}

export const baseModels = {
${files.map(({ exportName }) => `  ...${exportName},`).join("\n")}
} satisfies Record<string, BaseModel>;

export type BaseModelId = keyof typeof baseModels;
`;

    await fs.writeFile(path.join(this.registryDir, "base-models.ts"), content);
  }
}

export const registryUpdater = new RegistryUpdater();
