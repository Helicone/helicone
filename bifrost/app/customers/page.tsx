import { Metadata } from "next";
import { CaseStudies } from "@/components/customers/CaseStudies";
import { Projects } from "@/components/customers/Projects";
import Image from "next/image";
import { CaseStudiesCTA } from "@/components/customers/CaseStudiesCTA";

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
  return (
    <div className="relative flex h-full w-full flex-col gap-2 antialiased">
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-2 pt-8 text-center sm:px-2 lg:px-0">
        <Image
          src={"/static/customers/shiny-cube.webp"}
          alt={"shiny-cube"}
          width={200}
          height={200}
        />
        <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl">
          Customer Stories
        </h1>
        <p className="mt-[12px] text-sm text-gray-700 sm:text-lg">
          Leading companies using Helicone to optimize and
          <br />
          scale their AI applications.
        </p>
      </div>
      <CaseStudies />
      <Projects />
      <CaseStudiesCTA />
    </div>
  );
}
