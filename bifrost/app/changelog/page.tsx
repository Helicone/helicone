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
    <>
      <div className="relative flex h-full w-full flex-col divide-y-2 divide-gray-200 antialiased">
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
                className="relative mx-auto flex w-full max-w-5xl flex-col items-start px-4 py-16 md:flex-row md:py-24"
                key={`changes-${i}`}
              >
                <div className="top-16 flex h-full w-56 flex-col space-y-2 md:sticky md:top-32">
                  <h3 className="text-sm font-semibold text-gray-500">
                    {date.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>
                </div>

                <article className="prose h-full w-full">
                  <Link href={link} className="no-underline" key={i}>
                    <h1 className="mt-16 text-2xl font-bold text-sky-500 md:mt-0">
                      {String(title)}
                    </h1>
                    {imageExists ? (
                      <Image
                        src={imagePath}
                        alt="Changelog Image"
                        width={500}
                        height={300}
                        layout="responsive"
                        style={{
                          borderRadius: "16px",
                          border: "1px solid #D3DCE6",
                        }}
                      />
                    ) : (
                      <div className="flex w-full items-center justify-center bg-gray-200"></div>
                    )}
                  </Link>
                  <p className="text-base">
                    <>{content}</>
                  </p>
                </article>
              </div>
            )
          )}
      </div>
    </>
  );
}
