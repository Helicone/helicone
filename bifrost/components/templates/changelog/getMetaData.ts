import { promises as fs } from "fs";
import path from "path";

interface ChangelogMetaData {
  title: string;
  description: string;
}
export const getMetadata = async (
  filePath: string
): Promise<ChangelogMetaData | null> => {
  const basePath = path.join(
    process.cwd(),
    "app",
    "changelog",
    "changes",
    filePath
  );
  const jsonPath = path.join(basePath, "metadata.json");

  console.log(`Attempting to read metadata from: ${jsonPath}`);

  try {
    const jsonContent = await fs.readFile(jsonPath, "utf8");
    const parsedContent = JSON.parse(jsonContent) as ChangelogMetaData;
    console.log(`Successfully read metadata: ${JSON.stringify(parsedContent)}`);
    return parsedContent;
  } catch (error) {
    console.error(`Error loading metadata for ${filePath}:`, error);
    return null;
  }
};
