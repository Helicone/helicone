import { getCompiledServerMdx } from "@mintlify/mdx";
import "@mintlify/mdx/dist/styles.css";
import fs from "fs";
import Image from "next/image";
import Link from "next/link";
import path from "path";

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
      const fullPath = path.join(changelogFolder, folder, "src.mdx");
      const source = fs.readFileSync(fullPath, "utf8");
      const { frontmatter, content } = await getCompiledServerMdx({ source });
      return {
        path: fullPath,
        frontmatter,
        link: path.join("/changelog", folder),
        folder,
        content,
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
          .map(({ frontmatter, path, link, folder, content }, i) => (
            <Link
              href={link}
              className="flex flex-col md:flex-row items-start w-full mx-auto max-w-5xl py-16 px-4 md:py-24 relative"
              key={i}
            >
              <div className="w-56 h-full flex flex-col space-y-2 md:sticky top-16 md:top-32">
                <h3 className="text-sm font-semibold text-gray-500">
                  {String(frontmatter.date)}
                </h3>
              </div>

              <article className="prose w-full h-full">
                <Image
                  src={
                    typeof frontmatter.image === "string" &&
                    frontmatter.image.includes(".webp")
                      ? frontmatter.image
                      : `/static/changelog/images/${folder}.webp`
                  }
                  alt="Changelog Image"
                  width={500}
                  height={300}
                  layout="responsive"
                />
                <h1 className="text-sky-500 mt-16 md:mt-0 font-semibold">
                  {String(frontmatter.title)}
                </h1>
                <p>{content}</p>
              </article>
            </Link>
          ))}
      </div>
    </>
  );
}
