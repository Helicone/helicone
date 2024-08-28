import { promises as fs } from "fs";
import path from "path";

interface BlogStructureMetaData {
  title: string;
  title1?: string;
  title2?: string;
  description: string;
  shortDescription?: string;
  images?: string;
  time?: string;
  date?: string;
  author?: string;
  authors?: string[];
}

export async function getMetadata(
  filePath: string,
  blogFolder: string = "blog",
  blogSubFolder: string = "blogs"
): Promise<BlogStructureMetaData | null> {
  const basePath = path.join(
    process.cwd(),
    "app",
    blogFolder,
    blogSubFolder,
    filePath
  );
  const jsonPath = path.join(basePath, "metadata.json");

  try {
    const fileExists = await fs
      .access(jsonPath)
      .then(() => true)
      .catch(() => false);
    if (!fileExists) {
      console.error(`[Blog] File does not exist: ${jsonPath}`);
      return null;
    }

    const jsonContent = await fs.readFile(jsonPath, "utf8");

    const hMetadata = JSON.parse(jsonContent) as BlogStructureMetaData;

    return hMetadata;
  } catch (error) {
    console.error(`[Blog] Error loading metadata for ${filePath}:`, error);
    if (error instanceof Error) {
      console.error(
        `[Blog] Error name: ${error.name}, message: ${error.message}`
      );
      console.error(`[Blog] Error stack: ${error.stack}`);
    }
    return null;
  }
}
