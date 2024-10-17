import path from "path";
import RSS from "rss";
import fs from "fs";
import { getCompiledServerMdx } from "@mintlify/mdx";
import { getMetadata } from "@/components/templates/blog/getMetaData";

export async function GET() {
  const ReactDOMServer = (await import("react-dom/server")).default;
  const changelogFolder = path.join(
    process.cwd(),
    "app",
    "changelog",
    "changes"
  );
  const changes = fs.readdirSync(changelogFolder);

  const feed = new RSS({
    title: "Helicone Changelog",
    description:
      "New updates and improvements to Helicone AI - LLM-Observability for Developers",
    feed_url: "https://helicone.ai/changelog/rss.xml",
    site_url: "https://helicone.ai",
    image_url: "https://www.helicone.ai/static/logo.webp",
    copyright: `All rights reserved ${new Date().getFullYear()}, Helicone Inc.`,
    language: "en-US",
  });

  const mdxs = await Promise.all(
    changes.reverse().map(async (folder) => {
      const date = folder.split("-")[0];
      // 20240723
      const dateObject = new Date(
        Number(date.slice(0, 4)),
        Number(date.slice(4, 6)) - 1,
        Number(date.slice(6, 8))
      );
      const fullPath = path.join(changelogFolder, folder, "src.mdx");
      const source = fs.readFileSync(fullPath, "utf8");
      const { frontmatter, content } = await getCompiledServerMdx({ source });

      let imagePath = path.join(
        "static",
        "changelog",
        "images",
        `${folder}.webp`
      );
      let imageExists = fs.existsSync(
        path.join(process.cwd(), "public", imagePath)
      );

      if (!imageExists) {
        imagePath = path.join("static", "changelog", "images", `${folder}.gif`);
        imageExists = fs.existsSync(
          path.join(process.cwd(), "public", imagePath)
        );
      }
      const metadata = await getMetadata(folder, "changelog", "changes");

      return {
        path: fullPath,
        title: metadata?.title ?? "",
        description: metadata?.description ?? "",
        link: path.join("/changelog", folder),
        folder,
        content,
        date: dateObject,
        imageExists,
        imagePath: path.join("/", imagePath),
        source,
      };
    })
  );

  mdxs.forEach((mdx) => {
    feed.item({
      title: mdx.title,
      description: mdx.description,
      url: `https://helicone.ai/changelog/${mdx.folder}`,
      date: mdx.date,
      enclosure: mdx.imageExists
        ? {
            url: `https://helicone.ai${mdx.imagePath}`,
            type: "image/webp",
          }
        : undefined,
      custom_elements: [
        {
          "content:encoded": ReactDOMServer.renderToStaticMarkup(mdx.content),
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
