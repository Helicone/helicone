import { getMetadata } from "@/components/templates/blog/getMetaData";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import { promises as fs } from "fs";
import { serialize } from "next-mdx-remote/serialize";
import Link from "next/link";
import { notFound } from "next/navigation";
import path from "path";
import { RemoteMdxPage } from "./mdxRenderer";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { TwitterShareButton } from "@/components/blog/TwitterShareButton";

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
      <div className="flex flex-col md:flex-row items-start w-full mx-auto max-w-5xl py-16 px-4 md:py-24 relative gap-6">
        <div className="hidden md:flex w-56 h-full flex-col space-y-2 md:sticky top-16 md:top-32">
          <Link href="/blog" className="flex items-center gap-1">
            <ChevronLeftIcon className="w-4 h-4" />
            <span className="text-sm font-bold">back</span>
          </Link>
          <section className="hidden md:block w-52 mt-6 mb-2 pt-3">
            <div className="rounded-lg bg-[#F2F9FC] px-4 py-3 space-y-2 border border-[#E3EFF3]">
              <div>
                <p className="text-[#6B8C9C] text-sm leading-relaxed">
                  Join Helicone&apos;s community to monitor and optimize your
                  LLM app in real-time.
                </p>
              </div>
              <Link href="https://us.helicone.ai/signin" className="block">
                <Button className="w-full bg-[#0DA5E8] hover:bg-[#0C94D1] text-white font-medium">
                  Get started for free
                  <ChevronRight className="ml-2 h-4 w-4" />
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
          <div
            className={`flex items-center gap-2 ${
              metadata.authors && metadata.authors.length > 0
                ? "md:-mt-8 md:-mb-6"
                : "-mt-8 -mb-6"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {metadata.authors && metadata.authors.length > 0 ? (
                  <>
                    {metadata.authors.map((author, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <img
                          src={`/static/blog/${author
                            .toLowerCase()
                            .replace(/\s+/g, "")}-headshot.webp`}
                          alt={`${author}'s headshot`}
                          className="w-8 h-8 rounded-full hidden md:block"
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
                      src={`/static/blog/${metadata.author
                        ?.toLowerCase()
                        .replace(/\s+/g, "")}-headshot.webp`}
                      alt={`${metadata.author}'s headshot`}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-gray-600 text-sm font-medium">
                      {metadata.author}
                    </span>
                    <span className="text-gray-400 text-sm font-medium">
                      · {String(metadata.date)}
                    </span>
                  </>
                )}
              </div>
              <span className="text-gray-600 text-sm font-medium hidden md:block">
                {String(metadata.time)}
              </span>
            </div>
          </div>
          <RemoteMdxPage mdxSource={mdxSource} />
        </article>
      </div>
    </div>
  );
}
