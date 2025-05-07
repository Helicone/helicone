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
    <div className="w-full h-full flex flex-col antialiased relative gap-2">
      <div className="flex flex-col gap-4 w-full h-full justify-center pt-8 items-center text-center px-2 sm:px-2 lg:px-0">
        <Image
          src={"/static/customers/shiny-cube.webp"}
          alt={"shiny-cube"}
          width={200}
          height={200}
        />
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-4xl">
          Customer Stories
        </h1>
        <p className="mt-[12px] text-sm sm:text-lg text-gray-700">
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
