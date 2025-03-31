import type { MDXComponents } from "mdx/types";
import { CallToAction } from "@/components/blog/CallToAction";
import { BottomLine } from "@/components/blog/BottomLine";
import { Questions } from "@/components/blog/Questions";
import { FAQ } from "./components/blog/FAQ";
import { ReactNode } from "react";

const ResponsiveTable = ({ children }: { children: ReactNode }) => {
  return <div className="overflow-x-auto w-full">{children}</div>;
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    CallToAction: CallToAction,
    BottomLine: BottomLine,
    Questions: Questions,
    FAQ: FAQ,
    table: (props) => (
      <ResponsiveTable>
        <table {...props} />
      </ResponsiveTable>
    ),
  };
}
