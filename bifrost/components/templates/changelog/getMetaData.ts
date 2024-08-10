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
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Base path: ${basePath}`);

  try {
    const fileExists = await fs
      .access(jsonPath)
      .then(() => true)
      .catch(() => false);
    if (!fileExists) {
      console.error(`File does not exist: ${jsonPath}`);
      return null;
    }

    const jsonContent = await fs.readFile(jsonPath, "utf8");
    console.log(`Raw JSON content: ${jsonContent}`);

    const parsedContent = JSON.parse(jsonContent) as ChangelogMetaData;
    console.log(`Successfully read metadata: ${JSON.stringify(parsedContent)}`);
    return parsedContent;
  } catch (error) {
    console.error(`Error loading metadata for ${filePath}:`, error);
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    return null;
  }
};
