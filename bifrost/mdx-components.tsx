import type { MDXComponents } from "mdx/types";
import { CallToAction } from "@/components/blog/CallToAction";
import { BottomLine } from "@/components/blog/BottomLine";
import { Questions } from "@/components/blog/Questions";
import CustomHeadings from "@/components/blog/CustomHeadings";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    ...CustomHeadings,
    CallToAction: CallToAction,
    BottomLine: BottomLine,
    Questions: Questions,
  };
}
