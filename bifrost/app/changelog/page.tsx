import { getMetadata } from "@/components/templates/blog/getMetaData";
import { getCompiledServerMdx } from "@mintlify/mdx";
import "@mintlify/mdx/dist/styles.css";
import fs from "fs";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import path from "path";

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
    images: "/static/changelog/changelog-open-graph.webp",
    locale: "en_US",
  },
  twitter: {
    title: "Helicone Changelog | Latest Updates & New Features",
    description:
      "Stay up to date with Helicone's latest features, improvements, and product updates. Track our journey in building the future of LLM observability and AI infrastructure.",
    card: "summary_large_image",
    images: "/static/changelog/changelog-open-graph.webp",
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
    <>
      <div className="flex flex-col w-full bg-[#f8feff] h-full antialiased relative divide-gray-200 divide-y-2">
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
              i
            ) => (
              <div
                className="flex flex-col md:flex-row items-start w-full mx-auto max-w-5xl py-16 px-4 md:py-24 relative"
                key={`changes-${i}`}
              >
                <div className="w-56 h-full flex flex-col space-y-2 md:sticky top-16 md:top-32">
                  <h3 className="text-sm font-semibold text-gray-500">
                    {date.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>
                </div>

                <article className="prose w-full h-full">
                  <Link href={link} className="no-underline" key={i}>
                    {imageExists ? (
                      <Image
                        src={imagePath}
                        alt="Changelog Image"
                        width={500}
                        height={300}
                        layout="responsive"
                      />
                    ) : (
                      <div className="bg-gray-200 w-full flex items-center justify-center"></div>
                    )}
                    <h1 className="text-sky-500 mt-16 md:mt-0 font-semibold">
                      {String(title)}
                    </h1>
                  </Link>
                  <p>{content}</p>
                </article>
              </div>
            )
          )}
      </div>
    </>
  );
}
