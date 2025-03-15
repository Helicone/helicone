import { Metadata } from "next";
import Image from "next/image";
import { clsx } from "@/utils/clsx";
import Link from "next/link";
import React from "react";
import { ArrowRight } from "lucide-react";
import { H1, P, Small } from "@/components/ui/typography";

export const metadata: Metadata = {
    title: "Helicone Integrations | AI Platform Integrations",
    description:
        "Explore the various integrations available with Helicone. Connect your AI applications with popular frameworks and tools to enhance your development workflow.",
    icons: "https://www.helicone.ai/static/logo.webp",
    openGraph: {
        type: "website",
        siteName: "Helicone.ai",
        url: "https://www.helicone.ai/integrations",
        title: "Helicone Integrations | AI Platform Integrations",
        description:
            "Explore the various integrations available with Helicone. Connect your AI applications with popular frameworks and tools to enhance your development workflow.",
        images: "/static/new-open-graph.png",
        locale: "en_US",
    },
    twitter: {
        title: "Helicone Integrations | AI Platform Integrations",
        description:
            "Explore the various integrations available with Helicone. Connect your AI applications with popular frameworks and tools to enhance your development workflow.",
        card: "summary_large_image",
        images: "/static/new-open-graph.png",
    },
};

interface Integration {
    title: string;
    href: string;
    imageHref: string;
    docsHref: string;
    altDocString?: React.ReactNode;
    imageClassName?: string;
}

const integrations: Integration[] = [
    {
        title: "PostHog",
        href: "https://posthog.com",
        imageHref: "/static/integrations/posthog.webp",
        docsHref: "https://posthog.com/docs/ai-engineering/helicone-posthog",
        imageClassName: "px-[12px]",
    },
    {
        title: "Big-AGI",
        href: "https://github.com/enricoros/big-agi?tab=readme-ov-file",
        imageHref: "/static/integrations/big_agi.png",
        docsHref: "https://github.com/enricoros/big-agi?tab=readme-ov-file",
        imageClassName: "px-[28px]",
    },
    {
        title: "LangChain",
        href: "https://www.langchain.com/",
        imageHref: "/static/integrations/langchain.jpeg",
        docsHref: "https://docs.helicone.ai/integrations/openai/langchain",
        imageClassName: "px-[12px]",
    },
    {
        title: "LLamaIndex",
        href: "https://www.llamaindex.ai/",
        imageHref: "/static/integrations/llamaindex.png",
        docsHref: "https://docs.helicone.ai/integrations/openai/llamaindex",
        imageClassName: "px-[8px]",
    },
    {
        title: "Crew AI",
        href: "https://www.crewai.com/",
        imageHref: "/static/integrations/crewai.png",
        docsHref: "https://docs.helicone.ai/integrations/openai/crewai",
        imageClassName: "px-[18px]",
    },
    {
        title: "Open WebUI",
        href: "https://github.com/open-webui/open-webui",
        imageHref: "/static/integrations/open-webui.png",
        docsHref: "https://docs.helicone.ai/other-integrations/open-webui",
        imageClassName: "px-[64px]",
    },
    {
        title: "Meta GPT",
        href: "https://github.com/geekan/MetaGPT",
        imageHref: "/static/integrations/meta-gpt.png",
        docsHref: "https://docs.helicone.ai/other-integrations/meta-gpt",
        imageClassName: "px-[12px]",
    },
    {
        title: "Open Devin",
        href: "https://github.com/OpenDevin/OpenDevin",
        imageHref: "/static/integrations/open-devin.png",
        docsHref: "https://docs.helicone.ai/other-integrations/open-devin",
    },
    {
        title: "PromptArmor",
        href: "https://promptarmor.com/",
        imageHref: "/static/integrations/prompt-armor-logo.jpeg",
        docsHref: "https://docs.helicone.ai/features/advanced-usage/llm-security",
        imageClassName: "bg-gray-500 px-[18px]",
    },
    {
        title: "Mem0 Embedchain",
        href: "https://embedchain.ai/",
        imageHref: "/static/integrations/mem0.webp",
        docsHref: "https://docs.helicone.ai/other-integrations/embedchain",
        imageClassName: "",
    },
    {
        title: "Lytix",
        href: "https://www.lytix.co/",
        imageHref: "/static/integrations/lytix.svg",
        altDocString: <> - Coming soon</>,
        docsHref: "",
        imageClassName: "px-[40px]",
    },
    {
        title: "OpenPipe",
        href: "",
        imageHref: "/static/integrations/openpipe.png",
        docsHref: "",
        altDocString: <> - Coming soon</>,
        imageClassName: "px-[40px]",
    },
    {
        title: "Ploomber",
        href: "",
        imageHref: "/static/integrations/ploomber.png",
        docsHref: "",
        altDocString: <> - Coming soon</>,
        imageClassName: "px-[12px]",
    },
];

function IntegrationCard({ integration }: { integration: Integration }) {
    return (
        <div
            id="featured"
            className="flex flex-col rounded-lg col-span-2 md:col-span-1"
        >
            <div className="p-4 w-full h-fit rounded-lg flex flex-col text-left text-gray-700">
                <Link
                    className="font-semibold text-md p-4 w-fit hover:bg-sky-50 rounded-lg mt-2"
                    href={integration.href}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Image
                        src={integration.imageHref}
                        alt={integration.title}
                        width={160}
                        height={160}
                        style={{
                            objectFit: "contain",
                        }}
                        className={clsx(
                            "rounded-lg h-[160px] w-[160px] bg-white border border-gray-100",
                            integration.imageClassName
                        )}
                    />

                    <div className="mt-4">{integration.title}</div>

                    {integration.docsHref ? (
                        <Link
                            href={integration.docsHref}
                            className="flex gap-2 py-2 text-xs w-fit items-center font-semibold text-sky-500"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <p>Visit website</p>
                            <div>
                                <ArrowRight
                                    size={16}
                                    className="transform -rotate-45"
                                />
                            </div>
                        </Link>
                    ) : (
                        <Small className="flex gap-2 py-2 text-xs w-fit items-center font-semibold text-muted-foreground">
                            Coming soon
                        </Small>
                    )}
                </Link>
            </div>
        </div>
    );
}

function Integrations() {
    return (
        <div className="grid grid-cols-4">
            {integrations.map((integration, i) => (
                <IntegrationCard key={i} integration={integration} />
            ))}
        </div>
    );
}

export default function Page() {
    return (
        <div className="w-full bg-background h-full antialiased relative text-foreground mb-6">
            <div className="relative w-full flex flex-col gap-4 mx-auto max-w-5xl h-full py-16 items-center text-center px-2 sm:px-2 lg:px-0">
                <Image
                    src={"/static/community/shiny-cube.webp"}
                    alt={"shiny-cube"}
                    width={200}
                    height={100}
                />
                <H1>Integrations</H1>
                <P className="text-muted-foreground">
                    Connect your AI applications with popular frameworks and tools to enhance your development workflow.
                </P>

                <Integrations />
            </div>
        </div>
    );
} 