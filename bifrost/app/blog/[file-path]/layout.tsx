import "@mintlify/mdx/dist/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { promises as fs } from "fs";
import path from "path";

const inter = Inter({ subsets: ["latin"] });

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
): Promise<BlogStructureMetaData> {
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

export async function generateMetadata({
  params,
}: {
  params: { "file-path": string };
}): Promise<Metadata> {
  const filePath = params["file-path"];
  const metadata = await getMetadata(filePath);
  if (!metadata) {
    return {};
  }

  return {
    title: metadata?.title1 ?? "",
    description: metadata?.description ?? "",
    icons: "https://www.helicone.ai/static/logo.webp",
    openGraph: {
      type: "website",
      siteName: "Helicone.ai",
      title: metadata.title2 ?? "",
      url: `https://www.helicone.ai/changelog/${filePath}`,
      description: metadata.description ?? "",
      images:
        metadata?.images ??
        `https://www.helicone.ai/static/changelog/images/${filePath}.webp`,
      locale: "en_US",
    },
    twitter: {
      title: metadata.title ?? "",
      description: metadata.description ?? "",
      card: "summary_large_image",
      images:
        metadata?.images ??
        `https://www.helicone.ai/static/changelog/images/${filePath}.webp`,
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
