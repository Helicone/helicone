"use client";

import { useMDXComponents } from "@/mdx-components";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { memo } from "react";

interface Props {
  mdxSource: MDXRemoteSerializeResult;
}

// Memoize the MDX component to prevent unnecessary re-renders
export const RemoteMdxPage = memo(function RemoteMdxPage({ mdxSource }: Props) {
  const components = useMDXComponents;
  return <MDXRemote {...mdxSource} components={components} />;
});
