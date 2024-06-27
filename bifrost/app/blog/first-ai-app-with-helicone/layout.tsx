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
    title: "I built my first AI app and integrated it with Helicone", 
    url: "https://www.helicone.ai/blog/first-ai-app-with-helicone",
    description: "So I decided to make my first AI app with Helicone, in the spirit of getting a first-hand exposure to our user's pain points. ",
    images: "https://www.helicone.ai/static/blog/first-ai-app/lina-first-ai-app.webp",
    locale: "en_US",
  },
  twitter: {
    title: "I built my first AI app and integrated it with Helicone", 
    description: "So I decided to make my first AI app with Helicone, in the spirit of getting a first-hand exposure to our user's pain points. ",// 
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/first-ai-app/lina-first-ai-app.webp",
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
