import { promises as fs } from "fs";
import { serialize } from "next-mdx-remote/serialize";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import path from "path";
import { RemoteMdxPage } from "./mdxRenderer";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, Calendar, Clock } from "lucide-react";
import { Metadata } from "next";
import { H1, H2, P, Lead } from "@/components/ui/typography";

// Function to get case study metadata
async function getCaseStudyMetadata(filePath: string) {
    try {
        const metadataPath = path.join(
            process.cwd(),
            "app",
            "customers",
            "case-studies",
            filePath,
            "metadata.json"
        );
        const metadataContent = await fs.readFile(metadataPath, "utf8");
        return JSON.parse(metadataContent);
    } catch (error) {
        console.error("Error reading case study metadata:", error);
        return null;
    }
}

// Generate metadata for the page
export async function generateMetadata({
    params,
}: {
    params: { "file-path": string };
}): Promise<Metadata> {
    const metadata = await getCaseStudyMetadata(params["file-path"]);

    if (!metadata) {
        return {
            title: "Case Study | Helicone",
            description: "Learn how companies use Helicone to optimize their AI applications.",
        };
    }

    return {
        title: `${metadata.title} | Helicone`,
        description: metadata.description,
        openGraph: {
            title: metadata.title,
            description: metadata.description,
            type: "article",
        },
    };
}

export default async function CaseStudyPage({
    params,
}: {
    params: {
        "file-path": string;
    };
}) {
    const caseStudyPath = path.join(
        process.cwd(),
        "app",
        "customers",
        "case-studies",
        params["file-path"],
        "src.mdx"
    );

    try {
        const source = await fs.readFile(caseStudyPath, "utf8");
        const metadata = await getCaseStudyMetadata(params["file-path"]);

        if (!metadata) {
            notFound();
        }

        const mdxSource = await serialize(source, {
            mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeHighlight],
            },
        });

        return (
            <div className="w-full bg-background h-full antialiased relative text-foreground">
                <div className="relative w-full flex flex-col gap-8 mx-auto max-w-7xl h-full py-16 px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <Link
                            href="/customers"
                            className="flex items-center text-slate-500 hover:text-slate-700 mb-4"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            <span>Back to Customers</span>
                        </Link>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <img
                                    src={metadata.logoSrc}
                                    alt={`${metadata.company} logo`}
                                    className="h-16 object-contain"
                                />
                            </div>
                            <div>
                                <span className="bg-sky-50 text-sky-700 text-xs px-2 py-1 rounded-full">
                                    {metadata.industry}
                                </span>
                                <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        <span>{metadata.date}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        <span>{metadata.readTime}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <article className="prose prose-slate max-w-none lg:prose-lg">
                        <RemoteMdxPage mdxSource={mdxSource} />
                    </article>

                    <div className="mt-12 pt-8 border-t border-slate-200">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                            <div>
                                <P className="text-slate-500">Want to become a Helicone customer?</P>
                                <H2 className="text-2xl mt-2">Get started for free today</H2>
                            </div>
                            <Button variant="default" size="lg" asChild>
                                <Link href="https://www.helicone.ai/signup">Start Your Free Trial</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error rendering case study:", error);
        notFound();
    }
} 