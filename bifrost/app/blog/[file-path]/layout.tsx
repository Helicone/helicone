import "@mintlify/mdx/dist/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getMetadata } from "@/components/templates/blog/getMetaData";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.helicone.ai";

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
    icons: `${BASE_URL}/static/logo.webp`,
    openGraph: {
      type: "website",
      siteName: "Helicone.ai",
      title: metadata.title2 ?? "",
      url: `${BASE_URL}/blog/${filePath}`,
      description: metadata.description ?? "",
      images: metadata?.images
        ? `${BASE_URL}${metadata.images}`
        : `${BASE_URL}/static/blog/images/${filePath}.webp`,
      locale: "en_US",
    },
    twitter: {
      title: metadata.title ?? "",
      description: metadata.description ?? "",
      card: "summary_large_image",
      images: metadata?.images
        ? `${BASE_URL}${metadata.images}`
        : `${BASE_URL}/static/blog/images/${filePath}.webp`,
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
