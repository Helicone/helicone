import { MDXComponent, getCompiledMdx } from "@mintlify/mdx";
import type { MDXCompiledResult } from "@mintlify/mdx";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import path from "path";
import fs from "fs";
import NavBarV2 from "../../../components/layout/navbar/navBarV2";
import Footer from "../../../components/layout/footer";
import "@mintlify/mdx/dist/styles.css";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

export const getServerSideProps: GetServerSideProps<{
  mdxSource: MDXCompiledResult;
}> = async () => {
  const filePath = path.join(
    process.cwd(),
    "pages",
    "blog",
    "hello", // <<<<---- UPDATE THIS LINE TO MATCH THE FOLDER NAME
    "src.mdx"
  );

  const source = fs.readFileSync(filePath, "utf8");
  const mdxSource = await getCompiledMdx({ source });

  return {
    props: {
      mdxSource,
    },
  };
};

export default function Home({
  mdxSource,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <div className="w-full bg-[#f8feff] h-full antialiased relative">
      <NavBarV2 />
      <div className="flex items-start w-full mx-auto max-w-5xl py-24 relative">
        <div className="w-56 h-full flex flex-col space-y-2 sticky top-32">
          <Link href="/blog" className="flex items-center gap-1">
            <ChevronLeftIcon className="w-4 h-4" />
            <span className="text-sm font-bold">back</span>
          </Link>
          <h3 className="text-sm font-semibold text-gray-500 pt-8">
            <span className="text-black">Time</span>:{" "}
            {String(mdxSource.frontmatter.time)}
          </h3>
          <h3 className="text-sm font-semibold text-gray-500">
            <span className="text-black">Created</span>:{" "}
            {String(mdxSource.frontmatter.date)}
          </h3>
          <h3 className="text-sm font-semibold text-gray-500">
            <span className="text-black">Author</span>:{" "}
            {String(mdxSource.frontmatter.author)}
          </h3>
        </div>
        <article className="prose w-full h-full">
          <h1 className="text-bold text-sky-500">
            {String(mdxSource.frontmatter.title)}
          </h1>
          <MDXComponent {...mdxSource} />
        </article>
      </div>

      <Footer />
    </div>
  );
}
