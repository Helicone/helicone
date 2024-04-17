import { MDXComponent, getCompiledMdx } from "@mintlify/mdx";
import type { MDXCompiledResult } from "@mintlify/mdx";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import path from "path";
import fs from "fs";
import NavBarV2 from "../../../components/layout/navbar/navBarV2";
import Footer from "../../../components/layout/footer";
import "@mintlify/mdx/dist/styles.css";

export const getServerSideProps: GetServerSideProps<{
  mdxSource: MDXCompiledResult;
}> = async () => {
  const filePath = path.join(
    process.cwd(),
    "pages",
    "blog",
    "hello",
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
    <>
      <NavBarV2 />
      <article className="prose mx-auto py-8">
        <h1>{String(mdxSource.frontmatter.title)}</h1>
        <MDXComponent {...mdxSource} />
      </article>
      <Footer />
    </>
  );
}
