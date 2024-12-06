import { Metadata } from "next";
import CommunityPage from "./communityPage";

export const metadata: Metadata = {
  title: "Helicone Community | AI Projects & Integrations",
  description:
    "Discover the AI companies and integrations powering by Helicone. Join our community and see how teams are building and scaling with our platform.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/community",
    title: "Helicone Community | AI Projects & Integrations",
    description:
      "Discover the AI companies and integrations powering by Helicone. Join our community and see how teams are building and scaling with our platform.",
    images: "/static/new-open-graph.png",
    locale: "en_US",
  },
  twitter: {
    title: "Helicone Community | AI Projects & Integrations",
    description:
      "Discover the AI companies and integrations powering by Helicone. Join our community and see how teams are building and scaling with our platform.",
    card: "summary_large_image",
    images: "/static/new-open-graph.png",
  },
};

export default function Page() {
  return <CommunityPage />;
}
