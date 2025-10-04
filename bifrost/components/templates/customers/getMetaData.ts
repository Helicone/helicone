import { promises as fs } from "fs";
import path from "path";

export interface CaseStudyStructureMetaData {
  company: string;
  title: string;
  description: string;
  logo: string;
  url: string;
  customerSince: string;
  isOpenSourced?: boolean;
  date?: string;
  relatedStudies?: string[];
}

export async function getMetadata(
  filePath: string,
  caseStudyFolder: string = "customers",
  caseStudySubFolder: string = "case-studies",
): Promise<CaseStudyStructureMetaData | null> {
  const basePath = path.join(
    process.cwd(),
    "app",
    caseStudyFolder,
    caseStudySubFolder,
    filePath,
  );
  const jsonPath = path.join(basePath, "metadata.json");

  try {
    const fileExists = await fs
      .access(jsonPath)
      .then(() => true)
      .catch(() => false);
    if (!fileExists) {
      console.error(`[CaseStudy] File does not exist: ${jsonPath}`);
      return null;
    }

    const jsonContent = await fs.readFile(jsonPath, "utf8");

    const hMetadata = JSON.parse(jsonContent) as CaseStudyStructureMetaData;

    return hMetadata;
  } catch (error) {
    console.error(`[CaseStudy] Error loading metadata for ${filePath}:`, error);
    if (error instanceof Error) {
      console.error(
        `[CaseStudy] Error name: ${error.name}, message: ${error.message}`,
      );
      console.error(`[CaseStudy] Error stack: ${error.stack}`);
    }
    return null;
  }
}
