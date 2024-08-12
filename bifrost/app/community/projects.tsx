import { clsx } from "@/utils/clsx";
import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/20/solid";

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
  civictech: {
    name: "Civic Technology",
    href: "",
  },
  automotive: {
    name: "Automotive",
    href: "",
  },
  customersupport: {
    name: "Customer Support",
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
    title: "Chatwith",
    description:
      "Instantly answer questions with your custom no-code AI chatbot.",
    usage:
      "I love the extra insight Helicone gives me into my LLM usage. I appreciate both the big picture overview and the opportunity to drill into every request. It helps me keep my product stable & performant and optimize the costs.",
    creators: [
      {
        name: "Rafal Zawadzki",
        href: "https://x.com/rafal_makes",
      },
    ],
    imageHref: "/static/community/projects/chatwith.webp", // <- change this
    tags: [TAGS.customersupport],
    href: "https://chatwith.tools",
  },
  {
    title: "DeAP Learning",
    description:
      "An AI personal tutor that helps students feel excited and supported at every step on their educational journey.",
    usage:
      "Helicone is the perfect one-stop-shop for us to monitor all our our LLM queries. The observability & speed is unmatched for the price point.",
    creators: [
      {
        name: "Anish Anne",
        href: "https://www.linkedin.com/in/anish-anne",
      },
      {
        name: "Neil Shah",
        href: "https://www.linkedin.com/in/n-shah/",
      },
      {
        name: "Harry Fazzone",
        href: "https://www.linkedin.com/in/harry-fazzone-6ab0a0240/",
      },
    ],
    imageHref: "/static/community/projects/deaplearning.webp", // <- change this
    tags: [TAGS.education],
    href: "https://deaplearning.com",
  },
  {
    title: "elcerokm",
    description: "Connect car dealerships with car buyers.",
    usage:
      "We built a chatbot to capture leads and help users find the best car in the market. Helicone helps us monitor the expenses.",
    creators: [
      {
        name: "Maria Bernardez",
        href: "https://www.linkedin.com/in/angelesbernardez/",
      },
    ],
    imageHref: "/static/community/projects/elcerokm.webp", // <- change this
    tags: [TAGS.automotive],
    href: "https://elcerokm.com",
  },
  {
    title: "Charm",
    description:
      "AI Sales Chatbot for B2B Growth & Marketing Teams. 1 line of code, double conversion rate.",
    usage:
      "Helicone has solved LLM observability for us. Integration was painless and now we can quickly see what's happening under the hood for requests & embeddings across all of our LLMs. Totally recommend.",
    creators: [
      {
        name: "Izu Elechi",
        href: "https://www.linkedin.com/in/izuchukwu/",
      },
      {
        name: "Caleb Lewis",
        href: "https://www.linkedin.com/in/developercaleb/",
      },
    ],
    imageHref: "/static/community/projects/charm.webp", // <- change this
    tags: [TAGS.tech],
    href: "https://joincharm.com/",
  },
  {
    title: "Dating Studio",
    description:
      "Copilot for Dating Apps. Designed to elevate your chats, not replace them.",
    usage:
      "Logging AI requests to unlock insights into how models are performing to optimize the experience and pick the best match for users' tasks.",
    creators: [
      {
        name: "LV",
        href: "",
      },
    ],
    imageHref: "/static/community/projects/dating-studio.webp",
    tags: [TAGS.tech],
    href: "https://about.dating.studio/extension",
  },
  {
    title: "Open Council Network",
    description:
      "Make the decision making process of local government accessible to citizens.",
    usage:
      "We use LLMs to transcribe council meetings, extract data from them, and generate summaries and email updates. Helicone has been invaluable to monitor, track and optimise those queries, and to allow us to compare performance across different LLM providers, so that we don't feel locked in to any provider and can make effective decisions to optimise costs and performance.",
    creators: [
      {
        name: "Toby Abel",
        href: "",
      },
    ],
    imageHref: "/static/community/projects/open-council-network.webp", // <- change this
    tags: [TAGS.civictech],
    href: "https://opencouncil.network",
  },
  {
    title: "Haema",
    description:
      "Help people with diabetes learn how food and exercise affects their blood sugar.",
    usage:
      "We use Helicone to log all of the requests to our AI and we're using the logged data to directly improve our product.",
    creators: [
      {
        name: "Pranav Ahluwalia",
        href: "https://x.com/PranavAhl",
      },
    ],
    imageHref: "/static/community/projects/haema.webp",
    tags: [TAGS.healthcare],
    href: "https://www.haema.co/",
  },
  {
    title: "DemoFox",
    description:
      "Translate jargon instantly, articulate business value, and make inter-department communication hassle-free.",
    usage:
      "We use Helicone to understand why a prompt fails to return valid data.",
    creators: [
      {
        name: "Tim Elam",
        href: "https://linkedin.com/company/demofox",
      },
    ],
    imageHref: "/static/community/projects/demofox.webp",
    tags: [TAGS.tech],
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
    tags: [TAGS.education],
    isOpenSourced: true,
    href: "https://codecrafters.io/",
  },
  {
    title: "Reworkd",
    description: "The simplest way to extract structured web data.",
    usage: "We are using Helicone for API logging and cost analysis.",
    creators: [
      {
        name: "Asim Shrestha",
        href: "https://www.linkedin.com/company/reworkd/",
      },
    ],
    imageHref: "/static/community/projects/reworkd.webp",
    tags: [TAGS.tech],
    isOpenSourced: true,
    href: "https://github.com/reworkd/",
  },
  {
    title: "Jsonify",
    description:
      "Use AI to turn websites and documents into useful structured data. ",
    usage:
      "Helicone helps us keep track of OpenAI metrics -- cost, latency, failures, etc.",
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
    tags: [TAGS.tech],
    href: "https://jsonify.com",
  },
  {
    title: "assistant-ui",
    description: "React components for AI chat.",
    usage: "We use Helicone to get a detailed token cost breakdown per user.",
    creators: [
      {
        name: "Simon Farshid",
        href: "http://linkedin.com/in/simon-farshid",
      },
    ],
    imageHref: "/static/community/projects/assistant-ui.webp",
    tags: [TAGS.tech],
    isOpenSourced: true,
    href: "https://github.com/Yonom/assistant-ui",
  },
  {
    title: "PitchGhost",
    description:
      "Find customers on social media that your brand or business should engage with.",
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
      "The first crypto-based affiliate marketing platform to connect businesses with affiliates and grow their sales or audience.",
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
    tags: [TAGS.marketing],
    isOpenSourced: true,
    href: "https://github.com/mangosqueezy/mangosqueezy",
  },
  {
    title: "Greptile",
    description: "AI expert on any codebase, as an API.",
    usage:
      "We use Helicone for tracing and logging LLM calls to debug, track usage, manage costs, and prepare datasets for finetuning.",
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
    tags: [TAGS.tech],
    href: "https://greptile.com",
  },
  {
    title: "LinkedInFy",
    description: "Automate your LinkedIn posts, free up your time.",
    usage:
      "Helicone helps us monitor different LLM model results and see prompts result.",
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
    <div>
      {/* Submit a project banner */}
      <div className="flex justify-center mt-[24px] mb-[8px] space-x-2">
        <div className="flex flex-col items-center sm:flex-row justify-center space-x-2 py-4 px-6 sm:px-16 bg-sky-50 border border-sky-100 rounded-md">
          <SparklesIcon className="h-5 w-5 text-sky-500" />
          <div className="text-sm text-sky-500 font-semibold text-center sm:text-left">
            Using Helicone? We want to know what you are building!
          </div>
          <Link
            href={"https://forms.gle/WpTEEE6vVdQccprD9"}
            className=" text-sm text-sky-500 sm:whitespace-nowrap"
          >
            <u className="hover:text-sky-500">Fill out this form</u> to be
            featured.
          </Link>
        </div>
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {projects.map((project, i) => {
          return (
            <div
              className="flex flex-col justify-between h-full gap-4 items-left py-4"
              key={i}
            >
              <Link
                id="featured"
                className="flex flex-col gap-4 w-full h-full hover:bg-sky-50 rounded-lg p-4 col-span-2 md:col-span-1 mt-2"
                href={project.href}
                key={i}
                target="_blank"
              >
                {/*eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.imageHref}
                  alt={project.title}
                  width={400}
                  height={250}
                  style={{
                    objectFit: "cover",
                  }}
                  className="rounded-lg h-64 sm:h-56 md:h-44 w-full border border-gray-200"
                />

                {/* Overlay for tags and description */}
                <div className="w-full h-fit rounded-lg flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    {/* Industry tag */}
                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={clsx(
                          "bg-sky-50 text-sky-700 ring-sky-600/10 w-max items-center rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset"
                        )}
                      >
                        {tag.name}
                      </span>
                    ))}

                    {/* Open Source tag */}
                    {project.isOpenSourced && (
                      <span className="bg-sky-500 bg-opacity-10 text-sky-500 rounded-md px-2 py-1 text-xs font-semibold">
                        Open-source
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-md pt-2 text-gray-700">
                    {project.title}
                  </h2>
                  <p className="text-gray-500 text-sm">{project.description}</p>
                  <br></br>
                  <p className="text-sky-500 text-sm font-medium">
                    {'"'}
                    {project.usage}
                    {'"'}
                  </p>
                </div>
              </Link>

              {/* Creators tag */}
              <div className={clsx("flex items-center")}>
                {project.creators.map((creator, i) => (
                  <div key={i} className="flex items-center px-4 py-1">
                    <a
                      href={creator.href || undefined}
                      target={creator.href ? "_blank" : undefined}
                      rel={creator.href ? "noopener noreferrer" : undefined}
                      className={clsx(
                        "text-xs font-medium",
                        creator.href
                          ? "text-sky-500 hover:underline"
                          : "text-gray-500"
                      )}
                    >
                      {creator.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
