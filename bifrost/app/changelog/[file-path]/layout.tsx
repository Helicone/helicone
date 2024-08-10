import "@mintlify/mdx/dist/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { promises as fs } from "fs";
import path from "path";

const inter = Inter({ subsets: ["latin"] });
interface ChangelogMetaData {
  title: string;
  description: string;
}
const readMetaData = async (
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

  try {
    const jsonContent = await fs.readFile(jsonPath, "utf8");
    return JSON.parse(jsonContent) as ChangelogMetaData;
  } catch (error) {
    console.error("Error loading metadata:", error);
    return null;
  }
};

export async function generateMetadata({
  params,
}: {
  params: { "file-path": string };
}): Promise<Metadata> {
  const filePath = params["file-path"];
  const heliconMetaData = await readMetaData(filePath);

  if (!heliconMetaData) {
    return {};
  }

  return {
    title: heliconMetaData.title,
    description: heliconMetaData.description,
    icons: "https://www.helicone.ai/static/logo.webp",
    openGraph: {
      type: "website",
      siteName: "Helicone.ai",
      title: heliconMetaData.title ?? "",
      url: `https://www.helicone.ai/changelog/${filePath}`,
      description: heliconMetaData.description ?? "",
      images: `https://www.helicone.ai/static/changelog/images/${filePath}.webp`,
      locale: "en_US",
    },
    twitter: {
      title: heliconMetaData.title ?? "",
      description: heliconMetaData.description ?? "",
      card: "summary_large_image",
      images: `https://www.helicone.ai/static/changelog/images/${filePath}.webp`,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
