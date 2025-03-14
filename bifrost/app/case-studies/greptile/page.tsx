import Link from "next/link";
import { Metadata } from "next";
import { H1, H2, H3, P, Lead, Small, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export const metadata: Metadata = {
    title: "Greptile Case Study | Helicone",
    description:
        "How Greptile uses Helicone to monitor and optimize their AI-powered code search tool",
};

export default function GreptileCaseStudy() {
    return (
        <div className="relative w-full flex flex-col mx-auto max-w-7xl h-full py-8 md:py-12 items-center px-4 sm:px-6 lg:px-8">
            <div className="w-full mb-8">
                <Link
                    href="/case-studies"
                    className="flex items-center text-slate-500 hover:text-slate-700 mb-4"
                >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    <span>Other stories</span>
                </Link>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-2/3">
                        <div className="flex items-center mb-4">
                            <span className="bg-sky-200 text-sky-700 w-max items-center rounded-full px-3 py-1 text-sm font-medium mr-3">
                                Developer Tools
                            </span>
                            <span className="text-slate-500">June 2024</span>
                        </div>

                        <H1>How Greptile Uses Helicone to Monitor and Optimize Their AI-Powered Code Search Tool</H1>

                        <Lead className="mt-4 text-slate-600">
                            Greptile improved their AI code search performance by 35% and reduced costs by 28% with Helicone's observability platform.
                        </Lead>
                    </div>

                    <div className="w-full md:w-1/3 bg-white rounded-xl p-6 border border-slate-200">
                        <div className="flex justify-center mb-6">
                            <img
                                src="/static/greptile.webp"
                                alt="Greptile Logo"
                                className="h-16 object-contain"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Small className="text-slate-500">Industry</Small>
                                <P className="font-medium">Developer Tools</P>
                            </div>

                            <div>
                                <Small className="text-slate-500">Use Case</Small>
                                <P className="font-medium">AI-Powered Code Search</P>
                            </div>

                            <div>
                                <Small className="text-slate-500">Results</Small>
                                <ul className="mt-1 space-y-1">
                                    <li className="flex items-start">
                                        <span className="text-sky-500 mr-2">•</span>
                                        <P>35% improvement in search accuracy</P>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-sky-500 mr-2">•</span>
                                        <P>28% reduction in API costs</P>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-sky-500 mr-2">•</span>
                                        <P>50% faster debugging cycles</P>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full mb-12 overflow-hidden rounded-xl relative aspect-[21/9]">
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                    <img
                        src="/static/greptile.webp"
                        alt="Greptile Dashboard"
                        className="h-32 object-contain"
                    />
                </div>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <section>
                        <H2>About Greptile</H2>
                        <P className="mt-4">
                            Greptile is an AI-powered code search tool that helps developers find and understand code across their codebase.
                            Using advanced language models, Greptile enables semantic code search that understands the intent behind queries,
                            not just matching keywords.
                        </P>
                    </section>

                    <section>
                        <H2>The Challenge</H2>
                        <P className="mt-4">
                            As Greptile's user base grew, the team faced several challenges:
                        </P>
                        <ul className="mt-4 space-y-2">
                            <li className="flex items-start">
                                <span className="text-sky-500 font-bold mr-2">•</span>
                                <P>Difficulty tracking the performance and cost of different LLM providers</P>
                            </li>
                            <li className="flex items-start">
                                <span className="text-sky-500 font-bold mr-2">•</span>
                                <P>Limited visibility into how users were interacting with the AI search functionality</P>
                            </li>
                            <li className="flex items-start">
                                <span className="text-sky-500 font-bold mr-2">•</span>
                                <P>Challenges in identifying and fixing underperforming search queries</P>
                            </li>
                            <li className="flex items-start">
                                <span className="text-sky-500 font-bold mr-2">•</span>
                                <P>Rapidly increasing API costs as usage scaled</P>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <H2>The Solution</H2>
                        <P className="mt-4">
                            Greptile integrated Helicone into their AI infrastructure to gain comprehensive observability into their LLM usage:
                        </P>
                        <ul className="mt-4 space-y-2">
                            <li className="flex items-start">
                                <span className="text-sky-500 font-bold mr-2">•</span>
                                <P><strong>Request Monitoring:</strong> Tracked all search queries and responses to understand usage patterns</P>
                            </li>
                            <li className="flex items-start">
                                <span className="text-sky-500 font-bold mr-2">•</span>
                                <P><strong>Cost Analytics:</strong> Implemented detailed cost tracking across different models and features</P>
                            </li>
                            <li className="flex items-start">
                                <span className="text-sky-500 font-bold mr-2">•</span>
                                <P><strong>Performance Metrics:</strong> Measured latency, token usage, and search accuracy</P>
                            </li>
                            <li className="flex items-start">
                                <span className="text-sky-500 font-bold mr-2">•</span>
                                <P><strong>User Feedback Collection:</strong> Captured and analyzed user feedback on search results</P>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <H2>The Results</H2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200">
                                <H3 className="text-sky-600">35%</H3>
                                <P className="mt-2">Improvement in search accuracy</P>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200">
                                <H3 className="text-sky-600">28%</H3>
                                <P className="mt-2">Reduction in API costs</P>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200">
                                <H3 className="text-sky-600">50%</H3>
                                <P className="mt-2">Faster debugging cycles</P>
                            </div>
                        </div>

                        <P className="mt-6">
                            With Helicone's observability platform, Greptile was able to:
                        </P>
                        <ul className="mt-4 space-y-2">
                            <li className="flex items-start">
                                <span className="text-sky-500 font-bold mr-2">•</span>
                                <P>Identify and optimize underperforming search queries</P>
                            </li>
                            <li className="flex items-start">
                                <span className="text-sky-500 font-bold mr-2">•</span>
                                <P>Implement caching for common queries, reducing API costs</P>
                            </li>
                            <li className="flex items-start">
                                <span className="text-sky-500 font-bold mr-2">•</span>
                                <P>Fine-tune prompt templates based on real user data</P>
                            </li>
                            <li className="flex items-start">
                                <span className="text-sky-500 font-bold mr-2">•</span>
                                <P>Make data-driven decisions about which LLM providers to use for different types of searches</P>
                            </li>
                        </ul>
                    </section>

                    <section className="border-t border-slate-200 pt-8">
                        <blockquote className="italic text-slate-700 text-lg">
                            "Helicone has been a game-changer for our team. The visibility it provides into our LLM usage has allowed us to optimize our search algorithms and significantly reduce costs while improving results for our users."
                        </blockquote>
                        <div className="mt-4 flex items-center">
                            <div className="h-10 w-10 rounded-full bg-slate-200"></div>
                            <div className="ml-3">
                                <P className="font-medium">Alex Chen</P>
                                <Small className="text-slate-500">CTO, Greptile</Small>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <div className="bg-sky-50 p-6 rounded-xl border border-sky-100">
                        <H3 className="text-sky-800 mb-4">Ready to optimize your AI applications?</H3>
                        <P className="mb-6">Get the same visibility and control that helped Greptile improve performance and reduce costs.</P>
                        <Button className="w-full">Get Started with Helicone</Button>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <H3 className="mb-4">Related Case Studies</H3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/case-studies/mintlify" className="block hover:bg-slate-50 p-3 rounded-lg transition-colors">
                                    <P className="font-medium">Mintlify</P>
                                    <Small className="text-slate-500">Documentation Platform</Small>
                                </Link>
                            </li>
                            <li>
                                <Link href="/case-studies/codegen" className="block hover:bg-slate-50 p-3 rounded-lg transition-colors">
                                    <P className="font-medium">Codegen</P>
                                    <Small className="text-slate-500">Code Generation</Small>
                                </Link>
                            </li>
                            <li>
                                <Link href="/case-studies/qa-wolf" className="block hover:bg-slate-50 p-3 rounded-lg transition-colors">
                                    <P className="font-medium">QA Wolf</P>
                                    <Small className="text-slate-500">Testing Automation</Small>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
} 