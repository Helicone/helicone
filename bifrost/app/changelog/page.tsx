import { getMetadata } from "@/components/templates/blog/getMetaData";
import { getCompiledServerMdx } from "@mintlify/mdx";
import "@mintlify/mdx/dist/styles.css";
import fs from "fs";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import path from "path";
import { H1, H3, P, Small, Muted } from "@/components/ui/typography";
import { GitMerge } from "lucide-react";

export const metadata: Metadata = {
  title: "Helicone Changelog | Latest Updates & New Features",
  description:
    "Stay up to date with Helicone's latest features, improvements, and product updates. Track our journey in building the future of LLM observability and AI infrastructure.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/changelog",
    title: "Helicone Changelog | Latest Updates & New Features",
    description:
      "Stay up to date with Helicone's latest features, improvements, and product updates. Track our journey in building the future of LLM observability and AI infrastructure.",
    images: "/static/new-open-graph.png",
    locale: "en_US",
  },
  twitter: {
    title: "Helicone Changelog | Latest Updates & New Features",
    description:
      "Stay up to date with Helicone's latest features, improvements, and product updates. Track our journey in building the future of LLM observability and AI infrastructure.",
    card: "summary_large_image",
    images: "/static/new-open-graph.png",
  },
};

const getChangeMdxs = async () => {
  const changelogFolder = path.join(
    process.cwd(),
    "app",
    "changelog",
    "changes"
  );
  const changes = fs.readdirSync(changelogFolder);
  console.log(changes);
  return Promise.all(
    changes.map(async (folder) => {
      const date = folder.split("-")[0];
      // 20240723
      const dateObject = new Date(
        Number(date.slice(0, 4)),
        Number(date.slice(4, 6)) - 1,
        Number(date.slice(6, 8))
      );
      const fullPath = path.join(changelogFolder, folder, "src.mdx");
      const source = fs.readFileSync(fullPath, "utf8");
      const { frontmatter, content } = await getCompiledServerMdx({ source });

      let imagePath = path.join(
        "static",
        "changelog",
        "images",
        `${folder}.webp`
      );
      let imageExists = fs.existsSync(
        path.join(process.cwd(), "public", imagePath)
      );

      if (!imageExists) {
        imagePath = path.join("static", "changelog", "images", `${folder}.gif`);
        imageExists = fs.existsSync(
          path.join(process.cwd(), "public", imagePath)
        );
      }
      const metadata = await getMetadata(folder, "changelog", "changes");

      return {
        path: fullPath,
        title: metadata?.title ?? "",
        link: path.join("/changelog", folder),
        folder,
        content,
        date: dateObject,
        imageExists,
        imagePath: path.join("/", imagePath),
      };
    })
  );
};

export default async function Home() {
  const mdxs = await getChangeMdxs();

  return (
    <div className="w-full bg-white min-h-screen antialiased relative">
      <div className="relative w-full flex flex-col mx-auto max-w-4xl h-full py-10 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 md:mb-8">
          <H1>Changelog</H1>
          <P className="text-slate-500 mt-1.5">
            Stay up to date with the latest features and improvements to Helicone.
          </P>
        </div>

        <div className="flex flex-col w-full h-full relative">
          {/* Timeline line - hidden on mobile */}
          <div className="absolute hidden md:block left-4 top-[52px] bottom-8 w-px bg-slate-200 z-0"></div>

          {mdxs
            .reverse()
            .map(
              (
                {
                  title,
                  date,
                  path,
                  link,
                  folder,
                  content,
                  imageExists,
                  imagePath,
                },
                i,
                arr
              ) => (
                <div
                  className="flex py-8 md:py-10 w-full relative"
                  key={`changes-${i}`}
                >
                  {/* Timeline dot - hidden on mobile */}
                  <div className="absolute hidden md:block left-4 top-[52px] z-10" style={{ transform: 'translateX(-50%)' }}>
                    <div className="h-7 w-7 rounded-md bg-sky-100 flex items-center justify-center">
                      <GitMerge size={14} className="text-sky-600" />
                    </div>
                  </div>

                  <div className="flex flex-col md:pl-16 w-full">
                    <div className="flex items-center mb-3">
                      <div className="flex items-center text-slate-500 text-sm">
                        {date.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <Link href={link}>
                      <H3 className="text-sky-500 hover:text-sky-600 transition-colors mb-3">
                        {String(title)}
                      </H3>
                    </Link>

                    {imageExists && (
                      <div className="w-full mb-5 overflow-hidden rounded-xl relative aspect-[16/9]">
                        <Link href={link}>
                          <Image
                            src={imagePath}
                            alt={`${title} preview`}
                            fill
                            sizes="(max-width: 768px) 100vw, 800px"
                            className="object-cover rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                          />
                        </Link>
                      </div>
                    )}

                    <div className="prose prose-slate max-w-none prose-compact">
                      {content}
                    </div>

                    {/* Add a divider for mobile view */}
                    {i < arr.length - 1 && (
                      <div className="md:hidden h-px w-full bg-slate-200 mt-8"></div>
                    )}
                  </div>
                </div>
              )
            )}
        </div>
      </div>
    </div>
  );
}
