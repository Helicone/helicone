import type { MDXComponents } from "mdx/types";
import { CallToAction } from "@/components/blog/CallToAction"
import { BottomLine } from "@/components/blog/BottomLine"

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    CallToAction: CallToAction,
    BottomLine: BottomLine,
  };
}
