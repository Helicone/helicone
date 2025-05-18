import {
  getTemplateData,
  getAllTemplateDirectories,
  getAllTemplatesWithMetadata,
} from "@/app/utils/templateUtils";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { H1, H2, H3, P } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import "highlight.js/styles/atom-one-dark.css";
import { TemplateMdxPage } from "./mdxRenderer";
import type { Metadata } from "next";

// Generate static paths for all templates
export async function generateStaticParams() {
  const slugs = await getAllTemplateDirectories();
  return slugs.map((slug) => ({
    "template-slug": slug,
  }));
}

// Generate metadata for each template page
export async function generateMetadata({
  params,
}: {
  params: { "template-slug": string };
}): Promise<Metadata> {
  const templateData = await getTemplateData(params["template-slug"]);

  if (!templateData) {
    return {
      title: "Template Not Found",
      description: "The requested template could not be found.",
    };
  }

  return {
    title: `${templateData.title} | Helicone Template`,
    description: templateData.description,
    openGraph: {
      title: `${templateData.title} | Helicone Template`,
      description: templateData.description,
      images: templateData.logo
        ? [templateData.logo]
        : ["/static/new-open-graph.png"],
    },
    twitter: {
      title: `${templateData.title} | Helicone Template`,
      description: templateData.description,
      card: "summary_large_image",
      images: templateData.logo
        ? [templateData.logo]
        : ["/static/new-open-graph.png"],
    },
  };
}

export default async function TemplatePage({
  params,
}: {
  params: { "template-slug": string };
}) {
  const templateSlug = params["template-slug"];
  const templateData = await getTemplateData(templateSlug);

  if (!templateData) {
    notFound();
  }

  // Get related templates (using tags for recommendations)
  const allTemplates = await getAllTemplatesWithMetadata();
  const relatedTemplates = allTemplates
    .filter(
      (template) =>
        template.slug !== templateSlug &&
        template.tags?.some((tag) => templateData.tags?.includes(tag))
    )
    .slice(0, 3); // Limit to 3 related templates

  // Serialize the MDX content
  const mdxSource = await serialize(templateData.mdxContent, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug, rehypeHighlight],
    },
  });

  // Template metadata to display
  const metadataItems = [
    { label: "Framework", value: templateData.tags?.[0] || "Helicone" },
    { label: "Use Case", value: "LLM Monitoring" },
    { label: "Difficulty", value: templateData.difficulty || "Intermediate" },
  ];

  if (templateData.lastUpdated) {
    metadataItems.push({
      label: "Last Updated",
      value: new Date(templateData.lastUpdated).toLocaleDateString(),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/templates"
          className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Link>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Left content */}
          <div>
            {templateData.tags && templateData.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {templateData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <H1 className="mb-4 text-4xl font-bold md:text-5xl">
              {templateData.title}
            </H1>
            <P className="mb-8 text-lg text-muted-foreground">
              {templateData.description}
            </P>

            <div className="mb-8 flex gap-4">
              <Button className="gap-2 px-6 py-6 text-lg" size="lg" asChild>
                <Link
                  href={`https://github.com/Helicone/helicone-templates/tree/main/templates/${templateSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Code <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="px-6 py-6 text-lg"
                size="lg"
                asChild
              >
                <a href="#install">Quick Install</a>
              </Button>
            </div>

            <Card className="mb-8 border p-6 shadow-sm">
              <H2 className="mb-4 text-xl font-semibold">Template Details</H2>

              <div className="space-y-4">
                {metadataItems.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    <Separator className="mt-2" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Installation Section for mobile */}
            <div
              id="install"
              className="md:hidden mb-8 rounded-lg border bg-card p-6 shadow-sm"
            >
              <H2 className="text-xl font-semibold mb-4">Quick Install</H2>
              <div className="bg-muted p-4 rounded-md overflow-x-auto mb-4 border">
                <code className="text-sm font-mono">
                  npx create-helicone-app my-project --template {templateSlug}
                </code>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link
                  href={`https://github.com/Helicone/helicone-templates/tree/main/templates/${templateSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on GitHub
                </Link>
              </Button>
            </div>
          </div>

          {/* Right content */}
          <div>
            {/* Template logo and code */}
            <Card className="overflow-hidden border shadow-sm">
              {templateData.logo && (
                <div className="relative aspect-video w-full bg-muted">
                  <Image
                    src={templateData.logo}
                    alt={`${templateData.title} logo`}
                    fill
                    className="object-contain p-8"
                    priority
                  />
                </div>
              )}

              <div className="p-6">
                <H2 className="text-xl font-semibold mb-4" id="install">
                  Quick Install
                </H2>

                <div className="mb-6">
                  <div className="rounded-lg bg-muted p-4 font-mono text-sm border mb-4">
                    <pre>
                      npx create-helicone-app my-project --template{" "}
                      {templateSlug}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button className="gap-2" asChild>
                    <Link
                      href={`https://github.com/Helicone/helicone-templates/tree/main/templates/${templateSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on GitHub
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link
                      href="https://docs.helicone.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read Docs
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>

            {/* MDX Content Preview */}
            <div className="mt-8 rounded-lg border p-6 shadow-sm prose max-w-none">
              <H2 className="text-xl font-semibold mb-4">Template Overview</H2>
              <TemplateMdxPage mdxSource={mdxSource} />

              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  className="text-primary hover:text-primary/80"
                  asChild
                >
                  <Link
                    href={`https://github.com/Helicone/helicone-templates/tree/main/templates/${templateSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Full Documentation{" "}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Templates */}
        {relatedTemplates.length > 0 && (
          <div className="mt-12 pt-6 border-t">
            <H3 className="mb-6 text-2xl font-bold">Related Templates</H3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {relatedTemplates.map((template) => (
                <Link
                  key={template.slug}
                  href={`/templates/${template.slug}`}
                  className="block p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {template.logo && (
                      <div className="relative h-12 w-12 flex-shrink-0">
                        <Image
                          src={template.logo}
                          alt={template.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <H3 className="font-medium text-base">
                        {template.title}
                      </H3>
                      <P className="text-sm text-muted-foreground line-clamp-1">
                        {template.description}
                      </P>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
