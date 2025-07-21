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
      <div className="relative h-full w-full antialiased">
        <div className="relative h-full w-full antialiased">
          <div className="relative mx-auto flex w-full max-w-5xl flex-col items-start px-4 py-16 md:flex-row md:py-24">
            <div className="top-16 flex h-full w-56 flex-col space-y-2 md:sticky md:top-32">
              <Link href="/changelog" className="flex items-center gap-1">
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="text-sm font-bold">changelog</span>
              </Link>
            </div>
            <article className="prose h-full w-full">
              <h1 className="text-bold mt-16 text-sky-500 md:mt-0">
                {String(metadata?.title)}
              </h1>
              <h3 className="text-sm font-semibold text-gray-500">
                {dateObject.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>
              <>{content}</>
            </article>
          </div>
        </div>
      </div>
    </>
  );
}
