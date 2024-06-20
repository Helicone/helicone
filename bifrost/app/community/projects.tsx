import { clsx } from "@/utils/clsx";
import Link from "next/link";

interface ProjectTag {
  name: string;
  href: string;
}

const TAGS: Record<string, ProjectTag> = {
  learning: {
    name: "Learning",
    href: "",
  },
  tech: {
    name: "Tech",
    href: "",
  },
  marketing: {
    name: "Digital Marketing",
    href: "",
  },
  education: {
    name: "Education",
    href: "",
  },
  healthcare: {
    name: "Healthcare",
    href: "",
  },
};

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
  isMonthlySpotlight?: true;
  isOpenSourced?: true;
}

const projects: Project[] = [
  {
    title: "Haema",
    description:
      "An AI mobile app to help people with diabetes learn how food and exercise affects their blood sugar.",
    usage:
      "We use Helicone to log all of the requests to our AI and we're using the logged data to directly improve our product.",
    creators: [
      {
        name: "Pranav Ahluwalia",
        href: "https://x.com/haema_co",
      },
      {
        name: "Pranav",
        href: "https://x.com/PranavAhl",
      },
    ],
    imageHref: "/static/community/projects/haema.webp",
    tags: [TAGS.Healthcare],
    href: "https://www.haema.co/",
  },
  {
    title: "DemoFox",
    description:
      "Instantly translates jargon and articulates business value, making inter-department communication hassle-free.",
    usage:
      "We use Helicone to understand why a prompt fails to return valid data.",
    creators: [
      {
        name: "Tim Elam",
        href: "https://linkedin.com/company/demofox",
      },
    ],
    imageHref: "/static/community/projects/demofox.webp",
    tags: [TAGS.Tech],
    href: "https://www.demofox.com",
  },
  {
    title: "CodeCrafters",
    description: "Practice writing complex software.",
    usage:
      "We use Helicone for monitoring costs on our LLM features in production. In development it also helps with inspecting the final prompts we're generating and allows quickly tweaking and experimenting using the Playground.",
    creators: [
      {
        name: "Paul Kuruvilla",
        href: "https://x.com/rohitpaulk",
      },
      {
        name: "Sarup Banskota",
        href: "https://x.com/sarupbanskota",
      },
    ],
    imageHref: "/static/community/projects/codecrafters.webp",
    tags: [TAGS.Education],
    isOpenSourced: true,
    href: "https://codecrafters.io/",
  },
  {
    title: "Reworkd",
    description: "Either AgentGPT or some new stuff we're working on!",
    usage: "API logging and cost analysis.",
    creators: [
      {
        name: "Asim Shrestha",
        href: "https://www.linkedin.com/company/reworkd/",
      },
    ],
    imageHref: "/static/community/projects/reworkd.webp",
    tags: [TAGS.Tech],
    isOpenSourced: true,
    href: "https://github.com/reworkd/",
  },
  {
    title: "Jsonify",
    description:
      "Use AI to turn websites and documents into useful structured data. ",
    usage: "Keep track of OpenAI metrics -- cost, latency, failures, etc.",
    creators: [
      {
        name: "Paul Hunkin",
        href: "https://www.linkedin.com/in/phunkin/",
      },
      {
        name: "Nick Linkevich",
        href: "https://www.linkedin.com/in/nicklink/",
      },
    ],
    imageHref: "/static/community/projects/jsonify.webp",
    tags: [TAGS.Tech],
    href: "https://jsonify.com",
  },
  {
    title: "assistant-ui",
    description: "React components for AI chat.",
    usage: "Get a detailed token cost breakdown per user.",
    creators: [
      {
        name: "Simon Farshid",
        href: "http://linkedin.com/in/simon-farshid",
      },
    ],
    imageHref: "/static/community/projects/assistant-ui.webp",
    tags: [TAGS.Tech],
    isOpenSourced: true,
    href: "https://github.com/Yonom/assistant-ui",
  },
  {
    title: "PitchGhost",
    description:
      "Help companies automatically find customers on social media by scanning and scraping Twitter, Reddit, LinkedIn, etc for posts and content that would make perfect sense for your brand or business to engage with.",
    usage:
      "Our platform involves tons of calls to LLMs to read and digest all of the social media posts we scan through. Helicone has been invaluable to us in checking in and monitoring these systems and especially debugging LLM calls through the playground.",
    creators: [
      {
        name: "Marc Frankel",
        href: "https://twitter.com/pitchghost",
      },
    ],
    imageHref: "/static/community/projects/pitchghost.webp",
    tags: [TAGS.marketing],
    isMonthlySpotlight: true,
    href: "https://pitchghost.com",
  },
  {
    title: "mangosqueezy",
    description:
      "An affiliate marketing platform where businesses connect with affiliates to grow their sales or audience. It's the first crypto-based affiliate marketing platform, which facilitates cross-border payments, real-time settlement in seconds, and zero processing fees.",
    usage:
      "We are using Helicone to monitor our LLM usage so we know how many tokens we have used and which countries the usage is coming from. Additionally, we plan to implement a user rate limiting feature soon.",
    creators: [
      {
        name: "Amit Mirgal",
        href: "https://x.com/amit_mirgal",
      },
      {
        name: "Devika Mahajan",
        href: "https://www.linkedin.com/in/devika--mahajan/",
      },
    ],
    imageHref: "/static/community/projects/mangosqueezy.webp",
    tags: [TAGS.Marketing],
    isOpenSourced: true,
    href: "https://github.com/mangosqueezy/mangosqueezy",
  },
  {
    title: "Greptile",
    description: "AI expert on any codebase, as an API.",
    usage:
      "Tracing and logging LLM calls to debug, track usage, manage costs, and prepare datasets for finetuning.",
    creators: [
      {
        name: "Daksh Gupta",
        href: "https://twitter.com/dakshgup",
      },
      {
        name: "Soohoon Choi",
        href: "https://twitter.com/soohoonchoi",
      },
      {
        name: "Vaishant Kameswaran",
        href: "https://twitter.com/vaishaaant",
      },
    ],
    imageHref: "/static/community/projects/greptile.webp",
    isMonthlySpotlight: true,
    tags: [TAGS.Tech],
    href: "https://greptile.com",
  },
  {
    title: "LinkedInFy",
    description:
      "Automate your LinkedIn, there is no need to waste hrs on your LinkedIn to think about what to post AI will do it for you.",
    usage: "To monitor different LLM model results and see prompts result.",
    creators: [
      {
        name: "Abhishek",
        href: "https://x.com/abhishk_084",
      },
    ],
    imageHref: "/static/community/projects/linkedinfy.webp",
    tags: [TAGS.tech],
    href: "https://www.linkedinfy.com/",
  },
];

