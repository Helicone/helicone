import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "What is LLM Observability?",
  description:
    "Building with LLM in production is incredibly difficult. Here's a very in-depth read by Arize AI addressing the biggest challenges and why LLM observability is crucial.",
  icons: "https://www.helicone.ai/static/logo.png",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title:
      "What is LLM Observability?", 
    url: "https://www.helicone.ai/blog/llm-observability", 
    description:
      "Building with LLM in production is incredibly difficult. Here's a very in-depth read by Arize AI addressing the biggest challenges and why LLM observability is crucial.",
    images:
      "https://www.helicone.ai/static/blog/llm-observability.webp", 
    locale: "en_US",
  },
  twitter: {
    title:
      "What is LLM Observability?", 
    description:
      "Building with LLM in production is incredibly difficult. Here's a very in-depth read by Arize AI addressing the biggest challenges and why LLM observability is crucial.", 
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
