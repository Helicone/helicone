import React from "react";
import { CustomerCard } from "./CustomerCard";
import { CaseStudyStructureMetaData } from "@/components/templates/customers/getMetaData";

interface OtherCaseStudiesProps {
  caseStudies: CaseStudyStructureMetaData[];
}

export function OtherCaseStudies({ caseStudies }: OtherCaseStudiesProps) {
  // Renders nothing if the input array is not valid
  if (!caseStudies || !Array.isArray(caseStudies) || caseStudies.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-4xl mx-auto flex flex-col gap-2 mb-6">
      {/* Title */}
      {/* <h3 className="font-bold text-2xl text-accent-foreground ml-2">
        Related Stories
      </h3> */}

      {/* Grid of case studies */}
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {caseStudies.map((study, index) => (
          <CustomerCard
            key={index}
            href={`/customers/${study.company.toLowerCase()}`}
            logo={study.logo}
            title={study.title}
          />
        ))}
      </div>
    </section>
  );
}
