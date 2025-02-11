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
import { visit } from "unist-util-visit";
import { unified } from "unified";
import remarkParse from "remark-parse";
import rehypeSlug from "rehype-slug";
import GithubSlugger from "github-slugger";
import "highlight.js/styles/atom-one-dark.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Twitter } from "lucide-react";
import { TwitterShareButton } from "@/components/blog/TwitterShareButton";
import TableOfContents from "../../../components/blog/TableOfContents";

function extractHeadingsFromSource(source: string) {
  const tree = unified().use(remarkParse).parse(source);
  const slugger = new GithubSlugger();
  const headings: { level: number; text: string; id: string }[] = [];

  visit(tree, "heading", (node: any) => {
    let text = "";
    visit(node, (child: any) => {
      if (child.type === "text" || child.type === "inlineCode") {
        text += child.value;
      }
    });

    if (text.includes("[toc-ignore]")) return;

    text = text.trim();

    if (text) {
      const id = slugger.slug(text);
      headings.push({ level: node.depth, text, id });
    }
  });

  return headings;
}

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

  const headings = extractHeadingsFromSource(source);

  const mdxSource = await serialize(source, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight, rehypeSlug],
    },
  });

  const metadata = await getMetadata(params["file-path"]);

  if (!metadata) {
    notFound();
  }

  return (
    <div className="w-full bg-white h-full antialiased relative">
      <div className="flex flex-col md:flex-row items-start w-full mx-auto max-w-7xl py-16 px-4 md:py-24 relative gap-6">
        <div className="w-56 h-full flex flex-col space-y-2 md:sticky top-16 md:top-32">
          <Link href="/blog" className="flex items-center gap-1">
            <ChevronLeftIcon className="w-4 h-4" />
            <span className="text-sm font-bold">back</span>
          </Link>
          <h3 className="text-sm font-semibold text-gray-500 pt-8 px-3">
            <span className="text-black">Time</span>: {String(metadata.time)}
          </h3>
          <h3 className="text-sm font-semibold text-gray-500 px-3">
            <span className="text-black">Created</span>: {String(metadata.date)}
          </h3>
          {metadata.authors ? (
            <h3 className="text-sm font-semibold text-gray-500 px-3">
              <span className="text-black">Authors</span>:{" "}
              {metadata.authors.map((author) => author).join(", ")}
            </h3>
          ) : (
            <h3 className="text-sm font-semibold text-gray-500 px-3">
              <span className="text-black">Author</span>:{" "}
              {String(metadata.author)}
            </h3>
          )}
          <section className="w-52 mt-6 mb-2 pt-3">
            <div className="rounded-lg bg-[#F2F9FC] px-4 py-3 space-y-2 border border-[#E3EFF3]">
              <div className="hidden md:block">
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
          <h1 className="text-bold text-sky-500 mt-16 md:mt-0">
            {String(metadata.title)}
          </h1>
          <RemoteMdxPage mdxSource={mdxSource} />
        </article>
        {headings.length > 0 && <TableOfContents headings={headings} />}
      </div>
    </div>
  );
}
