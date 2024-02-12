import { useState } from "react";
import { Disclosure } from "@headlessui/react";
import {
  ArrowPathIcon,
  BellAlertIcon,
  CircleStackIcon,
  CodeBracketIcon,
  HandThumbUpIcon,
  LockClosedIcon,
  MinusSmallIcon,
  PlusSmallIcon,
  RectangleStackIcon,
  TagIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChevronRightIcon, HeartIcon } from "@heroicons/react/20/solid";
import NavBarV2 from "../../layout/navbar/navBarV2";
import Footer from "../../layout/footer";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { DEMO_EMAIL } from "../../../lib/constants";
import Image from "next/image";
import { clsx } from "../../shared/clsx";
import Globe from "./globe";
import { Database } from "../../../supabase/database.types";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "../../../services/hooks/localStorage";

const features: {
  title: string;
  description: string;
  icon: React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
      titleId?: string | undefined;
    }
  >;
  color: string;
}[] = [
  {
    title: "Custom Properties",
    description: "Easily segment requests.",
    icon: TagIcon,
    color: "text-purple-700",
  },
  {
    title: "Caching",
    description: "Save time and money.",
    icon: CircleStackIcon,
    color: "text-red-700",
  },
  {
    title: "Rate Limiting",
    description: "Protect your models from abuse.",
    icon: UserIcon,
    color: "text-blue-700",
  },
  {
    title: "Retries",
    description: "Retry failed or rate-limited requests.",
    icon: ArrowPathIcon,
    color: "text-yellow-700",
  },
  {
    title: "Feedback",
    description: "Identify good and bad requests.",
    icon: HandThumbUpIcon,
    color: "text-green-700",
  },
  {
    title: "Vault",
    description: "Securely map your provider keys.",
    icon: LockClosedIcon,
    color: "text-indigo-700",
  },
  {
    title: "Jobs",
    description: "Visualize chains of requests.",
    icon: RectangleStackIcon,
    color: "text-pink-700",
  },
  {
    title: "GraphQL",
    description: "ETL your data to your favorite apps.",
    icon: CodeBracketIcon,
    color: "text-sky-700",
  },
  {
    title: "Alerts",
    description: "Get notified on important events.",
    icon: BellAlertIcon,
    color: "text-rose-700",
  },
];

const faqs = [
  {
    question: "Is there a latency impact to my requests with Helicone's Proxy?",
    answer:
      "Helicone leverages Cloudflare’s global network of servers as proxies for efficient web traffic routing. Cloudflare workers maintain extremely low latency through their worldwide distribution. This results in a fast and reliable proxy for your LLM requests with less than a fraction of a millisecond of latency impact.",
  },
  {
    question: "Do you offer a self-hosted or manage-hosted solution?",
    answer:
      "Our recommended solution is to use our cloud service, but we do offer a dedicated manage-hosted solution for enterprise customers. Please contact us at sales@helicone.ai for more information.",
  },
  {
    question: "I do not want to use the proxy, can I still use Helicone?",
    answer:
      "Yes, you can use Helicone without the proxy. We have packages for Python and Node.js that you can use to send data to Helicone. Visit our documentation page to learn more.",
  },
  // More questions...
];

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const useHomePage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["home-page"],
    queryFn: async () => {
      return fetch("https://api.github.com/repos/helicone/helicone")
        .then((response) => response.json())
        .then((data) => {
          const starsCount = data.stargazers_count;
          return starsCount as number;
        })
        .catch((error) => {
          return null;
        });
    },
  });

  return { stars: data, isLoading };
};

