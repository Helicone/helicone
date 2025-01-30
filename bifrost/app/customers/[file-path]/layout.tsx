import "@mintlify/mdx/dist/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getMetadata } from "@/components/templates/customers/getMetaData";

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
    title: metadata?.title ?? "",
    description: metadata?.description ?? "",
    icons: `${BASE_URL}/static/logo.webp`,
    openGraph: {
      type: "website",
      siteName: "Helicone.ai",
      title: metadata.title ?? "",
      url: `${BASE_URL}/customers/${filePath}`,
      description: metadata.description ?? "",
      images: metadata?.logo
        ? `${BASE_URL}${metadata.logo}`
        : `${BASE_URL}/static/customers/images/${filePath}.webp`,
      locale: "en_US",
    },
    twitter: {
      title: metadata.title ?? "",
      description: metadata.description ?? "",
      card: "summary_large_image",
      images: metadata?.logo
        ? `${BASE_URL}${metadata.logo}`
        : `${BASE_URL}/static/customers/images/${filePath}.webp`,
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
