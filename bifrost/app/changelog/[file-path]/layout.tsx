import "@mintlify/mdx/dist/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { promises as fs } from "fs";
import path from "path";
import { getMetadata } from "@/components/templates/changelog/getMetaData";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata({
  params,
}: {
  params: { "file-path": string };
}): Promise<Metadata> {
  const filePath = params["file-path"];
  console.log(`Generating metadata for file path: ${filePath}`);

  try {
    const heliconMetaData = await getMetadata(filePath);

    if (!heliconMetaData) {
      console.warn(`No metadata found for ${filePath}`);
      return {};
    }

    const metadata: Metadata = {
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

    console.log(`Generated metadata: ${JSON.stringify(metadata)}`);
    return metadata;
  } catch (error) {
    console.error(`Error in generateMetadata for ${filePath}:`, error);
    return {};
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
