import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "What is LLM Observability and Monitoring?",
  description:
    "LLM observability is the practice of monitoring and analyzing Large Language Model systems in production. It tracks inputs, outputs, and performance metrics to ensure reliability and improve AI applications. Learn how it differs from traditional observability.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title: "What is LLM Observability and Monitoring?",
    url: "https://www.helicone.ai/blog/llm-observability",
    description:
      "LLM observability is the practice of monitoring and analyzing Large Language Model systems in production. It tracks inputs, outputs, and performance metrics to ensure reliability and improve AI applications. Learn how it differs from traditional observability.",
    images: "https://www.helicone.ai/static/blog/llm-observability.webp",
    locale: "en_US",
  },
  twitter: {
    title: "What is LLM Observability and Monitoring?",
    description:
      "LLM observability is the practice of monitoring and analyzing Large Language Model systems in production. It tracks inputs, outputs, and performance metrics to ensure reliability and improve AI applications. Learn how it differs from traditional observability.",
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/llm-observability.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
