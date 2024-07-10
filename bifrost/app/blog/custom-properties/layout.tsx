import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "How to Understand Your Users Better and Deliver a Top-Tier Experience with Custom Properties - Helicone",
  description:
    "In today's digital landscape, every interaction, click, and engagement offers valuable insights into your users' preferences. But how do you harness this data to effectively grow your business? We may have the answer. ",
  icons: "https://www.helicone.ai/static/logo.png",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title:
      "How to Understand Your Users Better and Deliver a Top-Tier Experience with Custom Properties",
    url: "https://www.helicone.ai/blog/custom-properties",
    description:
      "In today's digital landscape, every interaction, click, and engagement offers valuable insights into your users' preferences. But how do you harness this data to effectively grow your business? We may have the answer. ",
    images: "https://www.helicone.ai/static/blog/custom-properties/cover.webp",
    locale: "en_US",
  },
  twitter: {
    title:
      "How to Understand Your Users Better and Deliver a Top-Tier Experience with Custom Properties",
    description:
      "In today's digital landscape, every interaction, click, and engagement offers valuable insights into your users' preferences. But how do you harness this data to effectively grow your business? We may have the answer. ",
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/custom-properties/cover.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
