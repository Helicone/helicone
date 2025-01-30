"use client";

import { useMDXComponents } from "@/mdx-components";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";

interface Props {
  mdxSource: MDXRemoteSerializeResult;
}

export function RemoteMdxPage({ mdxSource }: Props) {
  return <MDXRemote {...mdxSource} components={useMDXComponents} />;
}
