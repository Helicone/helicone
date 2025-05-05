import { Metadata } from "next";
import CustomersPage from "./customersPage";

export const metadata: Metadata = {
  title: "Helicone Customers | AI Companies & Integrations",
  description:
    "Discover the AI companies and integrations powering by Helicone. Join our community and see how teams are building and scaling with our platform.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/customers",
    title: "Helicone Customers | AI Companies & Integrations",
    description:
      "Discover the AI companies and integrations powering by Helicone. Join our community and see how teams are building and scaling with our platform.",
    images: "/static/new-open-graph.png",
    locale: "en_US",
  },
  twitter: {
    title: "Helicone Customers | AI Companies & Integrations",
    description:
      "Discover the AI companies and integrations powering by Helicone. Join our community and see how teams are building and scaling with our platform.",
    card: "summary_large_image",
    images: "/static/new-open-graph.png",
  },
};

export default function Page() {
  return <CustomersPage />;
}
