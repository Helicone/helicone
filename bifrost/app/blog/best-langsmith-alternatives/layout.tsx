import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Compare: The Best LangSmith Alternatives & Competitors",
  description:
    "Observability tools allow developers to monitor, analyze, and optimize AI model performance, which helps overcome the 'black box' nature of LLMs. But which LangSmith alternative is the best in 2024? We will shed some light.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title: "Compare: The Best LangSmith Alternatives & Competitors",
    url: "https://www.helicone.ai/best-langsmith-alternatives",
    description:
      "Observability tools allow developers to monitor, analyze, and optimize AI model performance, which helps overcome the 'black box' nature of LLMs. But which LangSmith alternative is the best in 2024? We will shed some light.",
    images:
      "https://www.helicone.ai/static/blog/best-langsmith-alternatives/langsmith-cover.webp",
    locale: "en_US",
  },
  twitter: {
    title: "Compare: The Best LangSmith Alternatives & Competitors",
    description:
      "Observability tools allow developers to monitor, analyze, and optimize AI model performance, which helps overcome the 'black box' nature of LLMs. But which LangSmith alternative is the best in 2024? We will shed some light.",
    card: "summary_large_image",
    images:
      "https://www.helicone.ai/static/blog/best-langsmith-alternatives/langsmith-cover.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
