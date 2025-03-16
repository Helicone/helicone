'use client';

import Image from "next/image";
import Link from "next/link";
import { H1, P } from "@/components/ui/typography";
import {
    ChevronRight,
    Sparkles,
    Layers,
    Code,
    MessageSquare,
    GraduationCap,
    HeartPulse,
    Building2,
    Car,
    HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// Define project tag interface
interface ProjectTag {
    name: string;
    icon: React.ReactNode;
}

// Define project interface
interface Project {
    title: string;
    description: string;
    usage: string;
    creators: {
        name: string;
        href: string;
    }[];
    imageHref: string;
    tags: ProjectTag[];
    href: string;
    isOpenSourced?: true;
}

// Define tag structure with consistent icons
const TAGS: Record<string, ProjectTag> = {
    learning: {
        name: "Learning",
        icon: <Layers size={16} className="mr-1 stroke-[1.5px]" />,
    },
    tech: {
        name: "Tech",
        icon: <Code size={16} className="mr-1 stroke-[1.5px]" />,
    },
    marketing: {
        name: "Digital Marketing",
        icon: <MessageSquare size={16} className="mr-1 stroke-[1.5px]" />,
    },
    education: {
        name: "Education",
        icon: <GraduationCap size={16} className="mr-1 stroke-[1.5px]" />,
    },
    healthcare: {
        name: "Healthcare",
        icon: <HeartPulse size={16} className="mr-1 stroke-[1.5px]" />,
    },
    civictech: {
        name: "Civic Technology",
        icon: <Building2 size={16} className="mr-1 stroke-[1.5px]" />,
    },
    automotive: {
        name: "Automotive",
        icon: <Car size={16} className="mr-1 stroke-[1.5px]" />,
    },
    customersupport: {
        name: "Customer Support",
        icon: <HelpCircle size={16} className="mr-1 stroke-[1.5px]" />,
    },
};

// Project data structure
const projects: Project[] = [
    {
        title: "Chatwith",
        description: "Instantly answer questions with your custom no-code AI chatbot.",
        usage: "I love the extra insight Helicone gives me into my LLM usage. I appreciate both the big picture overview and the opportunity to drill into every request. It helps me keep my product stable & performant and optimize the costs.",
        creators: [{ name: "Rafal Zawadzki", href: "https://x.com/rafal_makes" }],
        imageHref: "/static/community/projects/chatwith.webp",
        tags: [TAGS.customersupport],
        href: "https://chatwith.tools",
    },
    {
        title: "DeAP Learning",
        description: "An AI personal tutor that helps students feel excited and supported at every step on their educational journey.",
        usage: "Helicone is the perfect one-stop-shop for us to monitor all our our LLM queries. The observability & speed is unmatched for the price point.",
        creators: [{ name: "Anish Anne", href: "https://www.linkedin.com/in/anish-anne" }, { name: "Neil Shah", href: "https://www.linkedin.com/in/n-shah/" }, { name: "Harry Fazzone", href: "https://www.linkedin.com/in/harry-fazzone-6ab0a0240/" }],
        imageHref: "/static/community/projects/deaplearning.webp",
        tags: [TAGS.education],
        href: "https://deaplearning.com",
    },
    {
        title: "elcerokm",
        description: "Connect car dealerships with car buyers.",
        usage: "We built a chatbot to capture leads and help users find the best car in the market. Helicone helps us monitor the expenses.",
        creators: [{ name: "Maria Bernardez", href: "https://www.linkedin.com/in/angelesbernardez/" }],
        imageHref: "/static/community/projects/elcerokm.webp",
        tags: [TAGS.automotive],
        href: "https://elcerokm.com",
    },
    {
        title: "Charm",
        description: "AI Sales Chatbot for B2B Growth & Marketing Teams. 1 line of code, double conversion rate.",
        usage: "Helicone has solved LLM observability for us. Integration was painless and now we can quickly see what's happening under the hood for requests & embeddings across all of our LLMs. Totally recommend.",
        creators: [{ name: "Izu Elechi", href: "https://www.linkedin.com/in/izuchukwu/" }, { name: "Caleb Lewis", href: "https://www.linkedin.com/in/developercaleb/" }],
        imageHref: "/static/community/projects/charm.webp",
        tags: [TAGS.tech],
        href: "https://joincharm.com/",
    },
    {
        title: "Dating Studio",
        description: "Copilot for Dating Apps. Designed to elevate your chats, not replace them.",
        usage: "Logging AI requests to unlock insights into how models are performing to optimize the experience and pick the best match for users' tasks.",
        creators: [{ name: "LV", href: "" }],
        imageHref: "/static/community/projects/dating-studio.webp",
        tags: [TAGS.tech],
        href: "https://about.dating.studio/extension",
    },
    {
        title: "Open Council Network",
        description: "Make the decision making process of local government accessible to citizens.",
        usage: "We use LLMs to transcribe council meetings, extract data from them, and generate summaries and email updates. Helicone has been invaluable to monitor, track and optimise those queries, and to allow us to compare performance across different LLM providers, so that we don't feel locked in to any provider and can make effective decisions to optimise costs and performance.",
        creators: [{ name: "Toby Abel", href: "" }],
        imageHref: "/static/community/projects/open-council-network.webp",
        tags: [TAGS.civictech],
        href: "https://opencouncil.network",
    },
    {
        title: "Haema",
        description: "Help people with diabetes learn how food and exercise affects their blood sugar.",
        usage: "We use Helicone to log all of the requests to our AI and we're using the logged data to directly improve our product.",
        creators: [{ name: "Pranav Ahluwalia", href: "https://x.com/PranavAhl" }],
        imageHref: "/static/community/projects/haema.webp",
        tags: [TAGS.healthcare],
        href: "https://www.haema.co/",
    },
    {
        title: "DemoFox",
        description: "Translate jargon instantly, articulate business value, and make inter-department communication hassle-free.",
        usage: "We use Helicone to understand why a prompt fails to return valid data.",
        creators: [{ name: "Tim Elam", href: "https://linkedin.com/company/demofox" }],
        imageHref: "/static/community/projects/demofox.webp",
        tags: [TAGS.tech],
        href: "https://www.demofox.com",
    },
    {
        title: "CodeCrafters",
        description: "Practice writing complex software.",
        usage: "We use Helicone for monitoring costs on our LLM features in production. In development it also helps with inspecting the final prompts we're generating and allows quickly tweaking and experimenting using the Playground.",
        creators: [{ name: "Paul Kuruvilla", href: "https://x.com/rohitpaulk" }, { name: "Sarup Banskota", href: "https://x.com/sarupbanskota" }],
        imageHref: "/static/community/projects/codecrafters.webp",
        tags: [TAGS.education],
        isOpenSourced: true,
        href: "https://codecrafters.io/",
    },
    {
        title: "Reworkd",
        description: "The simplest way to extract structured web data.",
        usage: "We are using Helicone for API logging and cost analysis.",
        creators: [{ name: "Asim Shrestha", href: "https://www.linkedin.com/company/reworkd/" }],
        imageHref: "/static/community/projects/reworkd.webp",
        tags: [TAGS.tech],
        isOpenSourced: true,
        href: "https://github.com/reworkd/",
    },
    {
        title: "Jsonify",
        description: "Use AI to turn websites and documents into useful structured data. ",
        usage: "Helicone helps us keep track of OpenAI metrics -- cost, latency, failures, etc.",
        creators: [{ name: "Paul Hunkin", href: "https://www.linkedin.com/in/phunkin/" }, { name: "Nick Linkevich", href: "https://www.linkedin.com/in/nicklink/" }],
        imageHref: "/static/community/projects/jsonify.webp",
        tags: [TAGS.tech],
        href: "https://jsonify.com",
    },
    {
        title: "assistant-ui",
        description: "React components for AI chat.",
        usage: "We use Helicone to get a detailed token cost breakdown per user.",
        creators: [{ name: "Simon Farshid", href: "http://linkedin.com/in/simon-farshid" }],
        imageHref: "/static/community/projects/assistant-ui.webp",
        tags: [TAGS.tech],
        isOpenSourced: true,
        href: "https://github.com/Yonom/assistant-ui",
    },
    {
        title: "PitchGhost",
        description: "Find customers on social media that your brand or business should engage with.",
        usage: "Our platform involves tons of calls to LLMs to read and digest all of the social media posts we scan through. Helicone has been invaluable to us in checking in and monitoring these systems and especially debugging LLM calls through the playground.",
        creators: [{ name: "Marc Frankel", href: "https://twitter.com/pitchghost" }],
        imageHref: "/static/community/projects/pitchghost.webp",
        tags: [TAGS.marketing],
        href: "https://pitchghost.com",
    },
    {
        title: "mangosqueezy",
        description: "The first crypto-based affiliate marketing platform to connect businesses with affiliates and grow their sales or audience.",
        usage: "We are using Helicone to monitor our LLM usage so we know how many tokens we have used and which countries the usage is coming from. Additionally, we plan to implement a user rate limiting feature soon.",
        creators: [{ name: "Amit Mirgal", href: "https://x.com/amit_mirgal" }, { name: "Devika Mahajan", href: "https://www.linkedin.com/in/devika--mahajan/" }],
        imageHref: "/static/community/projects/mangosqueezy.webp",
        tags: [TAGS.marketing],
        isOpenSourced: true,
        href: "https://github.com/mangosqueezy/mangosqueezy",
    },
    {
        title: "Greptile",
        description: "AI expert on any codebase, as an API.",
        usage: "We use Helicone for tracing and logging LLM calls to debug, track usage, manage costs, and prepare datasets for finetuning.",
        creators: [{ name: "Daksh Gupta", href: "https://twitter.com/dakshgup" }, { name: "Soohoon Choi", href: "https://twitter.com/soohoonchoi" }, { name: "Vaishant Kameswaran", href: "https://twitter.com/vaishaaant" }],
        imageHref: "/static/community/projects/greptile.webp",
        tags: [TAGS.tech],
        href: "https://greptile.com",
    },
    {
        title: "LinkedInFy",
        description: "Automate your LinkedIn posts, free up your time.",
        usage: "Helicone helps us monitor different LLM model results and see prompts result.",
        creators: [{ name: "Abhishek", href: "https://x.com/abhishk_084" }],
        imageHref: "/static/community/projects/linkedinfy.webp",
        tags: [TAGS.tech],
        href: "https://www.linkedinfy.com/",
    },
];

// Project Card Component
const ProjectCard = ({ project }: { project: Project }) => (
    <Link
        className="flex flex-col gap-4 md:gap-6 p-2 md:p-6 w-full bg-slate-50 hover:bg-slate-100 rounded-xl pb-4 md:pb-6 transition-all duration-300"
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
    >
        <div className="w-full flex-1 flex flex-col text-left px-1 md:px-0">
            <div className="flex items-center flex-wrap gap-2">
                <h2 className="font-bold text-lg leading-snug tracking-tight mr-2">{project.title}</h2>

                {/* Tags */}
                {project.tags.map((tag, index) => (
                    <span
                        key={index}
                        className="bg-sky-50 text-sky-700 ring-sky-600/10 w-max items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset"
                    >
                        {tag.name}
                    </span>
                ))}

                {/* Open Source badge */}
                {project.isOpenSourced && (
                    <span className="bg-sky-200 text-sky-700 w-max items-center rounded-full px-3 py-1 text-xs font-medium">
                        Open-source
                    </span>
                )}
            </div>

            <p className="text-slate-500 text-sm pb-2 mt-2">"{project.usage}"</p>

            <div className="mt-auto pt-4">
                <span className="text-sm text-primary font-medium flex items-center group-hover:text-primary/80">
                    Visit website <ChevronRight size={16} className="ml-1" />
                </span>
            </div>
        </div>
    </Link>
);

// Submit Project Banner Component
const SubmitProjectBanner = () => (
    <div className="flex justify-center w-full mb-6">
        <div className="flex flex-col items-center sm:flex-row justify-center space-x-2 py-4 px-6 sm:px-16 bg-sky-50 border border-sky-100 rounded-md w-full">
            <Sparkles size={20} className="text-sky-500" />
            <div className="text-sm text-sky-500 font-semibold text-center sm:text-left">
                Using Helicone?{" "}
                <Link
                    href="https://forms.gle/WpTEEE6vVdQccprD9"
                    className="text-sm text-sky-500 hover:text-sky-500 sm:whitespace-nowrap"
                >
                    Share your project
                </Link>{" "}
                with us.
            </div>
        </div>
    </div>
);

// Main Projects Component
function ProjectsGrid() {
    const [selectedTag, setSelectedTag] = useState<ProjectTag | null>(null);

    // Get unique tags and count projects for each tag
    const uniqueTags = Object.values(TAGS);
    const tagCounts: Record<string, number> = uniqueTags.reduce((acc, tag) => {
        acc[tag.name] = projects.filter(project =>
            project.tags.some(projectTag => projectTag.name === tag.name)
        ).length;
        return acc;
    }, {} as Record<string, number>);

    // Filter out tags with zero projects and sort by count
    const tagsWithProjects = uniqueTags
        .filter(tag => tagCounts[tag.name] > 0)
        .sort((a, b) => tagCounts[b.name] - tagCounts[a.name]);

    // Reset selected tag if it's no longer valid
    useEffect(() => {
        if (selectedTag && !tagsWithProjects.some(tag => tag.name === selectedTag.name)) {
            setSelectedTag(null);
        }
    }, [selectedTag, tagsWithProjects]);

    // Filter projects based on selected tag
    const filteredProjects = selectedTag
        ? projects.filter(project =>
            project.tags.some(tag => tag.name === selectedTag.name)
        )
        : projects;

    return (
        <div className="w-full">
            {/* Tag Filter */}
            <div className="w-full mb-6 bg-card rounded-lg p-4">
                <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                        variant={selectedTag === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTag(null)}
                        className="rounded-full flex items-center gap-1.5"
                    >
                        <Sparkles size={16} className="mr-1" />
                        All
                    </Button>

                    {tagsWithProjects.map((tag, index) => (
                        <Button
                            key={index}
                            variant={selectedTag?.name === tag.name ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTag(selectedTag?.name === tag.name ? null : tag)}
                            className="rounded-full flex items-center gap-1.5"
                        >
                            {tag.icon}
                            {tag.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* <SubmitProjectBanner /> */}

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                {filteredProjects.map((project, i) => (
                    <ProjectCard project={project} key={i} />
                ))}
            </div>

            {filteredProjects.length === 0 && (
                <div className="w-full text-center py-12">
                    <P className="text-slate-500">No projects found with the selected filter.</P>
                </div>
            )}
        </div>
    );
}

// Page Component
export default function Page() {
    return (
        <div className="w-full bg-gradient-to-b bg-white min-h-screen antialiased relative text-black">
            <div className="relative w-full flex flex-col mx-auto max-w-7xl h-full py-8 md:py-12 items-center text-center px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col items-center">
                    <Image
                        src="/static/community/shiny-cube.webp"
                        alt="shiny-cube"
                        width={200}
                        height={100}
                    />
                    <H1 className="mt-4">Community Projects</H1>
                    <P className="text-slate-500 max-w-2xl">
                        Products built with Helicone, by our amazing community of developers.
                    </P>
                </div>

                <ProjectsGrid />
            </div>
        </div>
    );
} 