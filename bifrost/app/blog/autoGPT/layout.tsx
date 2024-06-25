import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });
// ---
// description: "Building the Optimal Evaluation Pipeline for Agent Comparison"
// author: "Justin Torre"
// date: "Mar 12, 2023"
// time: "3 minute read"
// icon: "code"
// ---
export const metadata: Metadata = {
  title: "Helicone / LLM-Observability for Developers",
  description: "The open-source platform for logging, monitoring, and debugging.",
  icons: "https://www.helicone.ai/static/logo.png", 
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title: "AutoGPT x Helicone: Optimizing Evaluation Pipelines", 
    url: "https://www.helicone.ai/blog/autoGPT",
    description: "Building the Optimal Evaluation Pipeline for Agent Comparison", 
    images: "https://www.helicone.ai/static/blog/autogpt.webp", 
    locale: "en_US",
  },
  twitter: {
    title: "AutoGPT x Helicone: Optimizing Evaluation Pipelines", 
    description: "Building the Optimal Evaluation Pipeline for Agent Comparison",
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/autogpt.webp", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
    {children}
    </>
  );
}
