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
    title: "A step by step guide to switch to gpt-4o safely with Helicone", 
    url: "https://www.helicone.ai/blog/switch-models-safely",
    description: "Learn how to use Helicone's experiments features to regression test, compare and switch models.",
    images: "https://www.helicone.ai/static/blog/experiments/gpt-4o.png",
    locale: "en_US",
  },
  twitter: {
    title: "A step by step guide to switch to gpt-4o safely with Helicone", 
    description: "Learn how to use Helicone's experiments features to regression test, compare and switch models.", 
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/experiments/gpt-4o.png", 
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
