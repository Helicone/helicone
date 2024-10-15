import { getCompiledServerMdx } from "@mintlify/mdx";
import path from "path";
import fs from "fs";
import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import { notFound } from "next/navigation";

import "@mintlify/mdx/dist/styles.css";
import { getMetadata } from "@/components/templates/blog/getMetaData";

function getContent(filePath: string) {
  try {
    const source = fs.readFileSync(filePath, "utf8");
    return getCompiledServerMdx({ source });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function Home({
  params,
}: {
  params: {
    "file-path": string;
  };
}) {
  const { "file-path": filePath } = params;
  const changelogFolder = path.join(
    process.cwd(),
    "app",
    "changelog",
    "changes",
    params["file-path"],
    "src.mdx"
  );
  const contentResult = await getContent(changelogFolder);
  if (!contentResult) {
    notFound();
  }

  const metadata = await getMetadata(filePath, "changelog", "changes");

  const { content } = contentResult;
  const date = filePath.split("-")[0];
  // 20240723
  const dateObject = new Date(
    Number(date.slice(0, 4)),
    Number(date.slice(4, 6)) - 1,
    Number(date.slice(6, 8))
  );
  return (
    <>
      <div className="w-full bg-[#f8feff] h-full antialiased relative">
        <div className="w-full bg-[#f8feff] h-full antialiased relative">
          <div className="flex flex-col md:flex-row items-start w-full mx-auto max-w-5xl py-16 px-4 md:py-24 relative">
            <div className="w-56 h-full flex flex-col space-y-2 md:sticky top-16 md:top-32">
              <Link href="/changelog" className="flex items-center gap-1">
                <ChevronLeftIcon className="w-4 h-4" />
                <span className="text-sm font-bold">changelog</span>
              </Link>
            </div>
            <article className="prose w-full h-full">
              <h1 className="text-bold text-sky-500 mt-16 md:mt-0">
                {String(metadata?.title)}
              </h1>
              <h3 className="text-sm font-semibold text-gray-500">
                {dateObject.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>
              {content}
            </article>
          </div>
        </div>
      </div>
    </>
  );
}
