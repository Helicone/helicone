import type { MDXComponents } from "mdx/types";
import { CallToAction } from "@/components/blog/CallToAction";
import { BottomLine } from "@/components/blog/BottomLine";
import { Questions } from "@/components/blog/Questions";
import { FAQ } from "./components/blog/FAQ";
import { ReactNode } from "react";
import NextImage from "next/image";
import { HeadingWithCopyLink } from "@/components/blog/HeadingWithCopyLink";

const ResponsiveTable = ({ children }: { children: ReactNode }) => {
  return <div className="overflow-x-auto w-full">{children}</div>;
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h1: (props) => <HeadingWithCopyLink level={1} {...props} />,
    h2: (props) => <HeadingWithCopyLink level={2} {...props} />,
    h3: (props) => <HeadingWithCopyLink level={3} {...props} />,
    h4: (props) => <HeadingWithCopyLink level={4} {...props} />,
    h5: (props) => <HeadingWithCopyLink level={5} {...props} />,
    h6: (props) => <HeadingWithCopyLink level={6} {...props} />,
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
      // Handle img.shields.io badges
      if (typeof src === "string" && src.includes("img.shields.io")) {
        return (
          <img
            src={src}
            alt={alt || ""}
            style={{ maxWidth: "100px", height: "auto" }}
            {...props}
          />
        );
      }

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
