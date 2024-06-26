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
    title: "Insider Scoop: Our Co-founder's Take on GitHub Copilot 🔥",
    url: "https://www.helicone.ai/blog/cole-github-copilot",
    description: "No BS, no affiliations, just genuine opinions from Helicone's co-founder.",
    images: "https://www.helicone.ai/static/blog/cole-copilot.webp",
    locale: "en_US",
  },
  twitter: {
    title: "Insider Scoop: Our Co-founder's Take on GitHub Copilot 🔥",
    description: "No BS, no affiliations, just genuine opinions from Helicone's co-founder.",
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/cole-copilot.webp",
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
