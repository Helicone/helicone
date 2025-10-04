"use client";

import { useMDXComponents } from "@/mdx-components";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { CaseStudyStructureMetaData } from "@/components/templates/customers/getMetaData";
import { OtherCaseStudies } from "@/components/customers/OtherCaseStudies";

interface Props {
  mdxSource: MDXRemoteSerializeResult;
  relatedStudiesData?: CaseStudyStructureMetaData[];
}

export function RemoteMdxPage({ mdxSource, relatedStudiesData = [] }: Props) {
  const baseComponents = useMDXComponents({});

  const DynamicOtherCaseStudies = (props: any) => (
    <OtherCaseStudies {...props} caseStudies={relatedStudiesData} />
  );

  const components = {
    ...baseComponents,
    OtherCaseStudies: DynamicOtherCaseStudies,
  };

  return <MDXRemote {...mdxSource} components={components} />;
}
