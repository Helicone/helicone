import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Helicone / LLM-Observability for Developers",
  description: "The open-source platform for logging, monitoring, and debugging.",
  icons: "https://www.helicone.ai/static/logo.png", 
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title: "Debugging RAG Chatbots and AI Agents with Sessions",
    url: "https://www.helicone.ai/blog/debugging-chatbots-and-ai-agents-with-sessions",
    description: "How well do you understand your users' intents? At which point in the multi-step process does your model start hallucinating? Do you find consistent problems with a specific part of your AI agent workflow?", 
    images: "https://www.helicone.ai/static/blog/agent-cover.webp", 
    locale: "en_US",
  },
  twitter: {
    title: "Debugging RAG Chatbots and AI Agents with Sessions",
    description: "How well do you understand your users' intents? At which point in the multi-step process does your model start hallucinating? Do you find consistent problems with a specific part of your AI agent workflow?",
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/agent-cover.webp", 
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
