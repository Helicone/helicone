import type { MDXComponents } from "mdx/types";
import { CallToAction } from "@/components/blog/CallToAction";
import { BottomLine } from "@/components/blog/BottomLine";
import { Questions } from "@/components/blog/Questions";
import { FAQ } from "./components/blog/FAQ";
import { ReactNode } from "react";
import NextImage from "next/image";

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
    img: ({ src, alt, ...props }: any) => {
      // Only use Next/Image for valid string sources
      if (typeof src === "string") {
        // Check if this is the first image in the post (likely the hero)
        // Hero images should use priority for better LCP
        const isHeroImage = src.includes("-cover.") || src.includes("-hero.");

        return (
          <NextImage
            src={src}
            alt={alt || ""}
            width={800}
            height={450}
            priority={isHeroImage}
            loading={isHeroImage ? undefined : "lazy"}
          />
        );
      }

      // Fallback to standard img if src is not a string
      return <img src={src} alt={alt} {...props} />;
    },
  };
}
