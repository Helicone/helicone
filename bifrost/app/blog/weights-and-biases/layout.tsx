import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Helicone vs. Weights and Biases",
  description:
    "Training modern LLMs is generally less complex than traditional ML models. Here's how to have all the essential tools specifically designed for language model observability without the clutter.",
  icons: "https://www.helicone.ai/static/logo.png",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title: "Helicone vs. Weights and Biases",
    url: "https://www.helicone.ai/blog/weights-and-biases",
    description:
      "Training modern LLMs is generally less complex than traditional ML models. Here's how to have all the essential tools specifically designed for language model observability without the clutter.",
    images: "https://www.helicone.ai/static/blog/weights-and-biases.webp",
    locale: "en_US",
  },
  twitter: {
    title: "Helicone vs. Weights and Biases",
    description:
      "Training modern LLMs is generally less complex than traditional ML models. Here's how to have all the essential tools specifically designed for language model observability without the clutter.",
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/weights-and-biases.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
