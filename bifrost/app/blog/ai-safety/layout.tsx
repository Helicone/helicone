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
    title: "Why Observability is the key to ethical and safe Artificial Intelligence",
    url: "https://helicone.ai/blog/ai-safety",
    description: "As AI continues to shape our world, the need for ethical practices and robust observability has never been greater. Learn how Helicone is rising to the challenge.", 
    images: "https://www.helicone.ai/static/blog/AI.webp",
    locale: "en_US",
  },
  twitter: {
    title: "Why Observability is the key to ethical and safe Artificial Intelligence", 
    description: "As AI continues to shape our world, the need for ethical practices and robust observability has never been greater. Learn how Helicone is rising to the challenge.",
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/AI.webp", 
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
