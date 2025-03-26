import { getCompiledServerMdx } from "@mintlify/mdx";
import path from "path";
import fs from "fs";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import "@mintlify/mdx/dist/styles.css";
import { getMetadata } from "@/components/templates/blog/getMetaData";
import { H1, H3, P, Small, Muted } from "@/components/ui/typography";
import { ChevronLeft, Calendar } from "lucide-react";
import { Metadata } from "next";

function getContent(filePath: string) {
  try {
    const source = fs.readFileSync(filePath, "utf8");
    return getCompiledServerMdx({ source });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { "file-path": string };
}): Promise<Metadata> {
  const filePath = params["file-path"];
  const metadata = await getMetadata(filePath, "changelog", "changes");

  if (!metadata) {
    return {
      title: "Changelog | Helicone",
      description: "Helicone product updates and new features",
    };
  }

  return {
    title: `${metadata.title} | Helicone Changelog`,
    description: metadata.description || "Helicone product updates and new features",
    openGraph: {
      title: `${metadata.title} | Helicone Changelog`,
      description: metadata.description || "Helicone product updates and new features",
    },
    twitter: {
      title: `${metadata.title} | Helicone Changelog`,
      description: metadata.description || "Helicone product updates and new features",
    },
  };
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

  // Check if image exists
  let imagePath = path.join(
    "static",
    "changelog",
    "images",
    `${filePath}.webp`
  );
  let imageExists = fs.existsSync(
    path.join(process.cwd(), "public", imagePath)
  );

  if (!imageExists) {
    imagePath = path.join("static", "changelog", "images", `${filePath}.gif`);
    imageExists = fs.existsSync(
      path.join(process.cwd(), "public", imagePath)
    );
  }

  return (
    <div className="w-full bg-white h-full antialiased relative">
      <div className="flex flex-col md:flex-row items-start w-full mx-auto max-w-3xl py-10 md:py-12 px-4 sm:px-6 lg:px-8 relative gap-8">
        <div className="w-full">
          <div className="flex items-center mb-5">
            <Link
              href="/changelog"
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-700 transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium">
                {dateObject.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </Link>
          </div>

          <H1 className="text-sky-500 mb-5 font-semibold">{String(metadata?.title)}</H1>

          {imageExists && (
            <div className="mb-6 overflow-hidden rounded-xl relative aspect-[16/9]">
              <Image
                src={`/${imagePath}`}
                alt={`${metadata?.title} preview`}
                width={800}
                height={450}
                className="object-cover rounded-xl border border-slate-200"
              />
            </div>
          )}

          <article className="prose prose-slate max-w-none prose-compact">
            {content}
          </article>

          <div className="mt-10 pt-5 border-t border-slate-200">
            <Link
              href="/changelog"
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-700 transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium">Back to changelog</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
