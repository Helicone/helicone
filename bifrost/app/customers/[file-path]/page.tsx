import { getMetadata } from "@/components/templates/customers/getMetaData";
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
      rehypePlugins: [
        rehypeSlug,
        rehypeHighlight,
      ],
    },
  });

  const metadata = await getMetadata(params["file-path"]);

  if (!metadata) {
    notFound();
  }

  return (
    <div className="w-full bg-white h-full antialiased relative">
      <div className="flex flex-col md:flex-row items-start w-full mx-auto max-w-5xl py-16 px-4 md:py-24 relative gap-8">
        <div className="hidden md:flex w-56 h-full flex-col space-y-6 md:sticky top-16 md-top-32">
          <Link
            href="/customers"
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-700 transition-colors group"
          >
            <ChevronLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">All stories</span>
          </Link>
          <section className="flex flex-col gap-6 overflow-hidden">
            <div className="flex flex-col gap-1 px-2">
              <p className="text-muted-foreground text-sm font-medium">Customer since</p>
              <span className="text-accent-foreground text-sm font-medium">
                {new Date(metadata.customerSince).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex flex-col gap-1 px-2">
              <p className="text-muted-foreground text-sm font-medium">Website</p>
              <a
                href={`https://${String(metadata.url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-foreground text-sm font-medium hover:underline"
              >
                {String(metadata.url)}
              </a>
            </div>
            <div className="bg-slate-50 px-3 py-5 space-y-2 border-2 border-slate-100 shadow-sm rounded-lg">
              <div className="flex flex-col items-left gap-4 grayscale">
                <Image
                  src={metadata.logo}
                  alt={metadata.title}
                  width={100}
                  height={100}
                  style={{ objectFit: "contain" }}
                />
                <span className="text-slate-600 text-sm">
                  {String(metadata.description)}
                </span>
              </div>
            </div>
          </section>
        </div>
        <article className="prose w-full h-full">
          <h1 className="text-bold text-sky-500">{String(metadata.title)}</h1>
          <div className="w-full my-8 bg-slate-100 p-4 rounded-xl border-2 border-slate-100">
            <Image
              src={metadata.logo}
              alt={`${metadata.title} logo`}
              width={500} // Base width for optimization, aspect ratio will override visual height
              height={333} // Base height corresponding to 2/3 of width for optimization
              className="w-1/3 object-contain mx-auto aspect-[3/3]"
              priority
            />
          </div>
          <RemoteMdxPage mdxSource={mdxSource} />
        </article >
      </div >
    </div >
  );
}
