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
    title: "Navigating Life After Y Combinator: Three Key Lessons for Startups", 
    url: "https://www.helicone.ai/blog/life-after-yc",
    description: "From maintaining crucial relationships to keeping a razor-sharp focus, here's how to sustain your momentum after the YC batch ends.", 
    images: "https://www.helicone.ai/static/blog/yc.webp",
    locale: "en_US",
  },
  twitter: {
    title: "Navigating Life After Y Combinator: Three Key Lessons for Startups", 
    description: "From maintaining crucial relationships to keeping a razor-sharp focus, here's how to sustain your momentum after the YC batch ends.",
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/yc.webp",
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
