import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Comprehensive changelog for Helicone.ai, detailing our continuous improvements in LLM observability, monitoring, and optimization. Track our latest updates on advanced analytics, real-time metrics, and innovative features for enhancing AI model performance, reliability, and cost-efficiency in production environments.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title: "Changelog",
    url: "https://www.helicone.ai/changelog",
    description:
      "Comprehensive changelog for Helicone.ai, detailing our continuous improvements in LLM observability, monitoring, and optimization. Track our latest updates on advanced analytics, real-time metrics, and innovative features for enhancing AI model performance, reliability, and cost-efficiency in production environments.",
    images: "https://www.helicone.ai/static/logo.webp",
    locale: "en_US",
  },
  twitter: {
    title: "Changelog",
    description:
      "Comprehensive changelog for Helicone.ai, detailing our continuous improvements in LLM observability, monitoring, and optimization. Track our latest updates on advanced analytics, real-time metrics, and innovative features for enhancing AI model performance, reliability, and cost-efficiency in production environments.",
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
