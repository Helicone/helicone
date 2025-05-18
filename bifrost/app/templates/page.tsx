import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Search, X, ChevronDown, ArrowRight, Terminal } from "lucide-react";
import { H1, H2, P } from "@/components/ui/typography";
import { getAllTemplatesWithMetadata } from "@/app/utils/templateUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Helicone Templates | Starter Projects & Examples",
  description:
    "Explore our collection of starter templates and examples to quickly integrate Helicone with your LLM applications.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/templates",
    title: "Helicone Templates | Starter Projects & Examples",
    description:
      "Explore our collection of starter templates and examples to quickly integrate Helicone with your LLM applications.",
    images: "/static/new-open-graph.png",
    locale: "en_US",
  },
  twitter: {
    title: "Helicone Templates | Starter Projects & Examples",
    description:
      "Explore our collection of starter templates and examples to quickly integrate Helicone with your LLM applications.",
    card: "summary_large_image",
    images: "/static/new-open-graph.png",
  },
};

export default async function TemplatesPage() {
  const templates = await getAllTemplatesWithMetadata();

  return (
    <div className="w-full h-full flex flex-col antialiased relative gap-2">
      <div className="flex flex-col gap-4 w-full h-full justify-center items-center text-center px-2 sm:px-2 lg:px-0">
        <Image
          src={"/static/templates/templates.webp"}
          alt={"templates-hero"}
          width={150}
          height={150}
        />
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-4xl">
          Build with <span className="text-primary">Helicone</span> starter
          templates
        </h1>
        <p className="mt-[12px] text-sm sm:text-lg text-gray-700">
          Discover Helicone templates, starters, and examples to jumpstart
          <br />
          your LLM monitoring and observability solution with your favorite
          frameworks.
        </p>
      </div>

      <div className="container mx-auto px-4">
        {/* CLI Quick Start */}
        <div className="mb-16 mt-6 max-w-2xl mx-auto">
          <CodeBlock
            code="npx create-helicone-app"
            language="bash"
            label="Get Started with CLI"
          />
          <p className="text-sm text-muted-foreground mt-3 text-center">
            The CLI will guide you through selecting a template and configuring
            your new project.
          </p>
        </div>

        {/* Main content */}
        <div id="templates" className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar filters */}
          <div className="space-y-6 rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Filter Templates</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
              >
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search templates..." className="pl-10" />
            </div>

            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left font-medium">
                Difficulty
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="beginner" />
                    <label
                      htmlFor="beginner"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Beginner
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="intermediate" />
                    <label
                      htmlFor="intermediate"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Intermediate
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="advanced" />
                    <label
                      htmlFor="advanced"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Advanced
                    </label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left font-medium">
                Framework
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-3">
                  {["Python", "TypeScript", "NextJS", "React", "FastAPI"].map(
                    (framework) => (
                      <div
                        key={framework}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox id={framework.toLowerCase()} />
                        <label
                          htmlFor={framework.toLowerCase()}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {framework}
                        </label>
                      </div>
                    )
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Template cards grid */}
          <div className="col-span-1 lg:col-span-3">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <P className="text-muted-foreground">
                  No templates found. Please check back later.
                </P>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Link
                    key={template.slug}
                    href={`/templates/${template.slug}`}
                    className="group block"
                  >
                    <Card className="overflow-hidden border transition-all hover:shadow-md">
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                        <Image
                          src={
                            template.logo ||
                            "/static/templates/default-template.webp"
                          }
                          alt={template.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <CardContent className="p-6">
                        <h3 className="mb-2 text-xl font-bold">
                          {template.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {template.description.length > 100
                            ? `${template.description.substring(0, 100)}...`
                            : template.description}
                        </p>

                        {template.tags && template.tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {template.tags.map((tag) => (
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
                      </CardContent>
                      <CardFooter className="border-t p-6">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="flex items-center">
                            {template.difficulty && (
                              <span className="font-medium">
                                {template.difficulty}
                              </span>
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-primary hover:text-primary/80"
                          >
                            View Details <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Installation Section */}
        <div className="mt-16 rounded-lg border bg-card p-6 sm:p-8 shadow-sm">
          <H2 className="text-2xl font-semibold mb-4">Get Started</H2>
          <P className="mb-4">
            You can use our CLI tool to quickly create a new project based on
            any of these templates:
          </P>
          <div className="bg-muted p-4 rounded-md overflow-x-auto mb-4 border">
            <code className="text-sm font-mono">
              npx create-helicone-app my-project
            </code>
          </div>
          <div className="flex justify-between items-center">
            <P className="text-sm text-muted-foreground">
              The CLI will guide you through selecting a template and
              configuring your new project.
            </P>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://docs.helicone.ai/getting-started/quickstart"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn More <ArrowRight className="ml-1 h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
