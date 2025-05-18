"use client";

import { MDXRemote } from "next-mdx-remote";
import Link from "next/link";
import { TemplateMetadata } from "@/app/utils/templateUtils";

// Define any custom components to use in the MDX content
const components = {
  h1: (props: any) => (
    <h1 className="text-3xl font-bold mb-4 mt-8" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="text-2xl font-bold mb-3 mt-6" {...props} />
  ),
  h3: (props: any) => <h3 className="text-xl font-bold mb-3 mt-6" {...props} />,
  h4: (props: any) => <h4 className="text-lg font-bold mb-2 mt-4" {...props} />,
  p: (props: any) => <p className="mb-4" {...props} />,
  ul: (props: any) => <ul className="mb-4 pl-6 list-disc" {...props} />,
  ol: (props: any) => <ol className="mb-4 pl-6 list-decimal" {...props} />,
  li: (props: any) => <li className="mb-1" {...props} />,
  blockquote: (props: any) => (
    <blockquote
      className="border-l-4 border-muted pl-4 py-2 mb-4 italic text-muted-foreground"
      {...props}
    />
  ),
  code: (props: any) => {
    if (props.className) {
      // This is a code block with language syntax
      return <code className={props.className} {...props} />;
    }
    // This is inline code
    return (
      <code
        className="bg-muted px-1 py-0.5 font-mono rounded text-sm"
        {...props}
      />
    );
  },
  pre: (props: any) => (
    <pre className="mb-4 p-4 rounded-lg bg-muted overflow-x-auto" {...props} />
  ),
  a: (props: any) => (
    <Link
      href={props.href}
      className="text-primary hover:underline"
      {...props}
      target={props.href?.startsWith("http") ? "_blank" : undefined}
      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
    />
  ),
  table: (props: any) => (
    <div className="mb-6 overflow-x-auto">
      <table className="min-w-full border" {...props} />
    </div>
  ),
  th: (props: any) => <th className="px-4 py-2 border bg-muted" {...props} />,
  td: (props: any) => <td className="px-4 py-2 border" {...props} />,
  hr: () => <hr className="my-6 border-muted" />,
  img: (props: any) => (
    <img
      className="max-w-full h-auto rounded-lg my-6"
      {...props}
      alt={props.alt || ""}
    />
  ),
};

interface TemplateMdxPageProps {
  mdxSource: any;
  relatedTemplates?: TemplateMetadata[];
}

export const TemplateMdxPage = ({
  mdxSource,
  relatedTemplates,
}: TemplateMdxPageProps) => {
  return (
    <>
      <MDXRemote {...mdxSource} components={components} />
    </>
  );
};
