import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "What is Prompt Management?",
  description:
    "Prompt management for large language models (LLMs) is crucial for optimizing AI interactions. What are the challenges, or the benefits of prompt management tools like Helicone, Pezzo, and Agenta? We will explore what to look for when choosing a prompt management tool for your AI apps. ",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title:
      "What is Prompt Management?",
    url: "https://www.helicone.ai/blog/prompt-management",
    description:
      "Prompt management for large language models (LLMs) is crucial for optimizing AI interactions. What are the challenges, or the benefits of prompt management tools like Helicone, Pezzo, and Agenta? We will explore what to look for when choosing a prompt management tool for your AI apps. ",
    images:
      "https://www.helicone.ai/static/blog/prompt-management/cover.webp",
    locale: "en_US",
  },
  twitter: {
    title:
      "What is Prompt Management?",
    description:
      "Prompt management for large language models (LLMs) is crucial for optimizing AI interactions. What are the challenges, or the benefits of prompt management tools like Helicone, Pezzo, and Agenta? We will explore what to look for when choosing a prompt management tool for your AI apps.", //update
    card: "summary_large_image",
    images:
      "https://www.helicone.ai/static/blog/prompt-management/cover.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
