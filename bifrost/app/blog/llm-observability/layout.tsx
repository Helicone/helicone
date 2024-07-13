import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "What is LLM Observability and Monitoring?",
  description:
    "Building with LLMs in production (well) is incredibly difficult. You probably have heard of the word 'LLM observability'. What is it? How does it differ from traditional observability? What is observed? We have the answers. ",
  icons: "https://www.helicone.ai/static/logo.png",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title:
      "What is LLM Observability and Monitoring?", 
    url: "https://www.helicone.ai/blog/llm-observability", 
    description:
      "Building with LLMs in production (well) is incredibly difficult. You probably have heard of the word 'LLM observability'. What is it? How does it differ from traditional observability? What is observed? We have the answers. ",
    images:
      "https://www.helicone.ai/static/blog/llm-observability.webp", 
    locale: "en_US",
  },
  twitter: {
    title:
      "What is LLM Observability and Monitoring?", 
    description:
      "Building with LLMs in production (well) is incredibly difficult. You probably have heard of the word 'LLM observability'. What is it? How does it differ from traditional observability? What is observed? We have the answers. ", 
    card: "summary_large_image",
    images:
      "https://www.helicone.ai/static/blog/llm-observability.webp", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
