import { Metadata } from "next";
import WaitlistPage from "./waitlistPage";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Join the Waitlist | Helicone Credits - $0 Surcharge LLM Billing",
  description:
    "Get LLM billing at provider prices with $0 platform fees. Helicone's full observability platform included. No markups, no hidden fees.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/credits",
    title: "Join the Waitlist | Helicone Credits - $0 Surcharge LLM Billing",
    description:
      "Get LLM billing at provider prices with $0 platform fees. Helicone's full observability platform included. No markups, no hidden fees.",
    images: "/static/new-open-graph.png",
    locale: "en_US",
  },
  twitter: {
    title: "Join the Waitlist | Helicone Credits - $0 Surcharge LLM Billing",
    description:
      "Get LLM billing at provider prices with $0 platform fees. Helicone's full observability platform included. No markups, no hidden fees.",
    card: "summary_large_image",
    images: "/static/new-open-graph.png",
  },
};

export default function Page() {
  return (
    <div className="container mx-auto">
      <Suspense
        fallback={
          <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto">
            Loading...
          </div>
        }
      >
        <WaitlistPage />
      </Suspense>
    </div>
  );
}
