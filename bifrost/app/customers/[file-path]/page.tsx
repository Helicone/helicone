import {
  getMetadata,
  CaseStudyStructureMetaData,
} from "@/components/templates/customers/getMetaData";
import { promises as fs } from "fs";
import { serialize } from "next-mdx-remote/serialize";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import path from "path";
import { RemoteMdxPage } from "./mdxRenderer";
import remarkGfm from "remark-gfm";
import remarkToc from "remark-toc";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import "highlight.js/styles/atom-one-dark.css";
import { ChevronLeft } from "lucide-react";
import { OtherCaseStudies } from "@/components/customers/OtherCaseStudies";
import {
  formatCustomerSince,
  formatLastUpdated,
} from "@/components/customers/CaseStudies";

export default async function Home({
  params,
}: {
  params: {
    "file-path": string;
  };
}) {
  const changelogFolder = path.join(
    process.cwd(),
    "app",
    "customers",
    "case-studies",
    params["file-path"],
    "src.mdx"
  );

  const source = await fs.readFile(changelogFolder, "utf8");

  const mdxSource = await serialize(source, {
    mdxOptions: {
      remarkPlugins: [
        remarkGfm,
        [remarkToc, { heading: "Table of Contents", tight: true, maxDepth: 2 }],
      ],
      rehypePlugins: [rehypeSlug, rehypeHighlight],
    },
  });

  const metadata = await getMetadata(params["file-path"]);

  if (!metadata) {
    notFound();
  }

  // Fetch metadata for related studies
  let relatedStudiesData: CaseStudyStructureMetaData[] = [];
  if (metadata && Array.isArray(metadata.relatedStudies)) {
    const results = await Promise.all(
      metadata.relatedStudies.map((slug) => getMetadata(slug)) // Fetch metadata for each slug
    );
    relatedStudiesData = results.filter(
      (study): study is CaseStudyStructureMetaData => study !== null
    ); // Filter out nulls and type guard
  }

  return (
    <div className="relative h-full w-full bg-white antialiased">
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-start gap-8 px-4 py-16 sm:flex-row md:py-24">
        {/* Left Column */}
        <div className="md-top-32 top-24 hidden h-full w-56 flex-col gap-6 sm:sticky sm:flex">
          {/* Back to all stories */}
          <Link
            href="/customers"
            className="group flex items-center gap-1.5 text-slate-600 transition-colors hover:text-slate-700"
          >
            <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm font-medium">All stories</span>
          </Link>

          {/* Customer info */}
          <section className="flex flex-col gap-6 overflow-hidden">
            <div className="flex flex-col gap-1 px-2">
              <p className="text-muted-foreground text-sm font-medium">
                Customer since
              </p>
              <span className="text-accent-foreground text-sm font-medium">
                {formatCustomerSince(metadata.customerSince)}
              </span>
            </div>
            <div className="flex flex-col gap-1 px-2">
              <p className="text-muted-foreground text-sm font-medium">
                Website
              </p>
              <a
                href={`https://${String(metadata.url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-foreground text-sm font-medium hover:underline"
              >
                {String(metadata.url)}
              </a>
            </div>
            <div className="flex flex-col gap-1 px-2">
              <p className="text-muted-foreground text-sm font-medium">
                Written on
              </p>
              <span className="text-accent-foreground text-sm font-medium">
                {formatLastUpdated(metadata.date ? metadata.date : "") || ""}
              </span>
            </div>
            <div className="space-y-2 rounded-lg border-2 border-slate-100 bg-slate-50 px-3 py-5 shadow-sm">
              <div className="items-left flex flex-col gap-4 grayscale">
                <Image
                  src={metadata.logo}
                  alt={metadata.title}
                  width={100}
                  height={100}
                  style={{ objectFit: "contain" }}
                />
                <span className="text-sm text-slate-600">
                  {String(metadata.description)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column Container */}
        <div className="flex w-full flex-col gap-8 md:gap-12">
          {/* Main Content */}
          <article className="prose h-full">
            <h1 className="text-bold text-brand">{String(metadata.title)}</h1>
            {/* Mobile View for Customer Info */}
            <div className="-mb-6 -mt-8 flex gap-4 overflow-hidden sm:hidden">
              {/* Customer info */}
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground text-sm font-medium">
                  Customer since
                </p>
                <span className="text-accent-foreground text-sm font-medium">
                  {formatCustomerSince(metadata.customerSince)}
                </span>
                ·
                <a
                  href={`https://${String(metadata.url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-foreground text-sm font-medium hover:underline"
                >
                  {String(metadata.url)}
                </a>
              </div>
            </div>
            {/* Customer logo */}
            <div className="my-8 w-full rounded-xl border-2 border-slate-100 bg-slate-100 p-4">
              <Image
                src={metadata.logo}
                alt={`${metadata.title} logo`}
                width={500} // Base width for optimization, aspect ratio will override visual height
                height={333} // Base height corresponding to 2/3 of width for optimization
                className="mx-auto aspect-[3/3] w-1/3 object-contain"
                priority
              />
            </div>
            {/* Pass related studies data to the MDX renderer */}
            <RemoteMdxPage
              mdxSource={mdxSource}
              relatedStudiesData={relatedStudiesData}
            />
          </article>

          {/* Related Stories (Outside Prose) */}
          <OtherCaseStudies caseStudies={relatedStudiesData} />
        </div>
      </div>
    </div>
  );
}
