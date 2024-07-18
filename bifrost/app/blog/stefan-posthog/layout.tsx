import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Insider Scoop: Our Founding Engineer's Take on PostHog - Helicone",
  description:
    "No BS, no affiliations, just genuine opinions from the founding engineer at Helicone.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title: "Insider Scoop: Our Founding Engineer's Take on PostHog 🦔🔥",
    url: "https://www.helicone.ai/blog/stefan-posthog",
    description:
      "No BS, no affiliations. Just genuine opinions from Stefan, our founding engineer.",
    images:
      "https://www.helicone.ai/static/blog/stefan-posthog/posthog-cover.webp",
    locale: "en_US",
  },
  twitter: {
    title: "Insider Scoop: Our Founding Engineer's Take on PostHog 🦔🔥",
    description:
      "No BS, no affiliations. Just genuine opinions from Stefan, our founding engineer.",
    card: "summary_large_image",
    images:
      "https://www.helicone.ai/static/blog/stefan-posthog/posthog-cover.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
