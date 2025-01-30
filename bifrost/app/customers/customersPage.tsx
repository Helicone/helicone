import { clsx } from "@/components/shared/utils";
import Image from "next/image";
import { CaseStudies } from "./caseStudies";
import { Projects } from "./projects";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface CustomersPageProps {
  searchParams: { category?: string; q?: string };
}

export default function CustomersPage({ searchParams }: CustomersPageProps) {

  return (
    <div className="w-full bg-white h-full antialiased relative text-black mb-[24px]">
      <div className="relative w-full flex flex-col space-y-4 mx-auto max-w-5xl h-full py-16 items-center text-center px-2 sm:px-2 lg:px-0">
        <Image
          src={"/static/community/shiny-cube.webp"}
          alt={"shiny-cube"}
          width={200}
          height={100}
        />
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-4xl">
          Customer Stories
        </h1>
        <p className="mt-[12px] text-sm sm:text-lg text-gray-700">
          Leading companies using Helicone to optimize and scale their AI
          applications.
        </p>

        <CaseStudies searchParams={searchParams} />

        <h2 className="text-3xl font-semibold tracking-tight max-w-4xl">
          Community Projects
        </h2>
        <p className="mt-[12px] text-sm sm:text-lg text-gray-700">
          Products built with Helicone, by our amazing community of developers.
        </p>
        <Button variant="outline" asChild>
          <Link
            href="https://forms.gle/WpTEEE6vVdQccprD9"
            target="_blank"
            rel="noopener"
            className="flex items-center"
          >
            <Sparkles className="size-4 mr-2" />
            Share Your Project
          </Link>
        </Button>
        <Projects />
      </div>
    </div>
  );
}
