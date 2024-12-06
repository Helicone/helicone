import { Metadata } from "next";
import PricingPage from "./pricingPage";

export const metadata: Metadata = {
  title: "Pricing | Helicone",
  description:
    "Find a plan that accelerates your business. Usage-based pricing that scales with you. ",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/pricing",
    title: "Pricing | Helicone",
    description:
      "Find a plan that accelerates your business. Usage-based pricing that scales with you. ",
    images: "/static/new-open-graph.png",
    locale: "en_US",
  },
  twitter: {
    title: "Pricing | Helicone",
    description:
      "Find a plan that accelerates your business. Usage-based pricing that scales with you. ",
    card: "summary_large_image",
    images: "/static/new-open-graph.png",
  },
};

export default function Page() {
  return <PricingPage />;
}
