import { Metadata } from "next";
import CommunityPage from "./CommunityPage";

export const metadata: Metadata = {
  title: "Community | Helicone",
  description:
    "All projects and companies we love who are using Helicone, and cool integrations.",
  openGraph: {
    title: "Community | Helicone",
    description:
      "All projects and companies we love who are using Helicone, and cool integrations.",
    url: "https://www.helicone.ai/community",
    siteName: "Helicone",
    type: "website",
  },
  twitter: {
    title: "Community | Helicone",
    description:
      "All projects and companies we love who are using Helicone, and cool integrations.",
    card: "summary_large_image",
  },
};

export default function Page() {
  return <CommunityPage />;
}