export function Projects() {
  // return (
  //   <div>
  //     <div className="md:gap-2 md:flex-row md:justify-start sm:items-start flex flex-col justify-start items-start  bg-[#F0F9FF] border-[#0CA5E9] border border-opacity-20 rounded-lg mx-[12px] p-[24px] mt-[24px]">
  //       {/* eslint-disable-next-line @next/next/no-img-element */}
  //       <img
  //         src={"/static/community/stars_icon.svg"}
  //         alt="Deep Learning"
  //         className="h-[24px]"
  //       />
  //       <div className="mt-[24px] text-[#0CA5E9] font-bold sm:mt-0 sm:whitespace-nowrap">
  //         Using Helicone?{" "}
  //       </div>
  //       <div className="text-[#0CA5E9] sm:whitespace-nowrap">
  //         We want to know what you are building!{" "}
  //       </div>

  //       <Link
  //         href={"https://forms.gle/WpTEEE6vVdQccprD9"}
  //         className="text-[#0CA5E9] sm:whitespace-nowrap"
  //       >
  //         <u className=" hover:text-[#0CA5E9] font-semibold">
  //           Fill out this form
  //         </u>{" "}
  //         to be featured.
  //       </Link>
  //     </div>
  //   </div>
  // );
  return (
    <div className="grid grid-cols-2">
      {projects.map((project, i) => {
        return (
          <Link
            id="featured"
            className="flex flex-col gap-6 w-full hover:bg-sky-50 rounded-lg p-8 col-span-2 md:col-span-1 mt-8"
            href={project.href}
            key={i}
          >
            {/*eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.imageHref}
              alt={project.title}
              width={400}
              height={300}
              style={{
                objectFit: "cover",
              }}
              className="rounded-lg h-60 w-full border border-gray-300"
            />
            <div className="w-full h-fit rounded-lg flex flex-col space-y-2 text-left">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "bg-sky-50 text-sky-700 ring-sky-600/10 w-max items-center rounded-lg px-2 py-1 -my-1 text-sm font-medium ring-1 ring-inset"
                  )}
                >
                  {project.tags.length}
                </span>
                <span className="text-gray-400 text-sm">-</span>
              </div>
              <h2 className="font-semibold text-lg pt-2">{project.title}</h2>
              <p className="text-gray-500 text-sm">{project.description}</p>
              <div className="flex flex-row justify-between gap-4 items-center py-4">
                <div className={clsx("flex items-center space-x-3 bottom-0")}>
                  {project.creators.map((creator, i) => (
                    <div className="flex items-center space-x-2" key={i}>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {creator.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
