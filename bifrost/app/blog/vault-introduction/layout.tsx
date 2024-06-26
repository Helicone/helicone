import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

// ---
// title: "Introducing Vault: Helicone's Key Management Solution"
// description: "Helicone unveils Vault, transforming the way businesses manage and distribute API keys, ensuring enhanced security and streamlined processes."
// keywords: "Vault, Helicone, API Key Management"
// canonical_url: "https://helicone.ai/blog/vault"
// author: "Cole Gottdank"
// date: "Sep 13, 2023"
// time: "3 minute read"
// icon: "product"
// ---

export const metadata: Metadata = {
  title: "Helicone / LLM-Observability for Developers",
  description: "The open-source platform for logging, monitoring, and debugging.",
  icons: "https://www.helicone.ai/static/logo.png", 
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title: "Introducing Vault: Helicone's Key Management Solution", 
    url: "https://www.helicone.ai/blog/vault-introduction",
    description: "Helicone unveils Vault, transforming the way businesses manage and distribute API keys, ensuring enhanced security and streamlined processes.", 
    images: "https://www.helicone.ai/static/blog/vault_banner.png",
    locale: "en_US",
  },
  twitter: {
    title: "Introducing Vault: Helicone's Key Management Solution", 
    description: "Helicone unveils Vault, transforming the way businesses manage and distribute API keys, ensuring enhanced security and streamlined processes.",
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/vault_banner.png",
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
