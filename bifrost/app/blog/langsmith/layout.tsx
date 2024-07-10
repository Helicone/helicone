import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "A LangSmith Alternative that Takes LLM Observability to the Next Level - Helicone",
  description:
    "Both Helicone and LangSmith are capable, powerful DevOps platform used by enterprises and developers building LLM applications. But which is better?",
  icons: "https://www.helicone.ai/static/logo.png",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title:
      "A LangSmith Alternative that Takes LLM Observability to the Next Level",
    url: "https://www.helicone.ai/blog/langsmith",
    description:
      "Both Helicone and LangSmith are capable, powerful DevOps platform used by enterprises and developers building LLM applications. But which is better?",
    images:
      "https://www.helicone.ai/static/blog/langsmith-vs-helicone/cover-image.webp",
    locale: "en_US",
  },
  twitter: {
    title:
      "A LangSmith Alternative that Takes LLM Observability to the Next Level",
    description:
      "Both Helicone and LangSmith are capable, powerful DevOps platform used by enterprises and developers building LLM applications. But which is better?",
    card: "summary_large_image",
    images:
      "https://www.helicone.ai/static/blog/langsmith-vs-helicone/cover-image.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
