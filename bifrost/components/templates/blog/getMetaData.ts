import { promises as fs } from "fs";
import path from "path";

interface BlogStructureMetaData {
  title: string;
  title1?: string;
  title2?: string;
  description: string;
  shortDescription?: string;
  images: string;
  time: string;
  date: string;
  author?: string;
  authors?: string[];
}
export async function getMetadata(
  filePath: string
): Promise<BlogStructureMetaData | null> {
  const basePath = path.join(process.cwd(), "app", "blog", "blogs", filePath);
  const jsonPath = path.join(basePath, "metadata.json");
  try {
    const jsonContent = await fs.readFile(jsonPath, "utf8");
    const hMetadata = JSON.parse(jsonContent);
    return hMetadata;
  } catch (error) {
    console.error("Error loading metadata:", error);
  }
  return null;
}
