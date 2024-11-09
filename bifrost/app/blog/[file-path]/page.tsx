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
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Share2 } from "lucide-react"

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
    <div className="w-full bg-[#f8feff] h-full antialiased relative">
      <div className="flex flex-col md:flex-row items-start w-full mx-auto max-w-5xl py-16 px-4 md:py-24 relative">
        <div className="w-56 h-full flex flex-col space-y-2 md:sticky top-16 md:top-32">
          <Link href="/blog" className="flex items-center gap-1">
            <ChevronLeftIcon className="w-4 h-4" />
            <span className="text-sm font-bold">back</span>
          </Link>
          <h3 className="text-sm font-semibold text-gray-500 pt-8">
            <span className="text-black">Time</span>: {String(metadata.time)}
          </h3>
          <h3 className="text-sm font-semibold text-gray-500">
            <span className="text-black">Created</span>: {String(metadata.date)}
          </h3>
          {metadata.authors ? (
            <h3 className="text-sm font-semibold text-gray-500">
              <span className="text-black">Authors</span>:{" "}
              {metadata.authors.map((author) => author).join(", ")}
            </h3>
          ) : (
            <h3 className="text-sm font-semibold text-gray-500">
              <span className="text-black">Author</span>:{" "}
              {String(metadata.author)}
            </h3>
          )}
            <Card className="w-full max-w-sm bg-[#F2F9FC] border-[#E3EFF3]">
            <CardContent className="p-16 space-y-4">
              <p className="text-[#6B8C9C] text-base leading-relaxed">
                Join Helicone's community to monitor and optimize your LLM app in real-time.
              </p>
              <Link href="https://us.helicone.ai/signin" className="block">
                <Button className="w-full bg-[#0DA5E8] hover:bg-[#0C94D1] text-white font-medium">
                  Log in
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" className="w-full text-[#6B8C9C] hover:text-[#5a7a8a] hover:bg-[#E3EFF3] justify-between">
                Share
                <Share2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
        <article className="prose w-full h-full">
          <h1 className="text-bold text-sky-500 mt-16 md:mt-0">
            {String(metadata.title)}
          </h1>
          <RemoteMdxPage mdxSource={mdxSource} />
        </article>
      </div>
    </div>
  );
}
