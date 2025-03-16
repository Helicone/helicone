import { Metadata } from "next";
import { H1, H2, P, Lead, Small } from "@/components/ui/typography";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon, ArrowRight, ArrowRightIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clsx } from "@/utils/clsx";

export const metadata: Metadata = {
    title: "Customer Case Studies | Helicone",
    description:
        "Discover how leading companies are using Helicone to monitor and optimize their AI applications.",
};

interface CaseStudy {
    title: string;
    company: string;
    description: string;
    industry: string;
    logoSrc: string;
    href: string;
}

interface Customer {
    logoHref: string;
    linkHref: string;
    title: string;
    className?: string;
    industry?: string;
    description?: string;
    hasCaseStudy?: boolean;
}

const customers: Customer[] = [
    {
        title: "Greptile",
        logoHref: "/static/greptile.webp",
        linkHref: "/customers/greptile",
        className: "p-2",
        industry: "Developer Tools",
        description: "AI-powered code search tool that helps developers find and understand code across their codebase.",
        hasCaseStudy: true,
    },
    {
        title: "Filevine",
        logoHref: "/static/filevine.webp",
        linkHref: "https://www.filevine.com/",
        className: "p-4",
        industry: "Legal Tech",
        description: "Legal case management software that streamlines workflows for legal professionals.",
    },
];

const caseStudies: CaseStudy[] = [
    {
        title: "How Greptile Uses Helicone to Monitor and Optimize Their AI-Powered Code Search Tool",
        company: "Greptile",
        description: "Greptile improved their AI code search performance by 35% and reduced costs by 28% with Helicone's observability platform.",
        industry: "Developer Tools",
        logoSrc: "/static/greptile.webp",
        href: "/customers/greptile",
    },
    // Add more case studies as they become available
];

// This is the component that will be used in other pages
export function Customers() {
    return <CustomerGrid />;
}

// Separate the customer grid from the page layout for better reusability
export function CustomerGrid() {
    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
                {customers.map((customer, i) => {
                    const isInternalLink = customer.linkHref.startsWith('/');

                    return (
                        <Link
                            className="group flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                            href={customer.linkHref}
                            key={`${i}-${customer.title}`}
                            target={isInternalLink ? "_self" : "_blank"}
                            rel={isInternalLink ? "" : "noopener noreferrer"}
                        >
                            <div className="h-[180px] bg-slate-50 flex items-center justify-center p-6 border-b border-slate-100">
                                <img
                                    src={customer.logoHref}
                                    alt={customer.title}
                                    width={400}
                                    height={300}
                                    style={{
                                        objectFit: "contain",
                                    }}
                                    className={clsx("h-[100px] max-w-[200px]", customer.className)}
                                />
                            </div>
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg">{customer.title}</h3>
                                    {customer.industry && (
                                        <span className="bg-sky-50 text-sky-700 text-xs px-2 py-1 rounded-full">
                                            {customer.industry}
                                        </span>
                                    )}
                                </div>
                                {customer.description && (
                                    <P className="text-slate-600 mb-4">{customer.description}</P>
                                )}
                                <div className="mt-auto flex items-center">
                                    {customer.hasCaseStudy ? (
                                        <span className="text-sm text-primary font-medium flex items-center group-hover:text-primary/80">
                                            Read story <ChevronRight className="ml-1 h-4 w-4" />
                                        </span>
                                    ) : (
                                        <span className="text-slate-500 text-sm">Visit website</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default function Page() {
    return (
        <div className="w-full bg-background h-full antialiased relative text-foreground">
            <div className="relative w-full flex flex-col gap-6 mx-auto max-w-7xl h-full py-16 px-4 sm:px-6 lg:px-8">
                <H1 className="font-semibold">Customer Stories</H1>
                <Lead className="mb-8 text-muted-foreground max-w-xl">
                    Thousands of leading companies and developers use Helicone to monitor and optimize their AI workflow.
                </Lead>

                <CustomerGrid />
            </div>

            <div className="w-full bg-[#F2F9FC] relative">
                <div className="absolute inset-0 w-full h-full z-0"
                    style={{
                        backgroundImage: "url(/static/home/cta-bg.webp)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                    }}
                ></div>
                <div className="relative z-10 py-16 md:py-24">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-8 text-center">
                            <div className="flex flex-col items-center text-wrap text-3xl md:text-5xl font-semibold text-slate-500 leading-snug">
                                <div className="flex flex-wrap gap-x-3 gap-y-1 items-center justify-center">
                                    <div className="bg-[#E7F6FD] border-[3px] border-brand rounded-xl py-2 px-7 text-brand rotate-[-2deg]">
                                        <h2>Actionable</h2>
                                    </div>
                                    <h2>insights</h2>
                                </div>
                                <h2>for your AI applications</h2>
                            </div>
                            <div>
                                <Button
                                    size="lg"
                                    className="mx-auto font-medium py-8 px-9 text-2xl bg-brand hover:bg-brand/90 text-white rounded-lg flex items-center gap-2"
                                >
                                    Get Started with Helicone
                                    <ArrowRightIcon className="ml-1 h-5 w-5" strokeWidth={2.5} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 