import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from 'lucide-react';
import { CaseStudyStructureMetaData, getMetadata } from "@/components/templates/customers/getMetaData";

interface OtherCaseStudiesProps {
  caseStudies: CaseStudyStructureMetaData[];
}

export function OtherCaseStudies({ caseStudies }: OtherCaseStudiesProps) {
  // Renders nothing if the input array is not valid
  if (!caseStudies || !Array.isArray(caseStudies) || caseStudies.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-4xl mx-auto mt-10 mb-6">

      {/* Title */}
      <h3 className="font-bold text-2xl text-accent-foreground">
        Related customer stories
      </h3>

      {/* Grid of case studies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

        {caseStudies.map((study, index) => (
          < Link key={index} href={`/customers/${study.company}`} className="block group" >
            <div className="flex flex-col h-full bg-slate-50 px-4 py-5 gap-2 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 rounded-lg duration-200">

              {/* Logo and Title Wrapper */}
              <div className="flex flex-col items-left gap-4 flex-grow">
                {/* Logo */}
                <div className="h-10 flex items-center grayscale">
                  <Image
                    src={study.logo}
                    alt={`${study.company} logo`}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>

                {/* Title */}
                <p className="text-accent-foreground text-md leading-relaxed line-clamp-2 font-semibold flex-grow">
                  {study.title}
                </p>
              </div>

              {/* Read Story Wrapper */}
              <div className="pt-2">
                <div className="flex items-center text-accent-foreground text-sm font-normal">
                  Read story
                  <ArrowUpRight className="size-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section >
  );
}