export default function Example() {
  const [demoLoading, setDemoLoading] = useState(false);
  const [showStars, setShowStars] = useLocalStorage("showStars", true);

  const router = useRouter();
  const user = useUser();

  const supabaseClient = useSupabaseClient<Database>();
  const { stars, isLoading } = useHomePage();

  if (!demoLoading && user?.email === DEMO_EMAIL) {
    supabaseClient.auth.signOut();
  }

  return (
    <div className="bg-gray-50 relative">
      <NavBarV2 />
      <div className="relative isolate">
        <svg
          className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_60%_at_top_center,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="abc"
              width={25}
              height={25}
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
            >
              <path d="M25 200V.5M.5 .5H200" fill="none" />
            </pattern>
            <defs>
              <pattern
                id="123"
                width="12.5"
                height="12.5"
                patternUnits="userSpaceOnUse"
              >
                <path d="M12.5 0V12.5M0 12.5H12.5" fill="none" />
              </pattern>
            </defs>
          </defs>
          <rect width="100%" height="100%" strokeWidth={0} fill="url(#abc)" />
        </svg>
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-36 flex flex-col space-y-4 md:space-y-8 items-center justify-center text-left sm:text-center lg:gap-x-10 lg:px-8 antialiased">
          <h1 className="text-5xl sm:text-7xl font-semibold sm:font-medium leading-tight tracking-tight sm:leading-snug max-w-5xl">
            The{" "}
            <span className="md:border-2 border-violet-700 border-dashed text-violet-700 md:py-2 md:px-4">
              easiest
            </span>{" "}
            way to build your{" "}
            <span className="block sm:inline-flex">LLM-applications</span> at{" "}
            <span className="md:border-2 border-pink-700 border-dashed text-pink-700 md:py-2 md:px-4">
              scale
            </span>
          </h1>
          <div className="text-lg sm:text-2xl text-gray-600 md:leading-normal mt-4">
            Join thousands of startups and enterprises who use Helicone&apos;s
            Generative AI{" "}
            <span className="flex-none sm:block">
              platform to monitor, collect data, and scale their LLM-powered
              applications.
            </span>
          </div>

          <div className="flex flex-row gap-8 pt-8">
            <button
              onClick={() => {
                router.push("/signup");
              }}
              className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-xl px-6 py-3 text-md md:text-lg font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Get Started
            </button>
          </div>
          <div className="flex flex-col md:flex-row pt-4 md:divide-x-2 gap-[14px] justify-center w-full items-center divide-gray-300">
            <Link
              href="https://www.ycombinator.com/launches/I73-helicone-open-source-observability-platform-for-generative-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex space-x-6 font-semibold text-gray-600 md:w-52"
            >
              Backed by{" "}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 ml-2"
              >
                <g clipPath="url(#clip0_24_57)">
                  <rect width="24" height="24" rx="5.4" fill="#FF5100"></rect>
                  <rect
                    x="0.5"
                    y="0.5"
                    width="23"
                    height="23"
                    rx="4.9"
                    stroke="#FF844B"
                  ></rect>
                  <path
                    d="M7.54102 7.31818H9.28604L11.9458 11.9467H12.0552L14.715 7.31818H16.46L12.7662 13.5028V17.5H11.2349V13.5028L7.54102 7.31818Z"
                    fill="white"
                  ></path>
                </g>
                <rect
                  x="0.5"
                  y="0.5"
                  width="23"
                  height="23"
                  rx="4.9"
                  stroke="#FF5100"
                  strokeOpacity="0.1"
                ></rect>
                <rect
                  x="0.5"
                  y="0.5"
                  width="23"
                  height="23"
                  rx="4.9"
                  stroke="url(#paint0_radial_24_57)"
                ></rect>
                <defs>
                  <radialGradient
                    id="paint0_radial_24_57"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(7.35) rotate(58.475) scale(34.1384)"
                  >
                    <stop stopColor="white" stopOpacity="0.56"></stop>
                    <stop
                      offset="0.28125"
                      stopColor="white"
                      stopOpacity="0"
                    ></stop>
                  </radialGradient>
                  <clipPath id="clip0_24_57">
                    <rect width="24" height="24" rx="5.4" fill="white"></rect>
                  </clipPath>
                </defs>
              </svg>{" "}
              Combinator
            </Link>
            <div className="font-semibold text-gray-600 pl-4 flex items-center md:w-56">
              Fully open-source{" "}
              <HeartIcon className="h-4 w-4 inline ml-2 text-pink-500" />
            </div>
          </div>
          <div className="w-full grid grid-cols-8 max-w-6xl mx-auto h-full pt-36 justify-between gap-8 sm:gap-16 text-left">
            <div className="w-full flex flex-col col-span-8 sm:col-span-4">
              <h3 className="mt-8 text-4xl md:text-5xl font-semibold flex flex-col tracking-tighter leading-tight">
                Modern startups and enterprises use Helicone
              </h3>
              <p className="text-lg text-gray-600 md:leading-normal mt-4">
                Our startup customers love Helicone for its easy integration and
                powerful insights. Our enterprise customers love Helicone for
                its scalability and reliability.
              </p>
              <div className="flex items-center gap-4 mt-8">
                <Link
                  href="/signup"
                  className="flex items-center bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-lg pl-3 pr-2 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                >
                  Get Started <ChevronRightIcon className="w-5 h-5 inline" />
                </Link>
                <Link
                  href="/sales"
                  className="font-semibold text-sm flex items-center"
                >
                  Contact Sales <ChevronRightIcon className="w-5 h-5 inline" />
                </Link>
              </div>
            </div>
            <div className="w-fit h-fit mt-16 sm:mt-8 grid grid-cols-3 gap-8 relative col-span-8 sm:col-span-4">
              {[
                "/assets/home/logos/logo.svg",
                "/assets/home/logos/qawolf.png",
                "/assets/home/logos/upenn.png",
                "/assets/home/logos/carta.png",
                "/assets/home/logos/lex.svg",
                "/assets/home/logos/particl.png",
                "/assets/home/logos/mintlify.svg",
                "/assets/home/logos/onboard.png",
                "/assets/home/logos/autogpt.png",
              ].map((item, i) => (
                <div
                  key={i}
                  className={clsx(
                    i === 1 && "rotate-12 translate-x-8 -translate-y-8",
                    i === 2 && "translate-x-16 -translate-y-20",
                    i === 5 && "-rotate-12 translate-x-8 -translate-y-8",
                    `h-20 w-20 sm:h-28 sm:w-28 border-4 border-black rounded-lg shadow-lg flex items-center justify-center font-semibold text-sm bg-white`
                  )}
                >
                  <Image src={item} alt={""} width={80} height={80} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <section
        id="features"
        className="bg-gradient-to-b from-gray-50 to-gray-200 mt-24 pb-24 antialiased"
      >
        <div className="px-4 md:px-8 max-w-6xl justify-center items-center text-left sm:text-center flex flex-col mx-auto w-full space-y-8">
          <div className="flex flex-col space-y-4 w-full">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter leading-tight">
              Monitoring has never been easier
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto md:leading-normal">
              Designed to work out of the box, Helicone provides meaningful
              insights that help you understand your applications performance in
              real-time.
            </p>
            <div className="flex flex-row gap-6 pt-4 w-full sm:justify-center">
              <button
                onClick={() => {
                  router.push("/signup");
                }}
                className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-xl px-6 py-3 text-md md:text-lg font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Get Started
              </button>
            </div>
            <div className="grid grid-cols-8 gap-4 w-full py-8">
              <div className="bg-gradient-to-b from-gray-100 to-white border border-gray-300 col-span-8 md:col-span-5 rounded-xl  h-[26rem] flex flex-col p-8">
                <div className="w-full h-full flex relative mb-8 justify-center">
                  <Image
                    className="z-20 absolute bottom-0 shadow-sm rounded-lg border border-gray-200 col-span-2 max-h-48 w-fit object-contain lg:col-span-1"
                    src="/assets/home/bento/requests.webp"
                    alt="requests"
                    width={980}
                    height={604}
                  />
                  <Image
                    className="hidden md:block absolute bottom-16 right-0 shadow-sm rounded-lg border border-gray-200 col-span-2 max-h-44 w-fit object-contain lg:col-span-1"
                    src="/assets/home/bento/users.webp"
                    alt="users"
                    width={980}
                    height={604}
                  />
                  <Image
                    className="hidden md:block absolute bottom-10 left-0 shadow-sm rounded-lg border border-gray-200 col-span-2 max-h-48 w-fit object-contain lg:col-span-1"
                    src="/assets/home/bento/costs.webp"
                    alt="costs"
                    width={908}
                    height={608}
                  />
                </div>
                <div className="flex flex-col mt-auto space-y-2">
                  <h3 className="text-3xl font-semibold">
                    Meaningful Insights
                  </h3>
                  <p className="text-md text-gray-600">
                    High-level metrics to help you monitor your application
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-b from-gray-100 to-white border border-gray-300 col-span-8 md:col-span-3 rounded-xl h-[26rem] flex flex-col p-8">
                <div className="flex flex-col mt-auto space-y-2">
                  <div className="w-full h-full flex flex-col space-y-12 mb-8 justify-center">
                    <div className="flex flex-row gap-4 mx-auto">
                      <div className="text-7xl text-green-500 flex gap-0.5">
                        <span>+</span>
                        <span>2</span>
                      </div>
                      <div className="text-7xl text-red-500 flex gap-0.5">
                        <span>-</span>
                        <span>2</span>
                      </div>
                    </div>
                    <div className="flex flex-row gap-2 mx-auto">
                      <div className="h-8 w-8 border border-gray-200 bg-green-500" />
                      <div className="h-8 w-8 border border-gray-200 bg-green-500" />
                      <div className="h-8 w-8 border border-gray-200 bg-red-500" />
                      <div className="h-8 w-8 border border-gray-200 bg-red-500" />
                      <div className="h-8 w-8 border border-gray-200 bg-gray-500" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-semibold">2 lines of code</h3>
                  <p className="text-md text-gray-600">
                    Get integrated in seconds. Not days.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-b from-gray-100 to-white border border-gray-300 col-span-8 md:col-span-3 rounded-xl h-[26rem] flex flex-col p-8">
                <div className="flex flex-col mt-auto space-y-2">
                  <div className="w-full h-full flex flex-col mb-8 justify-center items-center">
                    <Image
                      className="shadow-sm rounded-lg border border-gray-200 col-span-2 max-h-56 w-fit object-contain lg:col-span-1"
                      src="/assets/home/bento/models.png"
                      alt="costs"
                      width={778}
                      height={612}
                    />
                  </div>
                  <h3 className="text-3xl font-semibold">Model Breakdown</h3>
                  <p className="text-md text-gray-600">
                    Understand your model usage and costs.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-b from-gray-100 to-white border border-gray-300 col-span-8 md:col-span-5 rounded-xl h-[26rem] flex flex-col p-8">
                <div className="flex flex-col mt-auto space-y-2">
                  <div className="w-full h-full flex relative mb-4 justify-center">
                    <Image
                      className="z-20 absolute bottom-0 shadow-sm rounded-lg border border-gray-300 col-span-2 max-h-[15.5rem] w-fit object-contain lg:col-span-1"
                      src="/assets/home/bento/experiment.png"
                      alt="requests"
                      width={1860}
                      height={834}
                    />
                  </div>
                  <h3 className="text-3xl font-semibold">
                    Practical Playground
                  </h3>
                  <p className="text-md text-gray-600">
                    Easily replay, debug, and experiment with your user&apos;s
                    sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        id="integration"
        className="bg-gradient-to-b from-gray-200 to-gray-50 py-36 antialiased"
      >
        <div className="px-4 md:px-8 max-w-6xl justify-center items-center text-left sm:text-center flex flex-col mx-auto w-full space-y-8">
          <div className="flex flex-col space-y-4">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter leading-tight">
              Any model, any scale
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl">
              We support any provider and model, as well as fine-tuned models.
              All with sub millisecond latency and query times.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 md:justify-center w-full">
            <div className="relative isolate bg-white h-[32rem] w-full border border-gray-300 shadow-sm rounded-xl flex justify-center items-center">
              <div className="w-full h-full rounded-xl p-8 flex flex-col space-y-4 text-left">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Support for all models
                </h2>
                <p className="text-lg text-gray-600 max-w-[18rem]">
                  Our custom-built mapper engine and gateway allows us to
                  support any model from any provider.
                </p>
              </div>
              <div className="bottom-0 absolute w-full">
                <div className="w-full flex flex-row space-x-4 justify-end p-8 relative h-full">
                  <div className="flex flex-col space-y-4 justify-end">
                    <Image
                      src={"/assets/home/providers/bard.png"}
                      alt={"bard"}
                      width={80}
                      height={80}
                      className="border border-gray-300 rounded-lg block md:hidden"
                    />
                    <Image
                      src={"/assets/home/providers/bard.png"}
                      alt={"bard"}
                      width={112}
                      height={112}
                      className="border border-gray-300 rounded-lg hidden md:block"
                    />
                  </div>
                  <div className="flex flex-col justify-end space-y-4">
                    <Image
                      src={"/assets/home/providers/llama2.png"}
                      alt={"llama2"}
                      width={80}
                      height={80}
                      className="border border-gray-300 rounded-lg block md:hidden"
                    />
                    <Image
                      src={"/assets/home/providers/llama2.png"}
                      alt={"llama2"}
                      width={112}
                      height={112}
                      className="border border-gray-300 rounded-lg hidden md:block"
                    />
                    <Image
                      src={"/assets/home/providers/together.png"}
                      alt={"together"}
                      width={80}
                      height={80}
                      className="border border-gray-300 rounded-lg block md:hidden"
                    />
                    <Image
                      src={"/assets/home/providers/together.png"}
                      alt={"together"}
                      width={112}
                      height={112}
                      className="border border-gray-300 rounded-lg hidden md:block"
                    />
                  </div>
                  <div className="flex flex-col space-y-4">
                    <Image
                      src={"/assets/home/providers/openai.png"}
                      alt={"openai"}
                      width={80}
                      height={80}
                      className="border border-gray-300 rounded-lg block md:hidden"
                    />
                    <Image
                      src={"/assets/home/providers/openai.png"}
                      alt={"openai"}
                      width={112}
                      height={112}
                      className="border border-gray-300 rounded-lg hidden md:block"
                    />
                    <Image
                      src={"/assets/home/providers/anthropic.png"}
                      alt={"ant"}
                      width={80}
                      height={80}
                      className="border border-gray-300 rounded-lg block md:hidden"
                    />

                    <Image
                      src={"/assets/home/providers/anthropic.png"}
                      alt={"anthropic"}
                      width={112}
                      height={112}
                      className="border border-gray-300 rounded-lg hidden md:block"
                    />
                    <Image
                      src={"/assets/home/providers/mistral.png"}
                      alt={"mis"}
                      width={80}
                      height={80}
                      className="border border-gray-300 rounded-lg block md:hidden"
                    />
                    <Image
                      src={"/assets/home/providers/mistral.png"}
                      alt={"mis"}
                      width={112}
                      height={112}
                      className="border border-gray-300 rounded-lg hidden md:block"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-hidden relative isolate bg-white h-[32rem] w-full border border-gray-300 shadow-sm rounded-xl flex justify-center items-center">
              <div className="w-full h-full rounded-xl p-8 flex flex-col space-y-4 text-left">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Built for scale
                </h2>
                <p className="text-lg text-gray-600 max-w-[18rem]">
                  We meticulously designed Helicone to support millions of
                  requests per second with no latency impact.
                </p>
              </div>
              <div className="-bottom-44 md:-bottom-32 items-center flex absolute md:-right-32 w-full justify-end">
                <Globe />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="tooling" className="bg-gray-50 py-24 antialiased">
        <div className="px-4 md:px-8 max-w-6xl justify-center items-center text-left sm:text-center flex flex-col mx-auto w-full space-y-8">
          <div className="flex flex-col space-y-4">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter leading-tight">
              Purpose-built tooling for LLM developers.
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Everything you need to build, deploy, and scale your LLM-powered
              application
            </p>
            <div className="flex flex-row gap-6 pt-4 w-full justify-center">
              <Link
                href="https://docs.helicone.ai/introduction"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-xl px-6 py-3 text-sm md:text-md font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                View Docs
              </Link>
              <Link
                href="https://discord.gg/zsSTcH2qhG"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-200 whitespace-nowrap border border-gray-900 rounded-xl px-6 py-3 text-sm md:text-md font-semibold text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Join Discord
              </Link>
            </div>
          </div>
          <div className="flex flex-col divide-y divide-gray-300 w-full">
            <div className="h-full rounded-xl flex flex-col text-left p-2 md:p-12">
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 md:justify-center -mt-2 ">
                {features.map((f, idx) => (
                  <li
                    key={idx}
                    className="flex flex-row gap-6 justify-start items-start pt-6 w-full"
                  >
                    <div className="relative isolate bg-white h-16 w-16 border border-gray-300 shadow-sm rounded-lg flex justify-center items-center">
                      <svg
                        className="absolute inset-0 -z-10 h-full w-full"
                        aria-hidden="true"
                      >
                        <rect
                          width="100%"
                          height="100%"
                          strokeWidth={0}
                          fill="url(#123)"
                        />
                      </svg>
                      <f.icon className={clsx(f.color, "h-6 w-6")} />
                    </div>
                    <div className="flex flex-col space-y-1 w-48">
                      <p className="text-black font-semibold text-lg text-left">
                        {f.title}
                      </p>
                      <p className="text-gray-700 text-md text-left">
                        {f.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section id="faq" className="bg-gray-50 pt-36 pb-48 antialiased">
        <div className="mx-auto px-4 md:px-8 max-w-6xl divide-y divide-gray-900/10 ">
          <div className="flex flex-col space-y-4  text-left sm:text-center ">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter leading-tight">
              Frequently asked questions
            </h2>
          </div>
          <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
            {faqs.map((faq) => (
              <Disclosure as="div" key={faq.question} className="pt-6">
                {({ open }) => (
                  <div>
                    <dt>
                      <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                        <span className="text-base font-semibold leading-7">
                          {faq.question}
                        </span>
                        <span className="ml-6 flex h-7 items-center">
                          {open ? (
                            <MinusSmallIcon
                              className="h-6 w-6"
                              aria-hidden="true"
                            />
                          ) : (
                            <PlusSmallIcon
                              className="h-6 w-6"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                      </Disclosure.Button>
                    </dt>
                    <Disclosure.Panel as="dd" className="mt-2 pr-12">
                      <p className="text-base leading-7 text-gray-600">
                        {faq.answer}
                      </p>
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            ))}
          </dl>
        </div>
      </section>
      {showStars && (
        <div className="bg-purple-600 text-xs rounded-3xl w-fit px-4 py-2 bottom-8 mx-auto flex sticky z-50 justify-between items-center gap-4">
          <p className="text-white font-mono tracking-tighter">
            Star us on Github
          </p>
          <Link
            className="flex flex-row items-center text-xs font-semibold ring-1 ring-gray-300"
            href={"https://github.com/Helicone/helicone"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="bg-gray-300 px-2 py-1 flex items-center ">
              <svg
                fill="currentColor"
                viewBox="0 0 24 24"
                width="16"
                height="16"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Star</span>
            </div>
            <div className="bg-gray-100 px-2 py-1">
              {stars && stars > 999
                ? `${Math.round(stars / 100) / 10}k`
                : stars}
            </div>
          </Link>
          <button
            onClick={() => {
              setShowStars(false);
            }}
          >
            <XMarkIcon className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
