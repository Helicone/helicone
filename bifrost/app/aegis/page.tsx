import { Metadata } from "next";
import AegisLanding from "./components/AegisLanding";

export const metadata: Metadata = {
  title: "AEGIS: AGI Early Governance & Intervention System",
  description:
    "Advanced threat detection and intervention system for monitoring AGI emergence through API traffic patterns.",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/aegis",
    title: "AEGIS: AGI Early Governance & Intervention System",
    description:
      "Advanced threat detection and intervention system for monitoring AGI emergence through API traffic patterns.",
    images: "/static/aegis/aegis-banner.png",
    locale: "en_US",
  },
  twitter: {
    title: "AEGIS: AGI Early Governance & Intervention System",
    description:
      "Advanced threat detection and intervention system for monitoring AGI emergence through API traffic patterns.",
    card: "summary_large_image",
    images: "/static/aegis/aegis-banner.png",
  },
};

export default function AegisPage() {
  return (
    <div className="w-full">
      <AegisLanding />
    </div>
  );
}
