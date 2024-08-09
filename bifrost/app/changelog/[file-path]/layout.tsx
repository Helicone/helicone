import "@mintlify/mdx/dist/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { promises as fs } from "fs";
import path from "path";

const inter = Inter({ subsets: ["latin"] });

const readMetaData = async (filePath: string) => {
  const basePath = path.join(
    process.cwd(),
    "app",
    "changelog",
    "changes",
    filePath
  );
  const jsonPath = path.join(basePath, "meta.json");
  const jsonContent = await fs.readFile(jsonPath, "utf8");
  try {
    return JSON.parse(jsonContent) as {
      title: string;
      description: string;
      keywords: string[];
    };
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
  const defaultMeta = {
    title: "Helicone.ai",
    description: "Helicone.ai",
    icons: "https://www.helicone.ai/static/logo.webp",
  };

  try {
    // Try to read JSON file first
    const heliconMetaData = await readMetaData(filePath);
    if (!heliconMetaData) {
      return defaultMeta;
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
  } catch (error) {
    console.error("Error loading metadata:", error);
    return defaultMeta;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
