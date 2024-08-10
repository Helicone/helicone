import { promises as fs } from "fs";
import path from "path";

async function printDirectoryStructure(startPath: string, prefix = "") {
  const files = await fs.readdir(startPath);
  let structure = "";

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(startPath, file);
    const stats = await fs.stat(filePath);
    const isLast = i === files.length - 1;
    const marker = isLast ? "└── " : "├── ";

    structure += `${prefix}${marker}${file}\n`;

    if (stats.isDirectory()) {
      structure += await printDirectoryStructure(
        filePath,
        prefix + (isLast ? "    " : "│   ")
      );
    }
  }

  return structure;
}

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

  console.log(`[Changelog] Attempting to read metadata from: ${jsonPath}`);
  console.log(`[Changelog] Current working directory: ${process.cwd()}`);
  console.log(`[Changelog] Base path: ${basePath}`);

  // Print directory structure
  const changelogDir = path.join(process.cwd(), "app", "changelog", "changes");
  console.log("[Changelog] Directory structure:");
  console.log(await printDirectoryStructure(changelogDir));

  try {
    const fileExists = await fs
      .access(jsonPath)
      .then(() => true)
      .catch(() => false);
    if (!fileExists) {
      console.error(`[Changelog] File does not exist: ${jsonPath}`);
      return null;
    }

    const jsonContent = await fs.readFile(jsonPath, "utf8");
    console.log(`[Changelog] Raw JSON content: ${jsonContent}`);

    const parsedContent = JSON.parse(jsonContent) as ChangelogMetaData;
    console.log(
      `[Changelog] Successfully read metadata: ${JSON.stringify(parsedContent)}`
    );
    return parsedContent;
  } catch (error) {
    console.error(`[Changelog] Error loading metadata for ${filePath}:`, error);
    if (error instanceof Error) {
      console.error(
        `[Changelog] Error name: ${error.name}, message: ${error.message}`
      );
      console.error(`[Changelog] Error stack: ${error.stack}`);
    }
    return null;
  }
};
