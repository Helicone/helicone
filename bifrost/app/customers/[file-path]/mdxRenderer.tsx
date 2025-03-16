"use client";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { useMDXComponents } from "@/mdx-components";

interface Props {
    mdxSource: MDXRemoteSerializeResult;
}

export function RemoteMdxPage({ mdxSource }: Props) {
    const components = useMDXComponents({});
    return <MDXRemote {...mdxSource} components={components} />;
} 