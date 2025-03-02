import { getMetadata } from "@/components/templates/blog/getMetaData";
import { promises as fs } from "fs";
import { serialize } from "next-mdx-remote/serialize";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import path from "path";
import { RemoteMdxPage } from "./mdxRenderer";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, ChevronLeft, Calendar, Clock } from "lucide-react";
import { TwitterShareButton } from "@/components/blog/TwitterShareButton";
import { Metadata } from "next";

// Define headshots mapping
const HEADSHOTS = {
  "Cole Gottdank": "/static/blog/colegottdank-headshot.webp",
  "Lina Lam": "/static/blog/linalam-headshot.webp",
  "Stefan Bokarev": "/static/blog/stefanbokarev-headshot.webp",
  "Justin Torre": "/static/blog/justintorre-headshot.webp",
  "Scott Nguyen": "/static/blog/scottnguyen-headshot.webp",
  "Kavin Desi": "/static/blog/kavin-headshot.webp",
  "Yusuf Ishola": "/static/blog/yusuf-headshot.webp",
};

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
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight],
    },
  });

  const metadata = await getMetadata(params["file-path"]);

  if (!metadata) {
    notFound();
  }

  return (
    <div className="w-full bg-white h-full antialiased relative">
      <div className="flex flex-col md:flex-row items-start w-full mx-auto max-w-5xl py-16 px-4 md:py-24 relative gap-8">
        <div className="hidden md:flex w-56 h-full flex-col space-y-6 md:sticky top-16 md:top-32">
          <Link
            href="/blog"
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-700 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
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
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-slate-700 text-sm font-medium">
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
                  className="w-9 h-9 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <div className="text-slate-700 text-sm font-medium">
                    {metadata.author}
                  </div>
                </div>
              </div>
            )}
          </div>

          <section className="rounded-xl overflow-hidden border border-sky-100 shadow-sm">
            <div className="bg-sky-50 p-4 space-y-2">
              <h3 className="font-semibold text-slate-700 text-sm">Join Helicone</h3>

              <div className="flex flex-col space-y-1.5 pb-2">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-600 text-sm">Real-time monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-600 text-sm">Cost optimization</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-600 text-sm">Advanced analytics</span>
                </div>
              </div>
              <Link href="https://us.helicone.ai/signin" className="block">
                <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm shadow-none transition-colors">
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
        <article className="prose w-full h-full">
          <h1 className="text-bold text-sky-500">{String(metadata.title)}</h1>

          {/* Desktop date display */}
          <div className="hidden md:flex items-center gap-2 -mt-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm font-medium">{String(metadata.date)}</span>
              <span className="text-slate-400 text-sm font-medium"> · {String(metadata.time)}</span>
            </div>
          </div>

          {/* Mobile view for author info */}
          <div className="flex md:hidden items-center gap-2 -mt-8 -mb-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {metadata.authors && metadata.authors.length > 0 ? (
                  <>
                    {metadata.authors.map((author, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <img
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
                    <img
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
