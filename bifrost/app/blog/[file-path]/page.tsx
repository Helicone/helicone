import { getMetadata } from "@/components/templates/blog/getMetaData";
import { promises as fs } from "fs";
import { serialize } from "next-mdx-remote/serialize";
import Link from "next/link";
import { notFound } from "next/navigation";
import path from "path";
import { RemoteMdxPage } from "./mdxRenderer";
import remarkGfm from "remark-gfm";
import remarkToc from "remark-toc";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import "highlight.js/styles/atom-one-dark.css";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { TwitterShareButton } from "@/components/blog/TwitterShareButton";
import { HEADSHOTS } from "../page";

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
    "blog",
    "blogs",
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

  return (
    <div className="relative h-full w-full bg-white antialiased">
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-start gap-8 px-4 py-16 md:flex-row md:py-24">
        <div className="top-16 hidden h-full w-56 flex-col space-y-6 md:sticky md:top-32 md:flex">
          <Link
            href="/blog"
            className="group flex items-center gap-1.5 text-slate-600 transition-colors hover:text-slate-700"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm font-medium">Back</span>
          </Link>

          {/* Author information - simplified */}
          <div className="p-2">
            {metadata.authors && metadata.authors.length > 0 ? (
              <div className="space-y-4">
                {metadata.authors.map((author, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img
                      src={HEADSHOTS[author as keyof typeof HEADSHOTS]}
                      alt={`${author}'s headshot`}
                      className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-700">
                        {author}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <img
                  src={HEADSHOTS[metadata.author as keyof typeof HEADSHOTS]}
                  alt={`${metadata.author}'s headshot`}
                  className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                />
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    {metadata.author}
                  </div>
                </div>
              </div>
            )}
          </div>

          <section className="overflow-hidden rounded-xl border border-sky-100 shadow-sm">
            <div className="space-y-2 bg-sky-50 p-4">
              <h3 className="text-sm font-semibold text-slate-700">
                Join Helicone
              </h3>

              <div className="flex flex-col space-y-1.5 pb-2">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    Real-time monitoring
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    Cost optimization
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    Advanced analytics
                  </span>
                </div>
              </div>
              <Link href="https://us.helicone.ai/signin" className="block">
                <Button className="w-full bg-sky-500 text-sm font-medium text-white shadow-none transition-colors hover:bg-sky-600">
                  Get started for free
                  <ChevronRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </Link>
              <TwitterShareButton
                title={String(metadata.title)}
                path={params["file-path"]}
              />
            </div>
          </section>
        </div>
        <article className="prose h-full w-full">
          <h1 className="text-bold text-sky-500">{String(metadata.title)}</h1>

          {/* Desktop date display */}
          <div className="-mt-4 mb-8 hidden items-center gap-2 md:flex">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">
                {String(metadata.date)}
              </span>
              <span className="text-sm font-medium text-slate-400">
                {" "}
                · {String(metadata.time)}
              </span>
            </div>
          </div>

          {/* Mobile view for author info */}
          <div className="-mb-6 -mt-8 flex items-center gap-2 md:hidden">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                {metadata.authors && metadata.authors.length > 0 ? (
                  <>
                    {metadata.authors.map((author, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <img
                          src={HEADSHOTS[author as keyof typeof HEADSHOTS]}
                          alt={`${author}'s headshot`}
                          className="h-8 w-8 rounded-full"
                        />
                        <span className="text-sm font-medium text-slate-500">
                          {author}
                          {i < (metadata.authors?.length ?? 0) - 1 && ","}
                        </span>
                      </div>
                    ))}
                    <span className="text-sm font-medium text-slate-400">
                      · {String(metadata.date)}
                    </span>
                  </>
                ) : (
                  <>
                    <img
                      src={HEADSHOTS[metadata.author as keyof typeof HEADSHOTS]}
                      alt={`${metadata.author}'s headshot`}
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="text-sm font-medium text-slate-600">
                      {metadata.author}
                    </span>
                    <span className="text-sm font-medium text-slate-400">
                      · {String(metadata.date)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <RemoteMdxPage mdxSource={mdxSource} />
        </article>
      </div>
    </div>
  );
}
