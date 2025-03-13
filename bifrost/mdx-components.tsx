import type { MDXComponents } from "mdx/types";
import { CallToAction } from "@/components/blog/CallToAction";
import { BottomLine } from "@/components/blog/BottomLine";
import { Questions } from "@/components/blog/Questions";
import { FAQ } from "./components/blog/FAQ";
import { TableOfContents } from "./components/blog/TableOfContents";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    CallToAction: CallToAction,
    BottomLine: BottomLine,
    Questions: Questions,
    FAQ: FAQ,
    TableOfContents: TableOfContents
  };
}
