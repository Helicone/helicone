import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "Introducing Vault: Helicone's Key Management Solution For LLM Applications",
  description:
    "Helicone unveils Vault, transforming the way businesses manage and distribute LLM API keys, ensuring enhanced security and streamlined processes.",
  icons: "https://www.helicone.ai/static/logo.png",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    title: "Introducing Vault: Helicone's Key Management Solution",
    url: "https://www.helicone.ai/blog/vault-introduction",
    description:
      "Helicone unveils Vault, transforming the way businesses manage and distribute API keys, ensuring enhanced security and streamlined processes.",
    images: "https://www.helicone.ai/static/blog/vault_banner.webp",
    locale: "en_US",
  },
  twitter: {
    title: "Introducing Vault: Helicone's Key Management Solution",
    description:
      "Helicone unveils Vault, transforming the way businesses manage and distribute API keys, ensuring enhanced security and streamlined processes.",
    card: "summary_large_image",
    images: "https://www.helicone.ai/static/blog/vault_banner.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
