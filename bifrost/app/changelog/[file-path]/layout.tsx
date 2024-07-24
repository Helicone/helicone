import "@mintlify/mdx/dist/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { promises as fs } from "fs";
import path from "path";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata({
  params,
}: {
  params: { "file-path": string };
}): Promise<Metadata> {
  const filePath = params["file-path"];
  let metadata: Metadata = {};

  const basePath = path.join(
    process.cwd(),
    "app",
    "changelog",
    "changes",
    filePath
  );
  const jsonPath = path.join(basePath, "metadata.json");
  const tsPath = path.join(basePath, "metaData.ts");

  try {
    // Try to read JSON file first
    const jsonContent = await fs.readFile(jsonPath, "utf8");
    metadata = JSON.parse(jsonContent);
  } catch (error) {
    console.error("Error loading metadata:", error);
  }

  return metadata;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
