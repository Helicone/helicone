import path from "path";
import RSS from "rss";
import fs from "fs";
import { serialize } from "next-mdx-remote/serialize";
import { getMetadata } from "@/components/templates/blog/getMetaData";
import { BLOG_CONTENT } from "@/app/blog/page";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";

export async function GET() {
  const ReactDOMServer = (await import("react-dom/server")).default;
  const blogsFolder = path.join(process.cwd(), "app", "blog", "blogs");

  const feed = new RSS({
    title: "Helicone Blog | AI Development Insights & Best Practices",
    description:
      "Stay updated with the latest insights on AI development, LLM observability, and industry best practices from the team building the future of AI infrastructure.",
    feed_url: "https://helicone.ai/rss/blog.xml",
    site_url: "https://helicone.ai",
    image_url: "https://www.helicone.ai/static/logo.webp",
    copyright: `All rights reserved ${new Date().getFullYear()}, Helicone Inc.`,
    language: "en-US",
  });

  const mdxs = await Promise.all(
    BLOG_CONTENT.filter(
      (contentPath) =>
        "dynmaicEntry" in contentPath || !contentPath.href.includes("https://"),
    ).map(async (contentPath) => {
      let blogPath;
      if ("dynmaicEntry" in contentPath) {
        blogPath = contentPath.dynmaicEntry.folderName;
      } else {
        blogPath = contentPath.href.replace("/blog/", "");
      }

      const fullPath = path.join(blogsFolder, blogPath, "src.mdx");
      const source = fs.readFileSync(fullPath, "utf8");

      const metadata = await getMetadata(blogPath);

      return {
        path: fullPath,
        title: metadata?.title ?? "",
        description: metadata?.description ?? "",
        link: path.join("/blog", blogPath),
        folder: blogPath,
        content: source,
        date: metadata?.date ?? "",
        imageExists: metadata?.images ? true : false,
        imagePath: metadata?.images ?? "",
        source,
      };
    }),
  );

  mdxs.forEach((mdx) => {
    feed.item({
      title: mdx.title,
      description: mdx.description,
      url: `https://helicone.ai/blog/${mdx.folder}`,
      date: mdx.date,
      enclosure: mdx.imageExists
        ? {
            url: `https://helicone.ai${mdx.imagePath}`,
            type: "image/webp",
          }
        : undefined,
      custom_elements: [
        {
          "content:encoded": mdx.content,
        },
      ],
    });
  });

  return new Response(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
