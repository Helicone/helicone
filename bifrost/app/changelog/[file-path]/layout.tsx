import "@mintlify/mdx/dist/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getMetadata } from "@/components/templates/blog/getMetaData";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata({
  params,
}: {
  params: { "file-path": string };
}): Promise<Metadata> {
  const filePath = params["file-path"];
  const metadata = await getMetadata(filePath, "changelog", "changes");
  if (!metadata) {
    return {};
  }

  return {
    title: metadata?.title2 ?? metadata.title ?? "",
    description: metadata?.description ?? "",
    icons: "https://www.helicone.ai/static/logo.webp",
    openGraph: {
      type: "website",
      siteName: "Helicone.ai",
      title: metadata.title ?? "",
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
