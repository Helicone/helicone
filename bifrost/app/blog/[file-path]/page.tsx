import { getMetadata } from "@/components/templates/blog/getMetaData";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import { promises as fs } from "fs";
import { serialize } from "next-mdx-remote/serialize";
import Link from "next/link";
import { notFound } from "next/navigation";
import path from "path";
import { RemoteMdxPage } from "./mdxRenderer";
import remarkGfm from "remark-gfm";

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
