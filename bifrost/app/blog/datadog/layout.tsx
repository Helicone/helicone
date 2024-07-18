import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A Guide for Datadog Users Building with LLMs - Helicone",
  description:
    "Datadog has long been a favourite among developers for monitoring and observability. But recently, LLM developers have been exploring new options. Why? We have some answers.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title: "A Guide for Datadog Users Building with LLMs",
    url: "https://www.helicone.ai/blog/datadog",
    description:
      "Datadog has long been a favourite among developers for its monitoring and observability capabilities. But recently, LLM developers have been exploring new options. Why? We have some answers.",
    images: "https://www.helicone.ai/static/blog/datadog/title.webp",
    locale: "en_US",
  },
  twitter: {
    title: "A Guide for Datadog Users Building with LLMs",
    description:
      "Datadog has long been a favourite among developers for its monitoring and observability capabilities. But recently, LLM developers have been exploring new options. Why? We have some answers.",
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/datadog/title.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
