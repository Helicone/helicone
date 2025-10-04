import { Button } from "@/components/ui/button";
import { clsx } from "@/utils/clsx";
import {
  ArrowUpRight,
  Brush,
  Building2,
  Code,
  GraduationCap,
  MessageSquareHeart,
  Sparkles,
  HeartPulse,
  Car,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
interface ProjectTag {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const TAGS: Record<string, ProjectTag> = {
  tech: {
    name: "Tech",
    href: "",
    icon: <Code className="size-5 mr-2" />,
  },
  marketing: {
    name: "Digital Marketing",
    href: "",
    icon: <Brush className="size-5 mr-2" />,
  },
  education: {
    name: "Education",
    href: "",
    icon: <GraduationCap className="size-5 mr-2" />,
  },
  healthcare: {
    name: "Healthcare",
    href: "",
    icon: <HeartPulse className="size-5 mr-2" />,
  },
  civictech: {
    name: "Civic Technology",
    href: "",
    icon: <Building2 className="size-5 mr-2" />,
  },
  automotive: {
    name: "Automotive",
    href: "",
    icon: <Car className="size-5 mr-2" />,
  },
  customersupport: {
    name: "Customer Support",
    href: "",
    icon: <MessageSquareHeart className="size-5 mr-2" />,
  },
};

interface Project {
  title: string;
  usage: string;
  imageHref: string;
  tags: ProjectTag[];
  href: string;
  isOpenSourced?: true;
}

const projects: Project[] = [
  {
    title: "Chatwith",
    usage:
      "I love the extra insight Helicone gives me into my LLM usage. I appreciate both the big picture overview and the opportunity to drill into every request. It helps me keep my product stable & performant and optimize the costs.",
    imageHref: "/static/customers/logos/chatwith.webp",
    tags: [TAGS.customersupport],
    href: "https://chatwith.tools",
  },
  {
    title: "DeAP Learning",
    usage:
      "Helicone is the perfect one-stop-shop for us to monitor all our our LLM queries. The observability & speed is unmatched for the price point.",
    imageHref: "/static/customers/logos/deap-learning.webp",
    tags: [TAGS.education],
    href: "https://deaplearning.com",
  },
  {
    title: "elcerokm",
    usage:
      "We built a chatbot to capture leads and help users find the best car in the market. Helicone helps us monitor the expenses.",
    imageHref: "/static/customers/logos/elcerokm.webp",
    tags: [TAGS.automotive],
    href: "https://elcerokm.com",
  },
  {
    title: "Charm",
    usage:
      "Helicone has solved LLM observability for us. Integration was painless and now we can quickly see what's happening under the hood for requests & embeddings across all of our LLMs. Totally recommend.",
    imageHref: "/static/customers/logos/joincharm.webp",
    tags: [TAGS.tech],
    href: "https://joincharm.com/",
  },
  {
    title: "Dating Studio",
    usage:
      "Logging AI requests to unlock insights into how models are performing to optimize the experience and pick the best match for users' tasks.",
    imageHref: "/static/customers/logos/dating-studio.webp",
    tags: [TAGS.tech],
    href: "https://dating.studio/",
  },
  {
    title: "Open Council Network",
    usage:
      "We use LLMs to transcribe council meetings, extract data from them, and generate summaries and email updates. Helicone has been invaluable to monitor, track and optimise those queries, and to allow us to compare performance across different LLM providers, so that we don't feel locked in to any provider and can make effective decisions to optimise costs and performance.",
    imageHref: "/static/customers/logos/open-council-network.webp",
    tags: [TAGS.civictech],
    href: "https://opencouncil.network",
  },
  {
    title: "Haema",
    usage:
      "We use Helicone to log all of the requests to our AI and we're using the logged data to directly improve our product.",
    imageHref: "/static/customers/logos/haema.webp",
    tags: [TAGS.healthcare],
    href: "https://www.haema.co/",
  },
  {
    title: "CodeCrafters",
    usage:
      "We use Helicone for monitoring costs on our LLM features in production. In development it also helps with inspecting the final prompts we're generating and allows quickly tweaking and experimenting using the Playground.",
    imageHref: "/static/customers/logos/codecrafters.webp",
    tags: [TAGS.education],
    isOpenSourced: true,
    href: "https://codecrafters.io/",
  },
  {
    title: "Reworkd",
    usage: "We are using Helicone for API logging and cost analysis.",
    imageHref: "/static/customers/logos/reworkd.webp",
    tags: [TAGS.tech],
    isOpenSourced: true,
    href: "https://github.com/reworkd/",
  },
  {
    title: "Jsonify",
    usage:
      "Helicone helps us keep track of OpenAI metrics -- cost, latency, failures, etc.",
    imageHref: "/static/customers/logos/jsonify.webp",
    tags: [TAGS.tech],
    href: "https://jsonify.com",
  },
  {
    title: "assistant-ui",
    usage: "We use Helicone to get a detailed token cost breakdown per user.",
    imageHref: "/static/customers/logos/assistant-ui.webp",
    tags: [TAGS.tech],
    isOpenSourced: true,
    href: "https://github.com/Yonom/assistant-ui",
  },
  {
    title: "PitchGhost",
    usage:
      "Our platform involves tons of calls to LLMs to read and digest all of the social media posts we scan through. Helicone has been invaluable to us in checking in and monitoring these systems and especially debugging LLM calls through the playground.",
    imageHref: "/static/customers/logos/pitchghost.webp",
    tags: [TAGS.marketing],
    href: "https://pitchghost.com",
  },
  {
    title: "mangosqueezy",
    usage:
      "We are using Helicone to monitor our LLM usage so we know how many tokens we have used and which countries the usage is coming from. Additionally, we plan to implement a user rate limiting feature soon.",
    imageHref: "/static/customers/logos/mangosqueezy.webp",
    tags: [TAGS.marketing],
    isOpenSourced: true,
    href: "https://github.com/mangosqueezy/mangosqueezy",
  },
  {
    title: "Greptile",
    usage:
      "We use Helicone for tracing and logging LLM calls to debug, track usage, manage costs, and prepare datasets for finetuning.",
    imageHref: "/static/customers/logos/greptile.webp",
    tags: [TAGS.tech],
    href: "https://greptile.com",
  },
];

export function Projects() {
  return (
    <div className="flex flex-col max-w-5xl mx-auto gap-8 py-16">
      <div className="relative w-full flex flex-col gap-4 items-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Community Projects
        </h2>
        <p className="text-sm sm:text-lg text-center text-accent-foreground">
          Products built with Helicone, by our amazing
          <br />
          community of developers.
        </p>
        <Button variant="outline" asChild className="w-fit">
          <Link
            href="https://forms.gle/WpTEEE6vVdQccprD9"
            target="_blank"
            rel="noopener"
          >
            <Sparkles className="size-4 mr-2" />
            Share Your Project
          </Link>
        </Button>
      </div>

      {/* Project filters */}
      {/* <ProjectFilter tags={allTags} /> */}

      {/* Project grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {projects.map((project, i) => {
          return (
            <div className="flex flex-col h-full gap-4 items-left" key={i}>
              <Link
                id="featured"
                className="flex flex-col gap-4 w-full h-full bg-gray-50 hover:bg-brand/10 transition-all duration-200 rounded-xl py-6 px-5 group"
                href={project.href}
                key={i}
                target="_blank"
              >
                {/* Each Project card */}
                <div className="flex flex-col justify-between h-full w-full text-left gap-8">
                  {/* Image and usage */}
                  <div className="flex flex-col gap-6">
                    <div className="flex items-start justify-between">
                      <Image
                        src={project.imageHref}
                        alt={project.title}
                        width={150}
                        height={100}
                        className="grayscale object-contain"
                      />
                      {/* Make arrow appear on hover */}
                      <ArrowUpRight className="size-4 text-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    <p className="text-muted-foreground text-sm font-normal leading-normal">
                      {'"'}
                      {project.usage}
                      {'"'}
                    </p>
                  </div>
                  {/* Tags */}
                  <div className="flex items-center justify-between gap-2 overflow-hidden ">
                    {/* Industry tag */}
                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={clsx(
                          "text-xs font-medium flex flex-row text-accent-foreground items-center gap",
                        )}
                      >
                        {tag.icon}
                        {tag.name}
                      </span>
                    ))}

                    {/* Open Source tag */}
                    {project.isOpenSourced && (
                      <span className="bg-slate-200 text-accent-foreground rounded-lg px-3 py-1 text-xs font-medium">
                        Open-Source
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
