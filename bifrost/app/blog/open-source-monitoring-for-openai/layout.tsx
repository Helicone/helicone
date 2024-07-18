import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "The Next Evolution in OpenAI Monitoring and Optimization - Helicone",
  description:
    "Learn how Helicone provides unmatched insights into your OpenAI usage, allowing you to monitor, optimize, and take control like never before.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title: "The Next Evolution in OpenAI Monitoring and Optimization",
    url: "https://www.helicone.ai/blog/open-source-monitoring-for-openai",
    description:
      "Learn how Helicone provides unmatched insights into your OpenAI usage, allowing you to monitor, optimize, and take control like never before.",
    images:
      "https://www.helicone.ai/static/blog/langsmith-vs-helicone/cover-image.webp", // <-- update
    locale: "en_US",
  },
  twitter: {
    title: "The Next Evolution in OpenAI Monitoring and Optimization",
    description:
      "Learn how Helicone provides unmatched insights into your OpenAI usage, allowing you to monitor, optimize, and take control like never before.",
    card: "summary_large_image",
    images:
      "https://www.helicone.ai/static/blog/langsmith-vs-helicone/cover-image.webp", // <-- update
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
