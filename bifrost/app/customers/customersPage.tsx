import { clsx } from "@/components/shared/utils";
import Image from "next/image";
import { CaseStudies } from "./caseStudies";
import { Projects } from "./projects";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function CustomersPage() {
  return (
    <div className="w-full h-full flex flex-col antialiased relative gap-2">
      <div className="flex flex-col gap-4 w-full h-full justify-center pt-8 items-center text-center px-2 sm:px-2 lg:px-0">
        <Image
          src={"/static/community/shiny-cube.webp"}
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
    </div>
  );
}
