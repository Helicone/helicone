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
    <section className="w-full max-w-4xl mx-auto mt-10 mb-6 px-4 md:px-0">
      <h3 className="font-bold text-2xl text-gray-700">
        Related customer stories
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {caseStudies.map((study, index) => (
          <Link key={index} href={study.url} className="block group no-underline">
            <div className="bg-slate-50 px-3 py-5 space-y-2 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 rounded-lg flex flex-col h-full duration-200">
              <div className="flex flex-col items-left gap-4 flex-grow">
                <div className="h-10 flex items-center grayscale group-hover:grayscale-0 transition-all duration-200">
                  <Image
                    src={study.logo}
                    alt={`${study.title} logo`}
                    width={100}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <p className="text-accent-foreground text-md leading-relaxed line-clamp-2 font-medium flex-grow">
                  {study.title}
                </p>
              </div>
              <div className="pt-2">
                <div className="flex items-center text-neutral-600 group-hover:text-neutral-900 text-sm font-md">
                  Read story
                  <ArrowUpRight className="h-4 w-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section >
  );
}
