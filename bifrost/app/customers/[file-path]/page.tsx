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
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, ChevronLeft, Globe } from "lucide-react";

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
          <section className="rounded-xl overflow-hidden">
            <div className="bg-sky-50 p-4 space-y-2 border border-sky-100 shadow-sm">
              <div className="flex flex-col items-left gap-4">
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

          {/* Desktop date display */}
          <div className="hidden md:flex items-center gap-2 -mt-4 mb-8">
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-sm font-medium">Customer since</p>
              <span className="text-muted-foreground text-sm font-medium">
                {new Date(metadata.customerSince).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
              <Globe className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm font-medium">
                {String(metadata.url)}
              </span>
            </div>
          </div>

          {/* Mobile view for author info
          <div className="flex md:hidden items-center gap-2 -mt-8 -mb-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {metadata.authors && metadata.authors.length > 0 ? (
                  <>
                    {metadata.authors.map((author, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {/* <img
                          src={HEADSHOTS[author as keyof typeof HEADSHOTS]}
                          alt={`${author}'s headshot`}
                          className="w-8 h-8 rounded-full"
                        /> 
          <span className="text-slate-500 text-sm font-medium">
            {author}
            {i < (metadata.authors?.length ?? 0) - 1 && ","}
          </span>
      </div>
                    ))}
      <span className="text-slate-400 text-sm font-medium">
        · {String(metadata.date)}
      </span>
    </>
  ) : (
    <>
      {/* <img
                      src={HEADSHOTS[metadata.author as keyof typeof HEADSHOTS]}
                      alt={`${metadata.author}'s headshot`}
                      className="w-8 h-8 rounded-full"
                    /> 
      <span className="text-slate-600 text-sm font-medium">
        {metadata.author}
      </span>
      <span className="text-slate-400 text-sm font-medium">
        · {String(metadata.date)}
      </span>
    </>
  )
}
              </div >
            </div >
          </div > */}

          <RemoteMdxPage mdxSource={mdxSource} />
        </article >
      </div >
    </div >
  );
}
